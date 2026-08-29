import type { AvailabilityItem, AvailabilityResult, SearchResult } from "@/lib/types";
import type { ContentType } from "@/lib/categories";

const API_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY saknas i .env.local");
  return key;
}

async function tmdbGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("api_key", apiKey());
  url.searchParams.set("language", "sv-SE");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`TMDB-anrop misslyckades (${res.status}) mot ${path}`);
  return res.json();
}

type TmdbMediaType = "movie" | "tv";

function mediaTypeFor(type: ContentType): TmdbMediaType {
  return type === "serie" ? "tv" : "movie";
}

interface TmdbSearchItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
}

export async function searchTmdb(query: string, type: ContentType): Promise<SearchResult[]> {
  const mediaType = mediaTypeFor(type);
  const data = await tmdbGet(`/search/${mediaType}`, { query, include_adult: "false" });
  const results: TmdbSearchItem[] = data.results ?? [];
  return results.slice(0, 8).map((item) => normalizeSearchItem(item, mediaType, type));
}

function normalizeSearchItem(item: TmdbSearchItem, mediaType: TmdbMediaType, type: ContentType): SearchResult {
  const dateStr = mediaType === "movie" ? item.release_date : item.first_air_date;
  const year = dateStr ? Number(dateStr.slice(0, 4)) : null;
  return {
    id: String(item.id),
    source: "tmdb",
    type,
    title: (mediaType === "movie" ? item.title : item.name) ?? "Okänd titel",
    year: Number.isFinite(year) ? year : null,
    posterUrl: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null,
    description: item.overview || null,
    rating: item.vote_average ? item.vote_average.toFixed(1) : null,
    genre: null,
    extra: null,
  };
}

export async function getTmdbDetails(id: string, type: ContentType): Promise<SearchResult> {
  const mediaType = mediaTypeFor(type);
  const data = await tmdbGet(`/${mediaType}/${id}`);
  const dateStr = mediaType === "movie" ? data.release_date : data.first_air_date;
  const year = dateStr ? Number(dateStr.slice(0, 4)) : null;
  const genre = (data.genres ?? []).map((g: { name: string }) => g.name).slice(0, 2).join(", ") || null;
  const extra =
    mediaType === "movie"
      ? data.runtime
        ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min`
        : null
      : data.number_of_seasons
        ? `${data.number_of_seasons} säsong${data.number_of_seasons === 1 ? "" : "er"}`
        : null;

  return {
    id: String(data.id),
    source: "tmdb",
    type,
    title: (mediaType === "movie" ? data.title : data.name) ?? "Okänd titel",
    year: Number.isFinite(year) ? year : null,
    posterUrl: data.poster_path ? `${IMAGE_BASE}${data.poster_path}` : null,
    description: data.overview || null,
    rating: data.vote_average ? data.vote_average.toFixed(1) : null,
    genre,
    extra,
  };
}

/**
 * Country-aware streaming availability, backed by TMDB's /watch/providers
 * endpoint (sourced from JustWatch). `country` is an ISO 3166-1 code, e.g.
 * "SE". When the title has no entry at all for that country, we report
 * `unavailableInCountry: true` so the UI can show an explicit "inte
 * tillgänglig i <land>" marking instead of just an empty list.
 */
export async function getWatchProviders(
  id: string,
  type: ContentType,
  country: string
): Promise<AvailabilityResult> {
  const mediaType = mediaTypeFor(type);
  const data = await tmdbGet(`/${mediaType}/${id}/watch/providers`);
  const results = data.results ?? {};
  const forCountry = results[country];

  if (!forCountry) {
    return { items: [], countryAware: true, unavailableInCountry: true, moreUrl: null };
  }

  const items: AvailabilityItem[] = [
    ...(forCountry.flatrate ?? []).map((p: { provider_name: string }) => ({
      name: p.provider_name,
      mode: "Streamar",
      primary: true,
    })),
    ...(forCountry.ads ?? []).map((p: { provider_name: string }) => ({
      name: p.provider_name,
      mode: "Streamar (gratis, med reklam)",
      primary: true,
    })),
    ...(forCountry.rent ?? []).map((p: { provider_name: string }) => ({
      name: p.provider_name,
      mode: "Hyr",
      primary: false,
    })),
    ...(forCountry.buy ?? []).map((p: { provider_name: string }) => ({
      name: p.provider_name,
      mode: "Köp",
      primary: false,
    })),
  ];

  // De-dupe providers that show up in more than one list (e.g. rent + buy).
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    const key = `${item.name}:${item.mode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    items: deduped,
    countryAware: true,
    unavailableInCountry: deduped.length === 0,
    moreUrl: forCountry.link ?? null,
  };
}
