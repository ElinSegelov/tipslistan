import type { AvailabilityItem, SearchResult } from "@/lib/types";

const API_BASE = "https://api.rawg.io/api";

function apiKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY saknas i .env.local");
  return key;
}

interface RawgGame {
  id: number;
  name: string;
  released?: string | null;
  background_image?: string | null;
  rating?: number;
  genres?: { name: string }[];
  platforms?: { platform: { name: string } }[];
  playtime?: number;
  description_raw?: string;
}

function normalize(game: RawgGame): SearchResult {
  const year = game.released ? Number(game.released.slice(0, 4)) : null;
  return {
    id: String(game.id),
    source: "rawg",
    type: "spel",
    title: game.name,
    year: Number.isFinite(year) ? year : null,
    posterUrl: game.background_image ?? null,
    description: game.description_raw ?? null,
    rating: game.rating ? game.rating.toFixed(1) : null,
    genre: game.genres?.slice(0, 2).map((g) => g.name).join(", ") ?? null,
    extra: game.playtime ? `~${game.playtime}h speltid` : null,
  };
}

export async function searchRawg(query: string): Promise<SearchResult[]> {
  const url = new URL(`${API_BASE}/games`);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", "15");
  url.searchParams.set("key", apiKey());
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`RAWG-anrop misslyckades (${res.status})`);
  const data = await res.json();
  const results: RawgGame[] = data.results ?? [];
  return results.map(normalize);
}

export async function getRawgDetails(id: string): Promise<{ result: SearchResult; platforms: AvailabilityItem[] }> {
  const url = new URL(`${API_BASE}/games/${id}`);
  url.searchParams.set("key", apiKey());
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`RAWG-anrop misslyckades (${res.status})`);
  const game: RawgGame = await res.json();

  const platforms: AvailabilityItem[] = (game.platforms ?? []).map((p) => ({
    name: p.platform.name,
    mode: "Tillgänglig",
    primary: true,
  }));

  return { result: normalize(game), platforms };
}
