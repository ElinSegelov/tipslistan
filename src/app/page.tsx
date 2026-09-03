import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LibraryGrid } from "@/components/LibraryGrid";
import { LogoMark } from "@/components/icons";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tips } from "@/lib/db/schema";
import type { TipRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

// "/" is public (see src/proxy.ts) precisely so this landing view exists —
// it's what a logged-out visitor (or Google) actually gets to see and
// link to, instead of bouncing straight to a login wall with no context.
function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-105 flex-col items-center justify-center px-8 py-16 text-center">
      <LogoMark size={40} />
      <h1 className="serif mt-7 text-[42px] italic leading-[1.05] sm:text-[52px]">Tipslistan</h1>
      <p className="mt-5 max-w-90 text-[15px] leading-relaxed text-text-muted">
        Filmer, serier, böcker, videospel och brädspel som du fått tips om — samlade på ett
        ställe, så du faktiskt hittar tillbaka till dem.
      </p>
      <Link
        href="/login"
        className="mt-9 inline-flex items-center gap-1.75 rounded-full bg-accent px-6 py-3 text-[14.5px] font-bold text-accent-ink"
      >
        Logga in
      </Link>
    </main>
  );
}

export default async function HomePage() {
  // There's no middleware guarding this specific check — every protected
  // page checks the session itself. A logged-out visitor sees the public
  // landing page above instead of the library.
  const session = await auth();
  if (!session?.user?.id) {
    return <LandingPage />;
  }

  const rows = await db
    .select()
    .from(tips)
    .where(eq(tips.userId, session.user.id))
    .orderBy(desc(tips.createdAt));

  return (
    <>
      <Header />
      <main className="flex-1 min-w-0 w-full mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-10 md:pt-6">
        <div className="mb-8">
          <h1 className="serif text-[44px] italic leading-[1.05]">Dina tips</h1>
          <p className="mt-2 max-w-140 text-[15px] text-text-muted">
            Alla tips på samma ställe — filmer, serier, böcker, videospel och brädspel.</p>
        </div>

        <LibraryGrid initialTips={rows as TipRecord[]} />
      </main>
      <Footer />
    </>
  );
}
