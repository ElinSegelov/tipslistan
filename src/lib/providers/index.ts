import type { ContentType } from "@/lib/categories";
import type { AvailabilityResult, SearchResult } from "@/lib/types";
import { searchTmdb, getTmdbDetails, getWatchProviders } from "./tmdb";
import { searchGoogleBooks, getGoogleBookDetails } from "./googleBooks";
import { searchOpenLibrary, getOpenLibraryDetails, bookRetailerLinks } from "./openLibrary";
import { searchRawg, getRawgDetails } from "./rawg";
import { searchBgg, getBggDetails } from "./bgg";

export async function search(type: ContentType, query: string): Promise<SearchResult[]> {
  switch (type) {
    case "film":
    case "serie":
      return searchTmdb(query, type);
    case "bok": {
      // Fall back to Open Library both when Google Books comes up empty AND
      // when the call itself fails (e.g. the shared keyless quota gets rate
      // limited with 429) — a failed request shouldn't fail the whole search
      // when a free, keyless fallback is right there.
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
  id: string
): Promise<SearchResult> {
  switch (type) {
    case "film":
    case "serie":
      return getTmdbDetails(id, type);
    case "bok":
      return source === "open_library" ? getOpenLibraryDetails(id) : getGoogleBookDetails(id);
    case "spel":
      return (await getRawgDetails(id)).result;
    case "brädspel":
      return (await getBggDetails(id)).result;
  }
}

export async function getAvailability(
  type: ContentType,
  source: string,
  id: string,
  country: string,
  title: string
): Promise<AvailabilityResult> {
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
