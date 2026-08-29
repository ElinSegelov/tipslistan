import type { SearchResult } from "@/lib/types";

const API_BASE = "https://www.googleapis.com/books/v1/volumes";

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    averageRating?: number;
    pageCount?: number;
    categories?: string[];
  };
}

function normalize(item: GoogleBookItem): SearchResult {
  const info = item.volumeInfo;
  const year = info.publishedDate ? Number(info.publishedDate.slice(0, 4)) : null;
  return {
    id: item.id,
    source: "google_books",
    type: "bok",
    title: info.title ?? "Okänd titel",
    year: Number.isFinite(year) ? year : null,
    // Google's cover thumbnails are served over http; upgrade to https.
    posterUrl: info.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null,
    description: info.description ?? null,
    rating: info.averageRating ? info.averageRating.toFixed(1) : null,
    genre: info.authors?.slice(0, 2).join(", ") ?? null,
    extra: info.pageCount ? `${info.pageCount} sidor` : null,
  };
}

export async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  const url = new URL(API_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("langRestrict", "sv");
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`Google Books-anrop misslyckades (${res.status})`);
  const data = await res.json();
  const items: GoogleBookItem[] = data.items ?? [];
  return items.map(normalize);
}

export async function getGoogleBookDetails(id: string): Promise<SearchResult> {
  const url = new URL(`${API_BASE}/${id}`);
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`Google Books-anrop misslyckades (${res.status})`);
  const item: GoogleBookItem = await res.json();
  return normalize(item);
}
