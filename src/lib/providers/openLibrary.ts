import type { AvailabilityItem, SearchResult } from "@/lib/types";

interface OpenLibraryDoc {
  key: string; // "/works/OL12345W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  ratings_average?: number;
}

function normalize(doc: OpenLibraryDoc): SearchResult {
  const id = doc.key.replace("/works/", "");
  return {
    id,
    source: "open_library",
    type: "bok",
    title: doc.title,
    year: doc.first_publish_year ?? null,
    posterUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    description: null,
    rating: doc.ratings_average ? doc.ratings_average.toFixed(1) : null,
    genre: doc.author_name?.slice(0, 2).join(", ") ?? null,
    extra: doc.number_of_pages_median ? `${doc.number_of_pages_median} sidor` : null,
  };
}

/** Used as a fallback when Google Books has no hits — fully free, no API key. */
export async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "15");
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i,number_of_pages_median,ratings_average"
  );
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`Open Library-anrop misslyckades (${res.status})`);
  const data = await res.json();
  const docs: OpenLibraryDoc[] = data.docs ?? [];
  return docs.map(normalize);
}

export async function getOpenLibraryDetails(id: string): Promise<SearchResult> {
  const res = await fetch(`https://openlibrary.org/works/${id}.json`, {
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) throw new Error(`Open Library-anrop misslyckades (${res.status})`);
  const data = await res.json();
  const description =
    typeof data.description === "string" ? data.description : data.description?.value ?? null;
  const cover = data.covers?.[0];
  return {
    id,
    source: "open_library",
    type: "bok",
    title: data.title ?? "Okänd titel",
    year: null,
    posterUrl: cover ? `https://covers.openlibrary.org/b/id/${cover}-L.jpg` : null,
    description,
    rating: null,
    genre: null,
    extra: null,
  };
}

/**
 * There's no free, real-time "is this book in stock" API for Swedish
 * retailers, so instead of pretending to check availability we hand back
 * direct search links — clearly labelled as searches, not confirmed stock.
 */
export function bookRetailerLinks(title: string, author?: string | null): AvailabilityItem[] {
  const q = encodeURIComponent(author ? `${title} ${author}` : title);
  return [
    { name: "Bokus", mode: "Sök & köp", primary: true, url: `https://www.bokus.com/cgi-bin/product_search.cgi?ac_used=false&text=${q}` },
    { name: "Adlibris", mode: "Sök & köp", primary: true, url: `https://www.adlibris.com/se/sok?q=${q}` },
    { name: "Storytel", mode: "Sök (ljudbok/e-bok)", primary: true, url: `https://www.storytel.com/se/search?q=${q}` },
    { name: "Libris (bibliotek)", mode: "Sök & låna", primary: false, url: `https://libris.kb.se/hitlist?q=${q}` },
  ];
}
