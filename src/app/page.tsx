import { desc, eq } from "drizzle-orm";
import { Footer } from "@/components/Footer";
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
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-10 md:pt-6">
        <div className="mb-8">
          <h1 className="serif text-[44px] italic leading-[1.05]">Dina tips</h1>
          <p className="mt-2 max-w-140 text-[15px] text-text-muted">
            Alla tips på samma ställe — filmer, serier, böcker, tv-spel och brädspel.</p>
        </div>

        <LibraryGrid initialTips={rows as TipRecord[]} />
      </main>
      <Footer />
    </>
  );
}
