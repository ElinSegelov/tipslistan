import { XMLParser } from "fast-xml-parser";
import type { AvailabilityItem, SearchResult } from "@/lib/types";

const API_BASE = "https://boardgamegeek.com/xmlapi2";

// BoardGameGeek has never shipped an official JSON API — only this XML one
// (in "beta" since ~2013 but stable and the canonical source for board game
// data/ratings). We call it directly and parse the XML ourselves server-side
// rather than depending on a third-party hosted JSON proxy's uptime.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["item", "name", "link", "rank"].includes(tagName),
});

interface BggValueAttr {
  "@_value": string;
}

interface BggName {
  "@_type": string;
  "@_value": string;
}

interface BggLink {
  "@_type": string;
  "@_id": string;
  "@_value": string;
}

interface BggSearchItem {
  "@_id": string;
  "@_type": string;
  name: BggName[];
  yearpublished?: BggValueAttr;
}

interface BggThingItem {
  "@_id": string;
  name: BggName[];
  yearpublished?: BggValueAttr;
  image?: string;
  description?: string;
  minplayers?: BggValueAttr;
  maxplayers?: BggValueAttr;
  playingtime?: BggValueAttr;
  link?: BggLink[];
  statistics?: {
    ratings?: {
      average?: BggValueAttr;
      averageweight?: BggValueAttr;
    };
  };
}

interface BggDoc<T> {
  items?: { item?: T[] };
}

async function bggFetch<T>(path: string, params: Record<string, string>): Promise<BggDoc<T>> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  // BGG started requiring a registered application + Bearer token for XML API2
  // in 2025/2026 — it used to be fully keyless. See README for how to register
  // and get BGG_API_TOKEN. Without it every request 401s.
  const headers: Record<string, string> = {
    "User-Agent": "tipslistan-app (personal project, contact via BGG profile)",
  };
  if (process.env.BGG_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.BGG_API_TOKEN}`;
  }

  // BGG occasionally answers 202 ("queued, try again shortly") under load.
  // One short retry covers that; search/thing normally return 200 directly.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 60 * 60 * 6 },
    });
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    if (res.status === 401) {
      throw new Error(
        "BGG kräver numera ett registrerat API-token för sök på brädspel. Se README för hur du skaffar ett och sätter BGG_API_TOKEN."
      );
    }
    if (!res.ok) throw new Error(`BGG-anrop misslyckades (${res.status})`);
    const xml = await res.text();
    return parser.parse(xml) as BggDoc<T>;
  }
  throw new Error("BGG svarade inte i tid, försök igen.");
}

/** BGG's description field is HTML-escaped text with entities like &amp;rsquo; and <br/> tags baked in. */
function cleanDescription(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&#10;/g, "\n")
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function primaryName(names: BggName[]): string {
  const primary = names.find((n) => n["@_type"] === "primary") ?? names[0];
  return primary?.["@_value"] ?? "Okänt namn";
}

export async function searchBgg(query: string): Promise<SearchResult[]> {
  const data = await bggFetch<BggSearchItem>("/search", { query, type: "boardgame" });
  const items = data.items?.item ?? [];
  return items.slice(0, 8).map((item) => ({
    id: String(item["@_id"]),
    source: "bgg",
    type: "brädspel" as const,
    title: primaryName(item.name),
    year: item.yearpublished ? Number(item.yearpublished["@_value"]) : null,
    posterUrl: null, // the search endpoint doesn't include images; fetched in getBggDetails
    description: null,
    rating: null,
    genre: null,
    extra: null,
  }));
}

export async function getBggDetails(
  id: string
): Promise<{ result: SearchResult; info: AvailabilityItem[] }> {
  const data = await bggFetch<BggThingItem>("/thing", { id, stats: "1" });
  const item = data.items?.item?.[0];
  if (!item) throw new Error("Hittade inget brädspel med det id:t på BGG.");

  const minP = item.minplayers?.["@_value"];
  const maxP = item.maxplayers?.["@_value"];
  const playtime = item.playingtime?.["@_value"];
  const ratings = item.statistics?.ratings;
  const average = ratings?.average?.["@_value"];
  const weight = ratings?.averageweight?.["@_value"];

  const links = item.link ?? [];
  const categories = links
    .filter((l) => l["@_type"] === "boardgamecategory")
    .slice(0, 2)
    .map((l) => l["@_value"])
    .join(", ");

  const result: SearchResult = {
    id: String(item["@_id"]),
    source: "bgg",
    type: "brädspel",
    title: primaryName(item.name),
    year: item.yearpublished ? Number(item.yearpublished["@_value"]) : null,
    posterUrl: item.image ?? null,
    description: cleanDescription(item.description),
    rating: average ? Number(average).toFixed(1) : null,
    genre: categories || null,
    extra: minP && maxP ? `${minP}–${maxP} spelare` : null,
  };

  const info: AvailabilityItem[] = [];
  if (minP && maxP) info.push({ name: `${minP}–${maxP} spelare`, mode: "Antal", primary: true });
  if (playtime) info.push({ name: `${playtime} min`, mode: "Speltid", primary: true });
  if (weight) info.push({ name: `${Number(weight).toFixed(1)} / 5`, mode: "Komplexitet", primary: true });

  const q = encodeURIComponent(result.title);
  info.push(
    { name: "BoardGameGeek", mode: "Regler & recensioner", primary: false, url: `https://boardgamegeek.com/boardgame/${result.id}` },
    { name: "Alfaspel", mode: "Sök & köp", primary: false, url: `https://www.alfaspel.se/sok?q=${q}` },
    { name: "Spelexperten", mode: "Sök & köp", primary: false, url: `https://www.spelexperten.com/sok?q=${q}` }
  );

  return { result, info };
}
