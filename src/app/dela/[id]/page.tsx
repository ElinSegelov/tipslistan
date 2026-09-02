import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Footer } from "@/components/Footer";
import { LogoMark } from "@/components/icons";
import { PosterPlaceholder, TypeBadge } from "@/components/TypeBadge";
import { addSharedTip } from "@/lib/actions/tips";
import { CATEGORIES, genreOrAuthorLabel } from "@/lib/categories";
import { db } from "@/lib/db";
import { tips } from "@/lib/db/schema";
import type { TipRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

// Public — deliberately NOT scoped to a signed-in user, since the whole
// point is that anyone with the link (no account) can open it. Only the
// fields that are safe to show a stranger are read into the page below:
// no recommender, note or review, even though they're in the same row.
async function getTip(id: string): Promise<TipRecord | null> {
  try {
    const [row] = await db.select().from(tips).where(eq(tips.id, id)).limit(1);
    return (row as TipRecord) ?? null;
  } catch {
    // A malformed id (not a valid uuid) throws at the db layer — treat it
    // the same as "not found" rather than a 500.
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tip = await getTip(id);
  if (!tip) return { title: "Tipset hittades inte – Tipslistan" };

  const cat = CATEGORIES[tip.type];
  const title = `${tip.title} – Tipslistan`;
  const description = tip.description ?? `${cat.label} tipsat via Tipslistan.`;
  // RAWG's API terms explicitly forbid further distribution of their
  // images, so game covers never become the share-card image — every
  // other source (TMDB, Google Books, Open Library, BGG) is linked to
  // directly here, the same way the app already displays them, rather
  // than re-hosting a copy. Omitting `images` falls back to the site's
  // default opengraph-image.png (see src/app/opengraph-image.png).
  const images = tip.externalSource !== "rawg" && tip.posterUrl ? [tip.posterUrl] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function SharedTipPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const tip = await getTip(id);
  if (!tip) notFound();

  const cat = CATEGORIES[tip.type];
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  async function addToLibrary() {
    "use server";
    const result = await addSharedTip(id);
    if ("error" in result) {
      redirect(`/dela/${id}?error=1`);
    }
    redirect(`/titel/${result.id}`);
  }

  return (
    <>
      {/* Deliberately not the app's <Header> — no "Nytt tips"/account menu
          for a page a stranger without an account might land on. */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <span className="serif italic text-3xl tracking-wide">Tipslistan</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl px-4 pb-16 pt-9 sm:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr] sm:gap-9">
          <div className="relative mx-auto aspect-[2/3] w-36 flex-none overflow-hidden rounded-2xl border border-border sm:mx-0 sm:w-auto">
            <PosterPlaceholder type={tip.type} />
            {tip.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tip.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-2.5 flex items-center gap-2">
              <TypeBadge type={tip.type} />
              <span className="text-xs text-text-faint">Källa: {tip.externalSource === "manual" ? "Manuellt" : cat.source}</span>
            </div>
            <h1 className="serif mb-3 text-[32px] italic leading-[1.05] sm:text-[46px]">{tip.title}</h1>
            <div className="mb-4.5 flex flex-wrap items-center gap-2 text-[13.5px] text-text-muted">
              {tip.year ? <span>{tip.year}</span> : null}
              {tip.genre ? (
                <>
                  <span className="h-0.75 w-0.75 rounded-full bg-text-muted/60" />
                  <span>{genreOrAuthorLabel(tip.type, tip.genre)}</span>
                </>
              ) : null}
            </div>
            {tip.description ? (
              <p className="mb-6 max-w-140 text-sm leading-relaxed text-text-muted">{tip.description}</p>
            ) : null}

            {isLoggedIn ? (
              <form action={addToLibrary}>
                <button
                  type="submit"
                  className="inline-flex w-fit items-center gap-1.75 rounded-full bg-accent px-4 py-2.5 text-[13.5px] font-bold text-accent-ink"
                >
                  Lägg till i mitt bibliotek
                </button>
              </form>
            ) : (
              <Link
                href={`/login?from=/dela/${id}`}
                className="inline-flex w-fit items-center gap-1.75 rounded-full bg-accent px-4 py-2.5 text-[13.5px] font-bold text-accent-ink"
              >
                Logga in för att lägga till
              </Link>
            )}
            {error ? (
              <p className="mt-2.5 text-[12.5px] text-red-300">Kunde inte lägga till tipset. Försök igen.</p>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
