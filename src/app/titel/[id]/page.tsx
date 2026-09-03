import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DetailView } from "@/components/DetailView";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tips } from "@/lib/db/schema";
import type { TipRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  let row;
  try {
    // Scoped to the signed-in user so nobody can view someone else's tip by
    // guessing an id — a malformed id (not a valid uuid) also lands here and
    // is treated the same as "not found".
    [row] = await db
      .select()
      .from(tips)
      .where(and(eq(tips.id, id), eq(tips.userId, session.user.id)))
      .limit(1);
  } catch {
    notFound();
  }

  if (!row) {
    notFound();
  }

  return (
    <>
      <Header variant="minimal" back />
      <main className="flex-1 min-w-0 w-full mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-10">
        <DetailView tip={row as TipRecord} />
      </main>
      <Footer />
    </>
  );
}
