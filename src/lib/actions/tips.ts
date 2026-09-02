"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tips } from "@/lib/db/schema";
import type { NewTip } from "@/lib/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Du måste vara inloggad.");
  return session.user.id;
}

export async function addTip(input: NewTip): Promise<{ id: string } | { error: string }> {
  try {
    const userId = await requireUserId();
    const [row] = await db
      .insert(tips)
      .values({
        userId,
        type: input.type,
        title: input.title,
        year: input.year,
        externalSource: input.externalSource,
        externalId: input.externalId,
        posterUrl: input.posterUrl,
        description: input.description,
        rating: input.rating,
        genre: input.genre,
        extra: input.extra,
        recommender: input.recommender,
        note: input.note,
      })
      .returning({ id: tips.id });
    revalidatePath("/");
    return { id: row.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte lägga till tipset." };
  }
}

export async function deleteTip(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireUserId();
    await db.delete(tips).where(and(eq(tips.id, id), eq(tips.userId, userId)));
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte ta bort tipset." };
  }
}

export async function toggleTipCompleted(
  id: string,
  completed: boolean
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireUserId();
    await db
      .update(tips)
      .set({ completed })
      .where(and(eq(tips.id, id), eq(tips.userId, userId)));
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte uppdatera tipset." };
  }
}

export async function updateTipReview(
  id: string,
  review: string | null
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireUserId();
    await db
      .update(tips)
      .set({ review })
      .where(and(eq(tips.id, id), eq(tips.userId, userId)));
    revalidatePath("/");
    revalidatePath(`/titel/${id}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte spara." };
  }
}

/** Edits the content fields of a manually-added tip (title, year,
    genre/author, rating, description, recommender, note). Restricted to
    `externalSource: "manual"` rows — API-sourced tips are re-fetched from
    their provider instead of hand-edited, so this can never touch one even
    if called with a mismatched id. */
export async function updateManualTip(
  id: string,
  input: {
    title: string;
    year: number | null;
    genre: string | null;
    rating: string | null;
    description: string | null;
    recommender: string | null;
    note: string | null;
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireUserId();
    await db
      .update(tips)
      .set({
        title: input.title,
        year: input.year,
        genre: input.genre,
        rating: input.rating,
        description: input.description,
        recommender: input.recommender,
        note: input.note,
      })
      .where(and(eq(tips.id, id), eq(tips.userId, userId), eq(tips.externalSource, "manual")));
    revalidatePath("/");
    revalidatePath(`/titel/${id}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte spara." };
  }
}

/** Adds a copy of someone else's shared tip (see src/app/dela/[id]/page.tsx)
    into the current user's own library. Only the fields the share page
    itself shows are copied over — not the original owner's recommender,
    note or review, which stay private to their row. If the same title
    (by type + source + external id) is already in the user's library,
    hands back that existing row instead of creating a duplicate. */
export async function addSharedTip(sourceId: string): Promise<{ id: string } | { error: string }> {
  try {
    const userId = await requireUserId();
    const [source] = await db.select().from(tips).where(eq(tips.id, sourceId)).limit(1);
    if (!source) return { error: "Tipset hittades inte." };

    const [existing] = await db
      .select({ id: tips.id })
      .from(tips)
      .where(
        and(
          eq(tips.userId, userId),
          eq(tips.type, source.type),
          eq(tips.externalSource, source.externalSource),
          eq(tips.externalId, source.externalId)
        )
      )
      .limit(1);
    if (existing) return { id: existing.id };

    const [row] = await db
      .insert(tips)
      .values({
        userId,
        type: source.type,
        title: source.title,
        year: source.year,
        externalSource: source.externalSource,
        externalId: source.externalId,
        posterUrl: source.posterUrl,
        description: source.description,
        rating: source.rating,
        genre: source.genre,
        extra: source.extra,
        recommender: null,
        note: null,
      })
      .returning({ id: tips.id });
    revalidatePath("/");
    return { id: row.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte lägga till tipset." };
  }
}
