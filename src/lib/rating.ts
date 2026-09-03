/**
 * Every provider reports ratings on its own scale — TMDB and BoardGameGeek
 * use 0–10, RAWG and the two book providers use 0–5 — so the same-looking
 * number ("4.5") means very different things depending on where a tip came
 * from. We normalize everything to a single 0–10 scale for display so the
 * number always means the same thing, wherever it's shown.
 *
 * Manually-added tips have no external scale to convert from, so the
 * "BETYG" field in the manual-add form asks for a rating already out of
 * 10 and we just pass it through.
 */
const RATING_SCALE: Record<string, number> = {
  tmdb: 10,
  rawg: 5,
  google_books: 5,
  open_library: 5,
  // Ett libris-tips betyg kommer alltid från Google Books/Open Library-
  // slagningen i getLibrisCover (LIBRIS självt har inga betyg) — samma
  // 0-5-skala som de.
  libris: 5,
  bgg: 10,
  manual: 10,
};

/** Normalizes a raw, source-scale rating (as stored) to a 0–10 scale for
    display. Returns null when there's nothing to show. */
export function normalizeRating(
  rating: string | null | undefined,
  source: string | null | undefined
): string | null {
  if (!rating) return null;
  const raw = Number(rating);
  if (!Number.isFinite(raw)) return null;
  const max = (source && RATING_SCALE[source]) || 10;
  return ((raw / max) * 10).toFixed(1);
}
