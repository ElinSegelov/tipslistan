import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Auth.js tables -------------------------------------------------------
// Shape required by @auth/drizzle-adapter's Postgres adapter — see
// https://authjs.dev/getting-started/adapters/drizzle. Keep the column
// names exactly as they are (don't rename them), since the adapter
// reads/writes them by exact name.

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// --- App data ---------------------------------------------------------
// One table for every tip, regardless of type (film, serie, bok, spel,
// brädspel), scoped to the user who added it. Availability (streaming/
// platforms/etc.) is fetched live from the source APIs at read time (see
// src/app/api/availability), not stored here.

export const tips = pgTable("tips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'film' | 'serie' | 'bok' | 'spel' | 'brädspel'
  title: text("title").notNull(),
  year: integer("year"),
  externalSource: text("externalSource").notNull(), // 'tmdb' | 'google_books' | 'open_library' | 'rawg' | 'bgg'
  externalId: text("externalId").notNull(),
  posterUrl: text("posterUrl"),
  description: text("description"),
  rating: text("rating"),
  genre: text("genre"),
  extra: text("extra"),
  recommender: text("recommender"),
  note: text("note"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});
