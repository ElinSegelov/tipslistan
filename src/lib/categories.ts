export type ContentType = "film" | "serie" | "bok" | "spel" | "brädspel";

export interface CategoryInfo {
  key: ContentType;
  label: string;
  /** Plural form used on the filter chips, e.g. "Filmer" */
  pluralLabel: string;
  /** oklch hue angle, shares chroma/lightness with the other categories */
  hue: number;
  doneLabel: string;
  pendingLabel: string;
  /** Heading shown above the availability section on the detail page */
  availLabel: string;
  source: string;
}

export const CATEGORIES: Record<ContentType, CategoryInfo> = {
  film: {
    key: "film",
    label: "Film",
    pluralLabel: "Filmer",
    hue: 65,
    doneLabel: "Sedd",
    pendingLabel: "Vill se",
    availLabel: "Var du kan streama",
    source: "TMDB",
  },
  serie: {
    key: "serie",
    label: "Serie",
    pluralLabel: "Serier",
    hue: 18,
    doneLabel: "Sedd",
    pendingLabel: "Vill se",
    availLabel: "Var du kan streama",
    source: "TMDB",
  },
  bok: {
    key: "bok",
    label: "Bok",
    pluralLabel: "Böcker",
    hue: 195,
    doneLabel: "Läst",
    pendingLabel: "Vill läsa",
    availLabel: "Läs eller köp",
    source: "Google Books",
  },
  spel: {
    key: "spel",
    // Soft hyphen (U+00AD) — see the same comment on brädspel below; gives
    // the placeholder text a sane break ("Video-spel") if it doesn't fit.
    label: "Video\u00adspel",
    pluralLabel: "Videospel",
    hue: 300,
    doneLabel: "Spelad",
    pendingLabel: "Vill spela",
    availLabel: "Plattformar",
    source: "RAWG",
  },
  brädspel: {
    key: "brädspel",
    // Soft hyphen (U+00AD) between "Bräd" and "spel" — invisible in normal
    // use (badges, filter chips), but gives the browser a sane place to
    // break as "Bräd-spel" instead of an arbitrary mid-word break when the
    // label doesn't fit (e.g. the large placeholder text on posters).
    label: "Bräd\u00adspel",
    pluralLabel: "Brädspel",
    hue: 140,
    doneLabel: "Spelad",
    pendingLabel: "Vill spela",
    availLabel: "Spelinfo & köp",
    source: "BoardGameGeek",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

/** The `genre` column doubles as a book's author (see the book providers
    in src/lib/providers/) — label it "Av {author}" there instead of the
    plain genre text used for every other category. */
export function genreOrAuthorLabel(type: ContentType, genre: string | null): string | null {
  if (!genre) return null;
  return type === "bok" ? `Av ${genre}` : genre;
}

/** Categories whose availability is country-dependent (real streaming presence data). */
export const COUNTRY_AWARE_TYPES: ContentType[] = ["film", "serie"];
