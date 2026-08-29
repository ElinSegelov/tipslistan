export interface Country {
  code: string; // ISO 3166-1, matches TMDB's watch/providers regions
  label: string;
}

export const COUNTRIES: Country[] = [
  { code: "SE", label: "Sverige" },
  { code: "NO", label: "Norge" },
  { code: "DK", label: "Danmark" },
  { code: "FI", label: "Finland" },
  { code: "DE", label: "Tyskland" },
  { code: "GB", label: "Storbritannien" },
  { code: "US", label: "USA" },
  { code: "FR", label: "Frankrike" },
  { code: "ES", label: "Spanien" },
  { code: "NL", label: "Nederländerna" },
];

export const DEFAULT_COUNTRY = "SE";
