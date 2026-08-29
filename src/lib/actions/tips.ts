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
