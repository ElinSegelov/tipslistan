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
  },
  serie: {
    key: "serie",
    label: "Serie",
    pluralLabel: "Serier",
    hue: 18,
    doneLabel: "Sedd",
    pendingLabel: "Vill se",
    availLabel: "Var du kan streama",
  },
  bok: {
    key: "bok",
    label: "Bok",
    pluralLabel: "Böcker",
    hue: 195,
    doneLabel: "Läst",
    pendingLabel: "Vill läsa",
    availLabel: "Läs eller köp",
  },
  spel: {
    key: "spel",
    // Soft hyphen (U+00AD) gives the placeholder text a reasonable break ("Video-spel") 
    // if it doesn't fit.
    label: "Video­spel",
    pluralLabel: "Videospel",
    hue: 300,
    doneLabel: "Spelad",
    pendingLabel: "Vill spela",
    availLabel: "Plattformar",
  },
  brädspel: {
    key: "brädspel",
    label: "Bräd­spel",
    pluralLabel: "Brädspel",
    hue: 140,
    doneLabel: "Spelad",
    pendingLabel: "Vill spela",
    availLabel: "Spelinfo & köp",
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

/** Faktisk källa per tips (externalSource/source-fältet), inte kategorin —
    en bok kan t.ex. komma från LIBRIS, Google Books eller Open Library. */
const SOURCE_LABELS: Record<string, string> = {
  tmdb: "TMDB",
  libris: "LIBRIS",
  google_books: "Google Books",
  open_library: "Open Library",
  rawg: "RAWG",
  bgg: "BoardGameGeek",
  manual: "Manuellt",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}
