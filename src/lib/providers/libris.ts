import type { SearchResult } from "@/lib/types";

// LIBRIS är Kungliga bibliotekets (Sveriges nationalbibliotek) katalog över
// i princip alla svenska bibliotek — den bästa källan för korrekt svensk
// bokmetadata (rätt svensk titel/utgåva/förlag, som Google Books ofta
// saknar eller har fel på). Helt öppet och keyless, till skillnad från BGG.
//
// Nackdel: LIBRIS har inga omslagsbilder alls — det är en katalogtjänst,
// inte en bildkälla. Omslag/beskrivning/betyg hämtas därför separat från
// Google Books (med fallback till Open Library) i getDetails() i
// index.ts, på titel + författare, när användaren väljer en LIBRIS-träff.
//
// Vi använder den äldre Xsearch-apin (Dublin Core-liknande JSON) eftersom
// den är enkel och väldokumenterad. Fältprefixen "titel:"/"författare:"
// nedan (för att söka i specifika fält snarare än fritext över alla fält,
// inklusive ämnesord) är verifierade mot en tredjeparts öppen källkods-
// implementation (isakskogstad/KB-MCP) snarare än gissade, eftersom
// LIBRIS egen dokumentationssajt inte gick att nå härifrån.
const API_BASE = "https://libris.kb.se/xsearch";

type XsearchField = string | number | { value?: string } | (string | number | { value?: string })[] | undefined;

function firstString(field: XsearchField): string | undefined {
  if (field == null) return undefined;
  const val = Array.isArray(field) ? field[0] : field;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return val?.value;
}

function allStrings(field: XsearchField): string[] {
  if (field == null) return [];
  const arr = Array.isArray(field) ? field : [field];
  return arr
    .map((v) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : v?.value))
    .filter((v): v is string => Boolean(v));
}

/** LIBRIS/MARC skriver namn som "Efternamn, Förnamn" — vänd till "Förnamn Efternamn". */
function formatName(raw: string): string {
  const [last, first] = raw.split(",").map((s) => s.trim());
  return first ? `${first} ${last}` : raw.trim();
}

interface XsearchRecord {
  identifier?: XsearchField;
  title?: XsearchField;
  creator?: XsearchField;
  date?: XsearchField;
  type?: XsearchField;
  description?: XsearchField;
}

interface XsearchResponse {
  xsearch?: {
    records?: string;
    list?: XsearchRecord[];
  };
}

/**
 * LIBRIS är en fullständig bibliotekskatalog, inte en bokdatabas — en
 * sökning på t.ex. ett filmfranchise-namn ger även ljudinspelningar,
 * noter, DVD-filmatiseringar och liknande katalogiserat material.
 *
 * Typfältets faktiska värden är vanliga engelska ord som "book" och
 * "sound recording" (bekräftat mot verklig exempel-output från ett
 * tredjepartsverktyg — inte DCMI:s Text/StillImage-vokabulär, som en
 * tidigare version av det här filtret felaktigt antog och som därför
 * inte filtrerade bort något alls). Behåll bara poster där typen
 * uttryckligen innehåller "book", eller där fältet helt saknas (bättre
 * att visa en extra träff än att av misstag gömma en riktig bok pga en
 * typvärdering vi inte kunnat verifiera).
 */
function looksLikeBook(record: XsearchRecord): boolean {
  const type = firstString(record.type);
  if (!type) return true;
  return type.toLowerCase().includes("book");
}

function normalize(record: XsearchRecord): SearchResult | null {
  if (!looksLikeBook(record)) return null;
  const title = firstString(record.title);
  if (!title) return null;

  // Nyare LIBRIS-poster har alfanumeriska id:n (t.ex.
  // ".../bib/q145b4zln539zndk"), inte bara numeriska — ta sista
  // sökvägssegmentet oavsett form istället för att anta siffror.
  const identifier = firstString(record.identifier) ?? "";
  const id = identifier.replace(/\/+$/, "").split("/").pop() || identifier;
  if (!id) return null;

  const authors = allStrings(record.creator).map(formatName).slice(0, 2);
  const date = firstString(record.date) ?? "";
  const yearMatch = date.match(/\d{4}/);

  return {
    id,
    source: "libris",
    type: "bok",
    title,
    year: yearMatch ? Number(yearMatch[0]) : null,
    posterUrl: null,
    description: firstString(record.description) ?? null,
    rating: null,
    genre: authors.join(", ") || null,
    extra: null,
  };
}

async function xsearchRaw(query: string, n: number): Promise<XsearchRecord[]> {
  const url = new URL(API_BASE);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("n", String(n));
  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`LIBRIS-anrop misslyckades (${res.status})`);
  const data: XsearchResponse = await res.json();
  return data.xsearch?.list ?? [];
}

function dedupeAndFilter(records: XsearchRecord[]): SearchResult[] {
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const record of records) {
    const result = normalize(record);
    if (!result) continue;
    const key = `${result.title.toLowerCase().trim()}|${(result.genre ?? "").toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(result);
    if (results.length >= 15) break;
  }
  return results;
}

export async function searchLibris(query: string): Promise<SearchResult[]> {
  // Fältprefix ("titel:"/"författare:") skopar bara ETT ord om värdet inte
  // citeras — "titel:Harry Potter och de vises sten" blev alltså i praktiken
  // "titel:Harry" OCH (ospecifikt) "Potter" OCH "och" OCH "de" OCH "vises"
  // OCH "sten", vilket med vanliga svenska småord i just titeln gav noll
  // eller helt fel träffar för flerordstitlar — trots att samma bok gick
  // att hitta via författarsökning (ofta bara ett eller två ord, så samma
  // problem syns inte där). Citationstecken gör hela frasen till EN
  // sökterm i det fältet istället.
  const phrase = query.replace(/"/g, "");
  const [byTitle, byAuthor] = await Promise.allSettled([
    xsearchRaw(`titel:"${phrase}"`, 25),
    xsearchRaw(`författare:"${phrase}"`, 25),
  ]);

  if (byTitle.status === "rejected" && byAuthor.status === "rejected") {
    throw byTitle.reason;
  }
  const scoped = dedupeAndFilter([
    ...(byTitle.status === "fulfilled" ? byTitle.value : []),
    ...(byAuthor.status === "fulfilled" ? byAuthor.value : []),
  ]);
  if (scoped.length > 0) return scoped;

  // Inget napp på den exakta frasen — vanligt medan man fortfarande skriver
  // (t.ex. bara "Harry Pot" hittills), eftersom en frassökning bara matchar
  // hela ord, inte ofullständiga. Fall tillbaka på en obegränsad fritext-
  // sökning över alla fält som reserv, så sökningen fortfarande ger något
  // medan man skriver — typfiltret i normalize() håller ändå kvar bara det
  // som ser ut som böcker.
  try {
    return dedupeAndFilter(await xsearchRaw(query, 40));
  } catch {
    return [];
  }
}
