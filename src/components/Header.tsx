import Link from "next/link";
import { auth, signOut } from "@/auth";
import { LogoMark, PlusIcon } from "./icons";

export async function Header({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="serif italic text-[22px] tracking-wide">Tipslistan</span>
        </Link>

        {variant === "full" ? (
          <div className="flex items-center gap-3.5">
            <Link
              href="/sok"
              aria-label="Nytt tips"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink sm:h-auto sm:w-auto sm:gap-1.75 sm:py-2.5 sm:pl-3.75 sm:pr-4.5"
            >
              <PlusIcon />
              {/* Icon-only on mobile — there isn't room for the label next
                  to the avatar/logout stack in the cramped mobile header. */}
              <span className="hidden text-[13.5px] font-bold sm:inline">Nytt tips</span>
            </Link>
            {user ? <UserMenu name={user.name} email={user.email} image={user.image} /> : null}
          </div>
        ) : user ? (
          <UserMenu name={user.name} email={user.email} image={user.image} />
        ) : null}
      </div>
    </header>
  );
}

/** Icon-only "back" affordance for the minimal-header pages (/sok,
    /titel/[id]) — sits in normal document flow just below the sticky
    header (not inside it), so it scrolls away with the page content
    instead of the header. */
export function BackToLibrary() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-10">
      <Link
        href="/"
        aria-label="Tillbaka till biblioteket"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-muted"
      >
        <ChevronBack />
      </Link>
    </div>
  );
}

function UserMenu({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const label = name ?? email ?? "?";
  const initial = label.charAt(0).toUpperCase();

  return (
    // Stacked (avatar above "Logga ut") on narrow screens to save the
    // horizontal space a full row costs in the mobile header; back to a
    // single row from `sm:` up.
    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2.5">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-9.5 w-9.5 rounded-full border border-border" />
      ) : (
        <div className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-cyan-800/60 bg-cyan-950/40 text-[13px] font-bold">
          {initial}
        </div>
      )}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="text-[12.5px] font-semibold text-text-faint hover:text-text-muted">
          Logga ut
        </button>
      </form>
    </div>
  );
}

function ChevronBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
