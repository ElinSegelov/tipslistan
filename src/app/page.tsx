import { desc, eq } from "drizzle-orm";
import { Header } from "@/components/Header";
import { LibraryGrid } from "@/components/LibraryGrid";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tips } from "@/lib/db/schema";
import type { TipRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Middleware already redirects signed-out visitors to /login; this is a
  // defensive second check so the page never queries without a user id.
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const rows = await db
    .select()
    .from(tips)
    .where(eq(tips.userId, session.user.id))
    .orderBy(desc(tips.createdAt));

  return (
    <main className="mx-auto max-w-[1280px] px-10 pb-16 pt-9">
      <Header />

      <div className="mb-8 mt-11">
        <h1 className="serif text-[44px] italic leading-[1.05]">Dina tips</h1>
        <p className="mt-2 max-w-[560px] text-[15px] text-text-muted">
          Allt vänner har rekommenderat dig — filmer, serier, böcker, spel och brädspel, samlat på ett
          ställe.
        </p>
      </div>

      <LibraryGrid initialTips={rows as TipRecord[]} />
    </main>
  );
}
