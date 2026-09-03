"use server";

import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Du måste vara inloggad.");
  return session.user.id;
}

/** Used by the header's user menu — a dedicated top-level "use server"
    action so it can be wired up from a Client Component (UserMenu.tsx),
    which can't define an inline "use server" closure itself. */
export async function logout() {
  await signOut({ redirectTo: "/login" });
}

/** Deletes the signed-in user's account and everything tied to it. The
    `user` row cascades to `account`, `session` and `tips` (see the
    onDelete: "cascade" references in src/lib/db/schema.ts), so this one
    delete is enough — no need to clean up related tables by hand.

    Deliberately does NOT sign the user out — the caller (DeleteAccountSection)
    shows a brief confirmation first and then calls `finalizeAccountDeletion`
    itself, so the user sees that the deletion actually happened before
    getting redirected away. */
export async function deleteAccount(): Promise<{ error: string } | { success: true }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Du måste vara inloggad." };
  }

  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunde inte radera kontot." };
  }

  return { success: true };
}

/** Signs the user out after their account has been deleted (see
    `deleteAccount` above). Split out into its own action so the client can
    show a short "kontot är raderat"-confirmation before this runs — this is
    the call that actually redirects. */
export async function finalizeAccountDeletion() {
  await signOut({ redirectTo: "/login?raderat=1" });
}
