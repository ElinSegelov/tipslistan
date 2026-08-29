export type ContentType = "film" | "serie" | "bok" | "spel" | "brädspel";

export interface CategoryInfo {
  key: ContentType;
  label: string;
  /** Plural form used on the filter chips, e.g. "Filmer" */
  pluralLabel: string;
  /** Two-letter monogram used on poster placeholders */
  letter: string;
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
    letter: "FI",
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
    letter: "SE",
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
    letter: "BO",
    hue: 195,
    doneLabel: "Läst",
    pendingLabel: "Vill läsa",
    availLabel: "Läs eller köp",
    source: "Google Books",
  },
  spel: {
    key: "spel",
    label: "Spel",
    pluralLabel: "Spel",
    letter: "SP",
    hue: 300,
    doneLabel: "Spelad",
    pendingLabel: "Vill spela",
    availLabel: "Plattformar",
    source: "RAWG",
  },
  brädspel: {
    key: "brädspel",
    label: "Brädspel",
    pluralLabel: "Brädspel",
    letter: "BR",
    hue: 140,
    doneLabel: "Spelad",
    pendingLabel: "Vill spela",
    availLabel: "Spelinfo & köp",
    source: "BoardGameGeek",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

/** Categories whose availability is country-dependent (real streaming presence data). */
export const COUNTRY_AWARE_TYPES: ContentType[] = ["film", "serie"];
