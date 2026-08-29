import type { ContentType } from "./categories";

/** A row in the `tips` table (see src/lib/db/schema.ts), as returned by Drizzle. */
export interface TipRecord {
  id: string;
  userId: string;
  type: ContentType;
  title: string;
  year: number | null;
  externalSource: string;
  externalId: string;
  posterUrl: string | null;
  description: string | null;
  rating: string | null;
  genre: string | null;
  extra: string | null;
  recommender: string;
  note: string | null;
  completed: boolean;
  createdAt: Date;
}

export type NewTip = Omit<TipRecord, "id" | "userId" | "createdAt" | "completed"> & {
  completed?: boolean;
};

/** A normalized search result, regardless of which provider it came from. */
export interface SearchResult {
  id: string;
  source: string;
  type: ContentType;
  title: string;
  year: number | null;
  posterUrl: string | null;
  description: string | null;
  rating: string | null;
  genre: string | null;
  extra: string | null;
}

/** A single row in the availability list on the detail page. */
export interface AvailabilityItem {
  name: string;
  mode: string;
  primary: boolean;
  url?: string;
}

export interface AvailabilityResult {
  items: AvailabilityItem[];
  /** True when this category's availability is looked up per country (film/serie). */
  countryAware: boolean;
  /** Only set when countryAware is true and nothing was found for the selected country. */
  unavailableInCountry?: boolean;
  /** Link to see all options (e.g. JustWatch), when the provider offers one. */
  moreUrl?: string | null;
}
