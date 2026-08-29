"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PosterPlaceholder, TypeBadge } from "@/components/TypeBadge";
import { CATEGORY_LIST, CATEGORIES, type ContentType } from "@/lib/categories";
import type { SearchResult } from "@/lib/types";
import { addTip } from "@/lib/actions/tips";

type TypeFilter = ContentType | "alla";

const EXAMPLES: { type: ContentType; title: string }[] = [
  { type: "film", title: "Dune: Part Two" },
  { type: "serie", title: "The Bear" },
  { type: "bok", title: "Tomorrow, and Tomorrow, and Tomorrow" },
  { type: "spel", title: "Baldur's Gate 3" },
  { type: "brädspel", title: "Wingspan" },
];

export function SearchPageClient() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("alla");
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<ContentType>("film");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [recommender, setRecommender] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Debounced live search against /api/search, scoped to whichever type is
  // currently selected (each provider only knows how to search its own kind
  // of thing, so we search one type at a time).
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!hasQuery) return;
    const typesToSearch = typeFilter === "alla" ? [searchType] : [typeFilter];
    const handle = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const all = await Promise.all(
          typesToSearch.map(async (t) => {
            const res = await fetch(`/api/search?type=${t}&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Sökningen misslyckades.");
            return data.results as SearchResult[];
          })
        );
        setResults(all.flat());
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Sökningen misslyckades.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query, hasQuery, typeFilter, searchType]);

  async function selectResult(result: SearchResult) {
    setAdded(false);
    setSaveError(null);
    setSelected(result);
    // Fill in richer detail (esp. BGG, which doesn't return images/description
    // from /search) before showing the preview.
    try {
      const res = await fetch(`/api/details?type=${result.type}&source=${result.source}&id=${result.id}`);
      const data = await res.json();
      if (res.ok) setSelected(data.result as SearchResult);
    } catch {
      // Keep the lighter search-result data if the detail fetch fails.
    }
  }

  function selectExample(ex: { type: ContentType; title: string }) {
    setSearchType(ex.type);
    setTypeFilter("alla");
    setQuery(ex.title);
  }

  async function addToLibrary() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    const result = await addTip({
      type: selected.type,
      title: selected.title,
      year: selected.year,
      externalSource: selected.source,
      externalId: selected.id,
      posterUrl: selected.posterUrl,
      description: selected.description,
      rating: selected.rating,
      genre: selected.genre,
      extra: selected.extra,
      recommender: recommender.trim() || null,
      note: note.trim() || null,
    });
    setSaving(false);
    if ("error" in result) {
      setSaveError(result.error);
      return;
    }
    setAdded(true);
  }

  function reset() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setRecommender("");
    setNote("");
    setAdded(false);
    setSaveError(null);
  }

  return (
    <>
      <div className="mb-8 mt-14 text-center">
        <h1 className="serif text-[40px] italic">Vad har du fått tips om?</h1>
        <p className="mt-2.5 text-[14.5px] text-text-muted">
          Sök bland filmer, serier, böcker, spel och brädspel — vi hämtar omslag, beskrivning och betyg
          åt dig.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {(["alla", ...CATEGORY_LIST.map((c) => c.key)] as TypeFilter[]).map((key) => {
          const active = typeFilter === key;
          const label = key === "alla" ? "Alla typer" : CATEGORIES[key].label;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={
                active
                  ? "rounded-full bg-accent px-3.75 py-2 text-[13px] font-bold text-accent-ink"
                  : "rounded-full border border-border px-3.75 py-2 text-[13px] font-semibold text-text-muted"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="relative mb-5">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="oklch(0.55 0.02 262)"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök på titel …"
          className="w-full rounded-full border border-border bg-bg-elevated py-4 pl-12.5 pr-4.5 text-[15px] outline-none placeholder:text-text-faint"
        />
      </div>

      <div className="mb-9 flex flex-wrap gap-2">
        <span className="mr-0.5 self-center text-xs text-text-faint">Prova:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.title}
            type="button"
            onClick={() => selectExample(ex)}
            className="rounded-full border border-border bg-bg-card px-3.5 py-1.75 text-[12.5px] text-text-muted"
          >
            {ex.title}
          </button>
        ))}
      </div>

      {hasQuery && loading ? <div className="mb-6 text-center text-sm text-text-faint">Söker …</div> : null}
      {hasQuery && searchError ? (
        <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          {searchError}
        </div>
      ) : null}

      {!selected && hasQuery && results.length > 0 ? (
        <div className="mb-9 flex flex-col gap-2">
          {results.map((r) => (
            <button
              key={`${r.source}-${r.id}`}
              type="button"
              onClick={() => selectResult(r)}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 text-left"
            >
              <TypeBadge type={r.type} />
              <span className="flex-1 truncate text-sm font-semibold">{r.title}</span>
              {r.year ? <span className="text-xs text-text-faint">{r.year}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-bg-card">
          <div className="flex gap-5 p-5.5">
            <div className="relative aspect-[2/3] w-27 flex-none overflow-hidden rounded-[10px]">
              <PosterPlaceholder type={selected.type} fontSize="text-[40px]" />
              {selected.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <TypeBadge type={selected.type} />
                <span className="text-xs text-text-faint">Källa: {CATEGORIES[selected.type].source}</span>
              </div>
              <div className="mb-1 text-[19px] font-bold">{selected.title}</div>
              <div className="mb-2.5 text-[12.5px] text-text-muted">
                {[selected.year, selected.genre ?? selected.extra, selected.rating ? `★ ${selected.rating}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {selected.description ? (
                <p className="line-clamp-4 text-[13px] leading-relaxed text-text-muted">{selected.description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3.5 border-t border-border p-5.5">
            <div>
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">VEM TIPSADE DIG?</div>
              <input
                value={recommender}
                onChange={(e) => setRecommender(e.target.value)}
                placeholder="T.ex. Anna"
                className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">ANTECKNING</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Varför ska du kolla på/läsa/spela den här?"
                rows={2}
                className="w-full resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
              />
            </div>

            {saveError ? <div className="text-sm text-red-300">{saveError}</div> : null}

            {!added ? (
              <button
                type="button"
                onClick={addToLibrary}
                disabled={saving}
                className="mt-1 rounded-xl bg-accent py-3.25 text-[14.5px] font-bold text-accent-ink disabled:opacity-50"
              >
                {saving ? "Lägger till …" : "Lägg till i biblioteket"}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-emerald-800/50 bg-emerald-950/30 py-3.25 text-center text-[14.5px] font-bold text-emerald-300">
                  ✓ Tillagd i biblioteket
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="whitespace-nowrap rounded-xl border border-border px-4 py-3.25 text-[13.5px] font-semibold text-text-muted"
                >
                  Till biblioteket
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="whitespace-nowrap rounded-xl border border-border px-4 py-3.25 text-[13.5px] font-semibold text-text-muted"
                >
                  Sök ett till
                </button>
              </div>
            )}
          </div>
        </div>
      ) : !loading && !searchError && hasQuery && results.length === 0 ? (
        <div className="py-8 text-center text-[13.5px] text-text-faint">
          Inga träffar. Testa ett annat sökord eller byt typ ovan.
        </div>
      ) : !hasQuery ? (
        <div className="py-8 text-center text-[13.5px] text-text-faint">
          Skriv en titel eller välj ett exempel ovan för att se en förhandsvisning.
        </div>
      ) : null}
    </>
  );
}
