import { defineConfig } from "drizzle-kit";

// The Next.js app gets .env.local loaded for it automatically (by `next
// dev`/`build`/`start`), but drizzle-kit is a separate CLI that doesn't —
// without this, `npx drizzle-kit ...` fails with "DATABASE_URL saknas" even
// though .env.local has it. Node's built-in loader covers it with no extra
// dependency; ignore the error when the file simply isn't there yet.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local missing — the check below will report it with a clear message.
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL saknas — kopiera .env.example till .env.local först.");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
});
