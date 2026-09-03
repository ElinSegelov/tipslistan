"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PosterPlaceholder, TypeBadge } from "@/components/TypeBadge";
import { CATEGORY_LIST, CATEGORIES, COUNTRY_AWARE_TYPES, genreOrAuthorLabel, sourceLabel, type ContentType } from "@/lib/categories";
import { normalizeRating } from "@/lib/rating";
import type { AvailabilityResult, SearchResult } from "@/lib/types";
import { useCountry } from "@/lib/useCountry";
import { addTip } from "@/lib/actions/tips";
import { CheckIcon } from "@/components/icons";
import { CountrySelector } from "@/components/CountrySelector";
import { AvailabilityPills } from "@/components/AvailabilityPills";


export function SearchPageClient() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<ContentType>("film");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  // Sant medan /api/details hämtar omslag/beskrivning för `selected` — bl.a.
  // LIBRIS-träffar har inget omslag förrän det här är klart (se
  // getLibrisCover i providers/index.ts), vilket kan ta ett par sekunder.
  // Spärrar "Lägg till i biblioteket" tills dess, så ett tips aldrig sparas
  // permanent utan omslag bara för att man hann klicka innan det laddat —
  // det finns ingen bakgrundsjobb som fyller på det i efterhand.
  const [detailsLoading, setDetailsLoading] = useState(false);
  const selectSeqRef = useRef(0);
  const [recommender, setRecommender] = useState("");
  const [note, setNote] = useState("");

  // Visa var titeln går att streama/köpa/spela redan i förhandsgranskningen
  // — innan man lagt till den — inte bara efteråt på detaljsidan. Samma
  // mönster (requestKey/effect/komponenter) som DetailView.tsx använder.
  const [country, setCountry] = useCountry();
  const countryAware = selected ? COUNTRY_AWARE_TYPES.includes(selected.type) : false;
  const availabilityKey = selected ? `${selected.type}|${selected.source}|${selected.id}|${country}` : "";
  const [availabilityState, setAvailabilityState] = useState<{ key: string; data: AvailabilityResult | null }>({
    key: "",
    data: null,
  });
  const availabilityLoading = Boolean(selected) && availabilityState.key !== availabilityKey;
  const availability = availabilityState.key === availabilityKey ? availabilityState.data : null;

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const params = new URLSearchParams({
      type: selected.type,
      source: selected.source,
      id: selected.id,
      title: selected.title,
      country,
    });
    fetch(`/api/availability?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAvailabilityState({ key: availabilityKey, data: data.error ? null : data });
      })
      .catch(() => {
        if (!cancelled) setAvailabilityState({ key: availabilityKey, data: null });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey]);
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

  // "Added to library" confirmation dialog — shared by both the search and
  // manual-add flows, so there's always an immediate "go to library" /
  // "add another" action right where the user's attention already is,
  // instead of asking them to scroll all the way up to the header's back
  // button. Dismissing it (backdrop click, Escape, or the button below)
  // just hides the dialog; the quieter inline confirmation stays put.
  const addedDialogRef = useRef<HTMLDialogElement>(null);
  const [dialogDismissed, setDialogDismissed] = useState(false);
  const showAddedDialog = (added || manualAdded) && !dialogDismissed;
  const addedTitle = manualAdded ? manualTitle.trim() : selected?.title ?? "";

  useEffect(() => {
    const dialog = addedDialogRef.current;
    if (!dialog) return;
    if (showAddedDialog && !dialog.open) dialog.showModal();
    else if (!showAddedDialog && dialog.open) dialog.close();
  }, [showAddedDialog]);

  function addAnother() {
    if (manualAdded) {
      openManual("");
    } else {
      reset();
    }
  }

  // Debounced live search against /api/search, scoped to whichever type is
  // currently selected (each provider only knows how to search its own kind
  // of thing, so we search one type at a time).
  const hasQuery = query.trim().length > 0;

  // Guards against out-of-order responses: the debounce timer's own cleanup
  // only stops a request that hasn't *fired* yet, but two fired requests can
  // still resolve in the wrong order (a slower search for an earlier,
  // shorter query landing after a faster one for the up-to-date query) —
  // now more likely to actually happen since LIBRIS calls take noticeably
  // longer than the old single-provider Google Books search did. Only the
  // response from the most recently *started* request is ever applied.
  const searchSeqRef = useRef(0);

  useEffect(() => {
    if (!hasQuery) return;
    const typesToSearch = [typeFilter];
    const handle = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
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
        if (seq !== searchSeqRef.current) return; // en nyare sökning har redan startat
        setResults(all.flat());
      } catch (err) {
        if (seq !== searchSeqRef.current) return;
        setSearchError(err instanceof Error ? err.message : "Sökningen misslyckades.");
        setResults([]);
      } finally {
        if (seq === searchSeqRef.current) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query, hasQuery, typeFilter]);

  async function selectResult(result: SearchResult) {
    const seq = ++selectSeqRef.current;
    setAdded(false);
    setSaveError(null);
    setManualOpen(false);
    setSelected(result);
    setDetailsLoading(true);
    // Fill in richer detail (esp. BGG, which doesn't return images/description
    // from /search) before showing the preview.
    try {
      const detailParams = new URLSearchParams({
        type: result.type,
        source: result.source,
        id: result.id,
      });
      // Skickar med redan känd titel/år/författare — LIBRIS-träffar behöver
      // detta för att slå upp omslag hos Google Books/Open Library separat
      // (se getLibrisCover i providers/index.ts).
      if (result.title) detailParams.set("title", result.title);
      if (result.year != null) detailParams.set("year", String(result.year));
      if (result.genre) detailParams.set("genre", result.genre);
      const res = await fetch(`/api/details?${detailParams.toString()}`);
      const data = await res.json();
      if (seq !== selectSeqRef.current) return; // en nyare träff har redan valts
      if (res.ok) {
        // Some providers' detail endpoints can't refetch everything the
        // search endpoint already had (e.g. Open Library's per-work lookup
        // has no author or rating data) — fall back to the search result
        // for any field the detail fetch came back empty on, so we never
        // regress data we already had.
        const detail = data.result as SearchResult;
        setSelected({
          ...detail,
          year: detail.year ?? result.year,
          genre: detail.genre ?? result.genre,
          extra: detail.extra ?? result.extra,
          rating: detail.rating ?? result.rating,
          posterUrl: detail.posterUrl ?? result.posterUrl,
        });
      }
    } catch {
      // Keep the lighter search-result data if the detail fetch fails.
    } finally {
      if (seq === selectSeqRef.current) setDetailsLoading(false);
    }
  }

  async function addToLibrary() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    setDialogDismissed(false);
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
    setDetailsLoading(false);
    setQuery("");
    setResults([]);
    setRecommender("");
    setNote("");
    setAdded(false);
    setSaveError(null);
    setDialogDismissed(false);
  }

  // Typing a new query while a title is still selected (whether or not it was
  // added), or while the manual form is open, should immediately drop back
  // into search mode, instead of forcing the user to click away first.
  function handleQueryChange(value: string) {
    setQuery(value);
    if (selected) {
      setSelected(null);
      setDetailsLoading(false);
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
    setDetailsLoading(false);
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
    setDialogDismissed(false);
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
    setDialogDismissed(false);
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
          Sök bland filmer, serier, böcker, videospel och brädspel — hämta omslag, beskrivning och betyg.
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
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
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
          {results.map((r) => {
            // Visar författare (böcker) / genre (övrigt) under titeln så att
            // en sökning på en författares namn — som ger flera av deras
            // titlar som träffar — går att skilja åt, och så att en
            // titelsökning också visar vem som skrivit den.
            const subtitle = [genreOrAuthorLabel(r.type, r.genre), r.year].filter(Boolean).join(" · ");
            return (
              <button
                key={`${r.source}-${r.id}`}
                type="button"
                onClick={() => selectResult(r)}
                className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 text-left"
              >
                <span className="shrink-0">
                  <TypeBadge type={r.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.title}</span>
                  {subtitle ? (
                    <span className="block truncate text-xs text-text-faint">{subtitle}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
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
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">
                  BETYG <span className="font-normal normal-case text-text-faint">(av 10)</span>
                </div>
                <input
                  value={manualRating}
                  onChange={(e) => setManualRating(e.target.value)}
                  placeholder="T.ex. 8.5"
                  className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
              </div>
            </div>

            <div>
              {/* Reuses the same `genre` column/state the API-sourced
                  providers already (ab)use to hold a book's author (see
                  src/lib/providers/googleBooks.ts and openLibrary.ts) —
                  just relabelled here so a manually-added book saves and
                  later displays the same way an API-fetched one does. */}
              <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">
                {manualType === "bok" ? "FÖRFATTARE" : "GENRE"}
              </div>
              <input
                value={manualGenre}
                onChange={(e) => setManualGenre(e.target.value)}
                placeholder={manualType === "bok" ? "T.ex. Astrid Lindgren" : "T.ex. Drama, Sci-fi"}
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
                className="w-full resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:tracking-wide placeholder:text-text-faint"
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
              // The dialog below (shown right after a successful add) covers
              // "go to library" / "add another" now — this just confirms it
              // worked, in case the dialog was dismissed.
              <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 py-3.25 text-center text-[14.5px] font-bold text-emerald-300">
                ✓ Tillagd i biblioteket
              </div>
            )}
          </div>
        </div>
      ) : selected ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-bg-card">
          <div className="flex gap-5 p-5.5">
            <div className="relative aspect-2/3 w-27 flex-none overflow-hidden rounded-[10px]">
              <PosterPlaceholder type={selected.type} />
              {selected.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              {detailsLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-bg/60">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-text-faint/40 border-t-text" />
                </div>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <TypeBadge type={selected.type} />
                <span className="text-xs text-text-faint">Källa: {sourceLabel(selected.source)}</span>
              </div>
              <div className="mb-1 text-[19px] font-bold">{selected.title}</div>
              <div className="mb-2.5 text-[12.5px] text-text-muted">
                {[
                  selected.year,
                  genreOrAuthorLabel(selected.type, selected.genre) ?? selected.extra,
                  selected.rating ? `★ ${normalizeRating(selected.rating, selected.source)}/10` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {selected.description ? (
                <p className="line-clamp-4 text-[13px] leading-relaxed text-text-muted">{selected.description}</p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border p-5.5">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
                {CATEGORIES[selected.type].availLabel}
              </div>
              {countryAware ? <CountrySelector value={country} onChange={setCountry} /> : null}
            </div>
            <AvailabilityPills
              data={availability}
              loading={availabilityLoading}
              hue={CATEGORIES[selected.type].hue}
              country={country}
            />
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
                className="w-full resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:tracking-wide placeholder:text-text-faint"
              />
            </div>

            {saveError ? <div className="text-sm text-red-300">{saveError}</div> : null}

            {!added ? (
              <button
                type="button"
                onClick={addToLibrary}
                disabled={saving || detailsLoading}
                className="mt-1 rounded-xl bg-accent py-3.25 text-[14.5px] font-bold text-accent-ink disabled:opacity-50"
              >
                {saving ? "Lägger till …" : detailsLoading ? "Hämtar omslag & info …" : "Lägg till i biblioteket"}
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 py-3.25 text-center text-[14.5px] font-bold text-emerald-300">
                ✓ Tillagd i biblioteket
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
      ) : null}

      <dialog
        ref={addedDialogRef}
        onClose={() => setDialogDismissed(true)}
        onClick={(e) => {
          if (e.target === addedDialogRef.current) setDialogDismissed(true);
        }}
        className="m-auto w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-border bg-bg-card p-6 text-text backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="mb-1.5 flex items-center gap-2 text-emerald-300">
          <CheckIcon />
          <h2 className="text-[15px] font-bold">Tillagt i biblioteket</h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-text-muted">
          {addedTitle ? `"${addedTitle}" finns nu i ditt bibliotek.` : "Tipset finns nu i ditt bibliotek."}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl bg-accent py-3 text-[14px] font-bold text-accent-ink"
          >
            Till biblioteket
          </button>
          <button
            type="button"
            onClick={addAnother}
            className="rounded-xl border border-border py-3 text-[14px] font-semibold text-text-muted"
          >
            Lägg till en till
          </button>
        </div>
      </dialog>
    </>
  );
}
