"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, COUNTRY_AWARE_TYPES, genreOrAuthorLabel } from "@/lib/categories";
import { normalizeRating } from "@/lib/rating";
import type { AvailabilityResult, TipRecord } from "@/lib/types";
import { useCountry } from "@/lib/useCountry";
import { deleteTip, toggleTipCompleted, updateManualTip, updateTipReview } from "@/lib/actions/tips";
import { PosterPlaceholder, TypeBadge } from "./TypeBadge";
import { CountrySelector } from "./CountrySelector";
import { AvailabilityPills } from "./AvailabilityPills";
import { ConfirmDialog } from "./ConfirmDialog";
import { ShareIcon, StarIcon, TrashIcon } from "./icons";

export function DetailView({ tip }: { tip: TipRecord }) {
  const cat = CATEGORIES[tip.type];
  const countryAware = COUNTRY_AWARE_TYPES.includes(tip.type);
  const [country, setCountry] = useCountry();
  const router = useRouter();

  // `loading` is derived from whether the fetched data matches the current
  // request key, rather than a separate flag flipped at the top of the
  // effect — that keeps every setState call inside an async callback.
  const requestKey = `${tip.type}|${tip.externalSource}|${tip.externalId}|${country}`;
  const [availabilityState, setAvailabilityState] = useState<{ key: string; data: AvailabilityResult | null }>({
    key: "",
    data: null,
  });
  const loading = availabilityState.key !== requestKey;
  const availability = availabilityState.key === requestKey ? availabilityState.data : null;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      type: tip.type,
      source: tip.externalSource,
      id: tip.externalId,
      title: tip.title,
      country,
    });
    fetch(`/api/availability?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAvailabilityState({ key: requestKey, data: data.error ? null : data });
      })
      .catch(() => {
        if (!cancelled) setAvailabilityState({ key: requestKey, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, tip.type, tip.externalSource, tip.externalId, tip.title, country]);

  // Completed toggle — mirrors TipCard's grid toggle, but as a labeled
  // button here since there's room for it.
  const [completed, setCompleted] = useState(tip.completed);
  const [togglingCompleted, setTogglingCompleted] = useState(false);

  async function handleToggleCompleted() {
    const next = !completed;
    setCompleted(next);
    setTogglingCompleted(true);
    const result = await toggleTipCompleted(tip.id, next);
    setTogglingCompleted(false);
    if ("error" in result) {
      setCompleted(!next);
    }
  }

  // Native share sheet where available (mobile browsers, most desktop
  // browsers now too); falls back to copying the link since there's no
  // universal "share" affordance otherwise.
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const url = `${window.location.origin}/dela/${tip.id}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: details.title, url });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Clipboard blocked (permissions/insecure context) — nothing more we
      // can do without a share target to fall back to.
    }
  }

  // "Vad tyckte du?" — a review written after finishing it, separate from
  // `note` (the reason it was added in the first place).
  const [review, setReview] = useState(tip.review);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState(tip.review ?? "");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  function startEditingReview() {
    setReviewDraft(review ?? "");
    setReviewError(null);
    setEditingReview(true);
  }

  async function saveReview() {
    setSavingReview(true);
    setReviewError(null);
    const value = reviewDraft.trim() || null;
    const result = await updateTipReview(tip.id, value);
    setSavingReview(false);
    if ("error" in result) {
      setReviewError(result.error);
      return;
    }
    setReview(value);
    setEditingReview(false);
  }

  // Editing a manually-added tip's own details (title, year, author/genre,
  // rating, description, recommender, note) — the fields you filled in
  // yourself when adding it. Only offered for `externalSource: "manual"`
  // tips; API-sourced ones are re-fetched from their provider instead.
  const isManual = tip.externalSource === "manual";
  const [details, setDetails] = useState({
    title: tip.title,
    year: tip.year,
    genre: tip.genre,
    rating: tip.rating,
    description: tip.description,
    recommender: tip.recommender,
    note: tip.note,
  });
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState({
    title: "",
    year: "",
    genre: "",
    rating: "",
    description: "",
    recommender: "",
    note: "",
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  function startEditingDetails() {
    setDetailsDraft({
      title: details.title,
      year: details.year != null ? String(details.year) : "",
      genre: details.genre ?? "",
      rating: details.rating ?? "",
      description: details.description ?? "",
      recommender: details.recommender ?? "",
      note: details.note ?? "",
    });
    setDetailsError(null);
    setEditingDetails(true);
  }

  async function saveDetails() {
    const title = detailsDraft.title.trim();
    if (!title) {
      setDetailsError("Titel krävs.");
      return;
    }
    setSavingDetails(true);
    setDetailsError(null);
    const yearNum = detailsDraft.year.trim() ? Number(detailsDraft.year.trim()) : null;
    const payload = {
      title,
      year: yearNum !== null && Number.isFinite(yearNum) ? yearNum : null,
      genre: detailsDraft.genre.trim() || null,
      rating: detailsDraft.rating.trim() || null,
      description: detailsDraft.description.trim() || null,
      recommender: detailsDraft.recommender.trim() || null,
      note: detailsDraft.note.trim() || null,
    };
    const result = await updateManualTip(tip.id, payload);
    setSavingDetails(false);
    if ("error" in result) {
      setDetailsError(result.error);
      return;
    }
    setDetails(payload);
    setEditingDetails(false);
  }

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr] sm:gap-9">
        <div className="relative mx-auto aspect-[2/3] w-36 flex-none overflow-hidden rounded-2xl border border-border sm:mx-0 sm:w-auto">
          <PosterPlaceholder type={tip.type} sizeClassName="text-[3rem] sm:text-[4rem]" />
          {tip.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tip.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={tip.type} />
            <span className="text-xs text-text-faint">Källa: {isManual ? "Manuellt" : cat.source}</span>
            {isManual && !editingDetails ? (
              <button
                type="button"
                onClick={startEditingDetails}
                className="text-xs font-semibold text-text-faint underline underline-offset-2"
              >
                Redigera uppgifter
              </button>
            ) : null}
          </div>

          {editingDetails ? (
            <div className="mb-5 flex flex-col gap-3.5 rounded-2xl border border-border bg-bg-card p-5">
              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">TITEL</div>
                <input
                  value={detailsDraft.title}
                  onChange={(e) => setDetailsDraft({ ...detailsDraft, title: e.target.value })}
                  className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">ÅR</div>
                  <input
                    value={detailsDraft.year}
                    onChange={(e) =>
                      setDetailsDraft({ ...detailsDraft, year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })
                    }
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
                    value={detailsDraft.rating}
                    onChange={(e) => setDetailsDraft({ ...detailsDraft, rating: e.target.value })}
                    placeholder="T.ex. 8.5"
                    className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">
                  {tip.type === "bok" ? "FÖRFATTARE" : "GENRE"}
                </div>
                <input
                  value={detailsDraft.genre}
                  onChange={(e) => setDetailsDraft({ ...detailsDraft, genre: e.target.value })}
                  placeholder={tip.type === "bok" ? "T.ex. Astrid Lindgren" : "T.ex. Drama, Sci-fi"}
                  className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
              </div>

              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">BESKRIVNING</div>
                <textarea
                  value={detailsDraft.description}
                  onChange={(e) => setDetailsDraft({ ...detailsDraft, description: e.target.value })}
                  placeholder="Valfri kort beskrivning"
                  rows={3}
                  className="w-full resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
              </div>

              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">VEM TIPSADE DIG?</div>
                <input
                  value={detailsDraft.recommender}
                  onChange={(e) => setDetailsDraft({ ...detailsDraft, recommender: e.target.value })}
                  placeholder="T.ex. Anna"
                  className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
              </div>

              <div>
                <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">ANTECKNING</div>
                <textarea
                  value={detailsDraft.note}
                  onChange={(e) => setDetailsDraft({ ...detailsDraft, note: e.target.value })}
                  placeholder="Varför ska du kolla på/läsa/spela den här?"
                  rows={2}
                  className="w-full resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:tracking-wide placeholder:text-text-faint"
                />
              </div>

              {detailsError ? <div className="text-sm text-red-300">{detailsError}</div> : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveDetails}
                  disabled={savingDetails}
                  className="rounded-xl bg-accent px-4 py-2.25 text-[13px] font-bold text-accent-ink disabled:opacity-50"
                >
                  {savingDetails ? "Sparar …" : "Spara"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDetails(false)}
                  disabled={savingDetails}
                  className="rounded-xl border border-border px-4 py-2.25 text-[13px] font-semibold text-text-muted disabled:opacity-50"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="serif mb-3 text-[32px] italic leading-[1.05] sm:text-[46px]">{details.title}</h1>
              <div className="mb-4.5 flex flex-wrap items-center gap-2 text-[13.5px] text-text-muted">
                {details.year ? <span>{details.year}</span> : null}
                {details.genre ? (
                  <>
                    <Dot />
                    <span>{genreOrAuthorLabel(tip.type, details.genre)}</span>
                  </>
                ) : null}
                {tip.extra ? (
                  <>
                    <Dot />
                    <span>{tip.extra}</span>
                  </>
                ) : null}
                {details.rating ? (
                  <>
                    <Dot />
                    <span className="flex items-center gap-1">
                      <StarIcon /> {normalizeRating(details.rating, tip.externalSource)}
                      <span className="text-text-faint">/10</span>
                    </span>
                  </>
                ) : null}
              </div>

              {details.description ? (
                <p className="mb-5 max-w-160 text-sm leading-relaxed text-text-muted">{details.description}</p>
              ) : null}

              {details.recommender ? (
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-cyan-800/60 bg-cyan-950/40 text-[10px] font-bold">
                    {details.recommender.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] text-text-muted">
                    Tipsat av <strong className="text-text">{details.recommender}</strong>
                    {" · "}
                    {new Date(tip.createdAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              ) : (
                <div className="mb-4 text-[13px] text-text-muted">
                  Tillagd {new Date(tip.createdAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}

              {details.note ? (
                <div className="mb-5 border-l-2 py-1 pl-4" style={{ borderColor: `oklch(0.72 0.13 ${cat.hue})` }}>
                  <span className="serif italic text-base text-text/90">&ldquo;{details.note}&rdquo;</span>
                </div>
              ) : null}
            </>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleCompleted}
              disabled={togglingCompleted}
              className={
                completed
                  ? "flex items-center gap-1.75 rounded-full border border-emerald-800/50 bg-emerald-950/30 px-4 py-2.25 text-[13px] font-bold text-emerald-300 disabled:opacity-60"
                  : "flex items-center gap-1.75 rounded-full border border-border bg-bg-elevated px-4 py-2.25 text-[13px] font-bold text-text-muted disabled:opacity-60"
              }
            >
              {completed ? cat.doneLabel : `Markera som ${cat.doneLabel.toLowerCase()}`}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.75 rounded-full border border-border px-4 py-2.25 text-[13px] font-bold text-text-muted"
            >
              <ShareIcon /> {shareState === "copied" ? "Länk kopierad!" : "Dela"}
            </button>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-bold tracking-wide text-text-muted">VAD TYCKTE DU?</div>
            {editingReview ? (
              <div className="flex flex-col gap-2.5">
                <label htmlFor="review" className="sr-only">
                  Vad tyckte du?
                </label>
                <textarea
                  id="review"
                  value={reviewDraft}
                  onChange={(e) => setReviewDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Skriv vad du tyckte …"
                  className="w-full max-w-160 resize-none rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none placeholder:text-text-faint"
                />
                {reviewError ? <div className="text-sm text-red-300">{reviewError}</div> : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveReview}
                    disabled={savingReview}
                    className="rounded-xl bg-accent px-4 py-2.25 text-[13px] font-bold text-accent-ink disabled:opacity-50"
                  >
                    {savingReview ? "Sparar …" : "Spara"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingReview(false)}
                    className="rounded-xl border border-border px-4 py-2.25 text-[13px] font-semibold text-text-muted"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : review ? (
              <div className="flex max-w-160 items-start justify-between gap-3">
                <p className="text-sm leading-relaxed text-text-muted">{review}</p>
                <button
                  type="button"
                  onClick={startEditingReview}
                  className="whitespace-nowrap text-xs font-semibold text-text-faint underline underline-offset-2"
                >
                  Redigera
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditingReview}
                className="text-[13px] font-semibold text-accent underline underline-offset-2"
              >
                Skriv vad du tyckte
              </button>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <ConfirmDialog
              trigger={(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-faint hover:text-red-300"
                >
                  <TrashIcon /> Ta bort tips
                </button>
              )}
              title="Ta bort det här tipset?"
              description={`"${details.title}" tas bort permanent från ditt bibliotek. Det går inte att ångra.`}
              confirmLabel="Ta bort"
              onConfirm={async () => {
                const result = await deleteTip(tip.id);
                if ("error" in result) throw new Error(result.error);
                router.push("/");
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] font-bold uppercase tracking-wide text-text-muted">{cat.availLabel}</div>
          {countryAware ? <CountrySelector value={country} onChange={setCountry} /> : null}
        </div>
        <AvailabilityPills data={availability} loading={loading} hue={cat.hue} country={country} />
      </div>
    </>
  );
}

function Dot() {
  return <span className="h-0.75 w-0.75 rounded-full bg-text-muted/60" />;
}
