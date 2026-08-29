import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
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
    <main className="mx-auto max-w-320 px-10 pb-16 pt-9">
      <Header variant="minimal" />
      <div className="mt-9">
        <DetailView tip={row as TipRecord} />
      </div>
    </main>
  );
}
