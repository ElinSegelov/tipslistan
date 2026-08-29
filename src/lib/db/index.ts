import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Saknar DATABASE_URL. Kopiera .env.example till .env.local och klistra in din Neon-anslutningssträng."
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
