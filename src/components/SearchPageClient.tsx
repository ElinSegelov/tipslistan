"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PosterPlaceholder, TypeBadge } from "@/components/TypeBadge";
import { CATEGORY_LIST, CATEGORIES, type ContentType } from "@/lib/categories";
import type { SearchResult } from "@/lib/types";
import { addTip } from "@/lib/actions/tips";

const EXAMPLES: { type: ContentType; title: string }[] = [
  { type: "film", title: "Dune: Part Two" },
  { type: "serie", title: "The Bear" },
  { type: "bok", title: "Tomorrow, and Tomorrow, and Tomorrow" },
  { type: "spel", title: "Baldur's Gate 3" },
  { type: "brädspel", title: "Wingspan" },
];

export function SearchPageClient() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<ContentType>("film");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [recommender, setRecommender] = useState("");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Manual entry — for when the API is down or simply doesn't have the
  // title. Shares the recommender/note fields above with the search flow
  // since the two forms are mutually exclusive (never shown at once).
  const [manualOpen, setManualOpen] = useState(false);
  const [manualType, setManualType] = useState<ContentType>("film");
  const [manualTitle, setManualTitle] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualGenre, setManualGenre] = useState("");
  const [manualRating, setManualRating] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSaveError, setManualSaveError] = useState<string | null>(null);
  const [manualAdded, setManualAdded] = useState(false);

  // Debounced live search against /api/search, scoped to whichever type is
  // currently selected (each provider only knows how to search its own kind
  // of thing, so we search one type at a time).
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!hasQuery) return;
    const typesToSearch = [typeFilter];
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
  }, [query, hasQuery, typeFilter]);

  async function selectResult(result: SearchResult) {
    setAdded(false);
    setSaveError(null);
    setManualOpen(false);
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
    setTypeFilter(ex.type);
    handleQueryChange(ex.title);
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

  // Typing a new query while a title is still selected (whether or not it was
  // added), or while the manual form is open, should immediately drop back
  // into search mode, instead of forcing the user to click away first.
  function handleQueryChange(value: string) {
    setQuery(value);
    if (selected) {
      setSelected(null);
      setRecommender("");
      setNote("");
      setAdded(false);
      setSaveError(null);
    }
    if (manualOpen) {
      setManualOpen(false);
      setManualSaveError(null);
    }
  }

  // `prefillTitle` lets the empty-results/error states hand over what was
  // already typed; omit it to start from the current search box, or pass ""
  // explicitly for a blank form (e.g. "add another").
  function openManual(prefillTitle?: string) {
    setSelected(null);
    setManualType(typeFilter);
    setManualTitle(prefillTitle ?? query.trim());
    setManualYear("");
    setManualGenre("");
    setManualRating("");
    setManualDescription("");
    setManualSaveError(null);
    setManualAdded(false);
    setRecommender("");
    setNote("");
    setManualOpen(true);
  }

  function closeManual() {
    setManualOpen(false);
    setManualSaveError(null);
  }

  async function addManualToLibrary() {
    const title = manualTitle.trim();
    if (!title) {
      setManualSaveError("Titel krävs.");
      return;
    }
    setManualSaving(true);
    setManualSaveError(null);
    const year = manualYear.trim() ? Number(manualYear.trim()) : null;
    const result = await addTip({
      type: manualType,
      title,
      year: year !== null && !Number.isNaN(year) ? year : null,
      // "manual" marks tips typed in by hand rather than fetched from a
      // provider — the availability lookup (src/lib/providers/index.ts)
      // knows to skip external calls for these instead of erroring on a
      // made-up id.
      externalSource: "manual",
      externalId: crypto.randomUUID(),
      posterUrl: null,
      description: manualDescription.trim() || null,
      rating: manualRating.trim() || null,
      genre: manualGenre.trim() || null,
      extra: null,
      recommender: recommender.trim() || null,
      note: note.trim() || null,
    });
    setManualSaving(false);
    if ("error" in result) {
      setManualSaveError(result.error);
      return;
    }
    setManualAdded(true);
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="serif text-[40px] italic">Vad har du fått tips om?</h1>
        <p className="mt-2.5 text-[14.5px] text-text-muted">
          Sök bland filmer, serier, böcker, tv-spel och brädspel — hämta omslag, beskrivning och betyg.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {CATEGORY_LIST.map((c) => c.key).map((key) => {
          const active = typeFilter === key;
          const label = CATEGORIES[key].label;
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
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Sök på titel …"
          className="w-full rounded-full border border-border bg-bg-elevated py-4 pl-12.5 pr-4.5 text-[15px] outline-none placeholder:text-text-faint"
        />
      </div>

      {!selected && !manualOpen ? (
        <div className="mb-8 text-center">
          <button
            type="button"
            onClick={() => openManual()}
            className="text-[12.5px] font-semibold text-text-faint underline underline-offset-2"
          >
            Hittar du inte titeln, eller är tjänsten nere? Lägg till manuellt
          </button>
        </div>
      ) : null}

      {!manualOpen && hasQuery && loading ? (
        <div className="mb-6 text-center text-sm text-text-faint">Söker …</div>
      ) : null}
      {!manualOpen && hasQuery && searchError ? (
        <div className="mb-6 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300">
          <p>{searchError}</p>
          <button
            type="button"
            onClick={() => openManual(query.trim())}
            className="mt-2 text-[13px] font-semibold underline underline-offset-2"
          >
            Lägg till &quot;{query.trim()}&quot; manuellt istället
          </button>
        </div>
      ) : null}

      {!selected && !manualOpen && hasQuery && results.length > 0 ? (
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

      {manualOpen ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-bg-card">
          <div className="flex flex-col gap-3.5 p-5.5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
                Lägg till manuellt
              </div>
              <button type="button" onClick={closeManual} className="text-xs font-semibold text-text-faint">
                Avbryt
              </button>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">TYP</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_LIST.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setManualType(c.key)}
                    className={
                      manualType === c.key
                        ? "rounded-full bg-accent px-3.5 py-1.75 text-[12.5px] font-bold text-accent-ink"
                        : "rounded-full border border-border px-3.5 py-1.75 text-[12.5px] text-text-muted"
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">TITEL</div>
              <input
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Titel"
                className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">ÅR</div>
                <input
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="T.ex. 2024"
                  className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
              </div>
              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">BETYG</div>
                <input
                  value={manualRating}
                  onChange={(e) => setManualRating(e.target.value)}
                  placeholder="T.ex. 4.5"
                  className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">GENRE</div>
              <input
                value={manualGenre}
                onChange={(e) => setManualGenre(e.target.value)}
                placeholder="T.ex. Drama, Sci-fi"
                className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">BESKRIVNING</div>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Valfri kort beskrivning"
                rows={2}
                className="w-full resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
              />
            </div>

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

            {manualSaveError ? <div className="text-sm text-red-300">{manualSaveError}</div> : null}

            {!manualAdded ? (
              <button
                type="button"
                onClick={addManualToLibrary}
                disabled={manualSaving}
                className="mt-1 rounded-xl bg-accent py-3.25 text-[14.5px] font-bold text-accent-ink disabled:opacity-50"
              >
                {manualSaving ? "Lägger till …" : "Lägg till i biblioteket"}
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
                  onClick={() => openManual("")}
                  className="whitespace-nowrap rounded-xl border border-border px-4 py-3.25 text-[13.5px] font-semibold text-text-muted"
                >
                  Lägg till en till
                </button>
              </div>
            )}
          </div>
        </div>
      ) : selected ? (
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
          <p>Inga träffar. Testa ett annat sökord eller byt typ ovan.</p>
          <button
            type="button"
            onClick={() => openManual(query.trim())}
            className="mt-3 text-[13px] font-semibold text-accent underline underline-offset-2"
          >
            Lägg till &quot;{query.trim()}&quot; manuellt
          </button>
        </div>
      ) : !hasQuery ? (
        <div className="py-8 text-center text-[13.5px] text-text-faint">
          Skriv en titel eller välj ett exempel ovan för att se en förhandsvisning.
        </div>
      ) : null}
    </>
  );
}
