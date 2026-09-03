import type { ContentType } from "@/lib/categories";
import type { AvailabilityResult, SearchResult } from "@/lib/types";
import { searchTmdb, getTmdbDetails, getWatchProviders } from "./tmdb";
import { searchGoogleBooks, getGoogleBookDetails } from "./googleBooks";
import { searchOpenLibrary, getOpenLibraryDetails, bookRetailerLinks } from "./openLibrary";
import { searchLibris } from "./libris";
import { searchRawg, getRawgDetails } from "./rawg";
import { searchBgg, getBggDetails } from "./bgg";

export async function search(type: ContentType, query: string): Promise<SearchResult[]> {
  switch (type) {
    case "film":
    case "serie":
      return searchTmdb(query, type);
    case "bok": {
      // LIBRIS (Kungliga biblioteket) i första hand — bäst svensk metadata
      // (rätt svensk titel/utgåva/förlag, som Google Books ofta saknar),
      // men inga omslagsbilder alls. De hämtas separat i getDetails() nedan
      // via Google Books/Open Library när användaren väljer en LIBRIS-träff.
      // Faller tillbaka på Google Books och sedan Open Library — som förut
      // — om LIBRIS inte ger napp eller anropet misslyckas.
      try {
        const libris = await searchLibris(query);
        if (libris.length > 0) return libris;
      } catch (err) {
        console.error("LIBRIS-sökning misslyckades, faller tillbaka på Google Books:", err);
      }
      try {
        const google = await searchGoogleBooks(query);
        if (google.length > 0) return google;
      } catch (err) {
        console.error("Google Books-sökning misslyckades, faller tillbaka på Open Library:", err);
      }
      return searchOpenLibrary(query);
    }
    case "spel":
      return searchRawg(query);
    case "brädspel":
      return searchBgg(query);
  }
}

/**
 * Refetches full details for a saved tip's source record — used right
 * before showing the detail page so poster/description/rating stay fresh
 * even if they weren't fully known at save time (BGG search, for instance,
 * doesn't return an image).
 */
export async function getDetails(
  type: ContentType,
  source: string,
  id: string,
  // Rik, redan känd metadata från sökresultatet — behövs bara för LIBRIS
  // (se getLibrisCover) eftersom LIBRIS inte kan slås upp igen på id här;
  // vi vill inte gissa på nytt när vi redan har pålitlig svensk metadata.
  hint?: { title?: string; year?: number | null; genre?: string | null }
): Promise<SearchResult> {
  switch (type) {
    case "film":
    case "serie":
      return getTmdbDetails(id, type);
    case "bok":
      if (source === "libris") return getLibrisCover(id, hint);
      return source === "open_library" ? getOpenLibraryDetails(id) : getGoogleBookDetails(id);
    case "spel":
      return (await getRawgDetails(id)).result;
    case "brädspel":
      return (await getBggDetails(id)).result;
  }
}

/**
 * LIBRIS har inga omslagsbilder — när en LIBRIS-träff väljs i sökningen
 * slår vi istället upp omslag/beskrivning/betyg via Google Books (med Open
 * Library som reserv) på titel + författare, men behåller titel/år/
 * författare som redan är känd och pålitlig från LIBRIS-sökträffen
 * ("hint") istället för att förlita oss på vad omslagskällan råkar hitta.
 */
async function getLibrisCover(
  id: string,
  hint?: { title?: string; year?: number | null; genre?: string | null }
): Promise<SearchResult> {
  const title = hint?.title;
  if (!title) {
    throw new Error("Saknar titel för att slå upp omslag till LIBRIS-träffen.");
  }
  const author = hint?.genre?.split(",")[0]?.trim();

  // Enkel fritextsökning — inga intitle:/inauthor:-operatorer. De kombinerat
  // med langRestrict=sv (som searchGoogleBooks annars alltid sätter) gjorde
  // sökningen alldeles för strikt: så fort Googles egen språktaggning på
  // just den utgåvan inte råkade vara "sv", eller titeln stavades något
  // annorlunda än i LIBRIS post, gav det noll träffar och alltså inget
  // omslag alls — trots att en vanlig fritextsökning på samma titel hade
  // hittat den utan problem (precis som det fungerade innan LIBRIS lades
  // till). swedishOnly: false av samma anledning — vi litar redan på
  // LIBRIS metadata, det enda vi vill av Google/Open Library här är ett
  // omslag, oavsett vilket språk Google råkat tagga sin post med.
  async function findCover(query: string): Promise<SearchResult | null> {
    try {
      const hit = (await searchGoogleBooks(query, { swedishOnly: false }))[0];
      if (hit) return hit;
    } catch (err) {
      // Google Books delade nyckellösa kvot blir lätt rate-limitad (429) —
      // se README för hur du skaffar en egen gratisnyckel
      // (GOOGLE_BOOKS_API_KEY) om det här loggas ofta.
      console.error(`LIBRIS-omslag: Google Books-sökning misslyckades för "${query}", provar Open Library:`, err);
    }
    try {
      return (await searchOpenLibrary(query))[0] ?? null;
    } catch (err) {
      console.error(`LIBRIS-omslag: Open Library-sökning misslyckades för "${query}":`, err);
      return null;
    }
  }

  // Först titel + författare (mest träffsäkert), sedan bara titeln om det
  // inte gav något — t.ex. om författarnamnet är stavat olika mellan
  // LIBRIS och omslagskällan.
  const cover =
    (author ? await findCover(`${title} ${author}`) : null) ?? (await findCover(title));
  if (!cover) {
    console.error(`LIBRIS-omslag: inget omslag hittades alls för "${title}"${author ? ` (${author})` : ""}.`);
  }

  return {
    id,
    source: "libris",
    type: "bok",
    title,
    year: hint?.year ?? cover?.year ?? null,
    posterUrl: cover?.posterUrl ?? null,
    description: cover?.description ?? null,
    rating: cover?.rating ?? null,
    genre: hint?.genre ?? cover?.genre ?? null,
    extra: cover?.extra ?? null,
  };
}

export async function getAvailability(
  type: ContentType,
  source: string,
  id: string,
  country: string,
  title: string
): Promise<AvailabilityResult> {
  // Manually added tips (see src/lib/actions/tips.ts) have no real provider
  // record behind them — `id` is just a random uuid — so there's nothing to
  // look up. Books are the exception: their retailer links are built from
  // the title, not the id, so those still work for manual entries too.
  if (source === "manual") {
    if (type === "bok") return { items: bookRetailerLinks(title), countryAware: false };
    return { items: [], countryAware: false };
  }

  switch (type) {
    case "film":
    case "serie":
      return getWatchProviders(id, type, country);
    case "bok":
      return { items: bookRetailerLinks(title), countryAware: false };
    case "spel":
      return { items: (await getRawgDetails(id)).platforms, countryAware: false };
    case "brädspel":
      return { items: (await getBggDetails(id)).info, countryAware: false };
  }
}
