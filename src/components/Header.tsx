import Link from "next/link";
import { auth } from "@/auth";
import { EdgeSwipeBack } from "./EdgeSwipeBack";
import { LogoMark, PlusIcon } from "./icons";
import { UserMenu } from "./UserMenu";

export async function Header({
  variant = "full",
  back = false,
}: {
  variant?: "full" | "minimal";
  /** Swaps the logo/wordmark for a back button to "/" — used on subpages
      (search, a tip's detail page, settings) instead of a separate
      below-header affordance, so it's part of the sticky header and stays
      on screen while scrolling, always in the same top-left spot on every
      viewport. Also arms the left-edge swipe-back gesture for "/" (see
      EdgeSwipeBack) so the tap target and the gesture always agree. */
  back?: boolean;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-10">
        {back ? (
          <>
            <EdgeSwipeBack href="/" />
            <Link
              href="/"
              aria-label="Tillbaka till biblioteket"
              className="inline-flex h-9.5 w-9.5 flex-none items-center justify-center rounded-full border border-border bg-bg-elevated text-text-muted"
            >
              <ChevronBack />
            </Link>
          </>
        ) : (
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <span className="serif italic text-3xl tracking-wide">Tipslistan</span>
          </Link>
        )}

        {variant === "full" ? (
          <div className="flex items-center gap-3.5">
            <Link
              href="/sok"
              aria-label="Nytt tips"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink sm:h-auto sm:w-auto sm:gap-1.75 sm:py-2.5 sm:pl-3.75 sm:pr-4.5"
            >
              <PlusIcon />
              {/* Icon-only on mobile — there isn't room for the label next
                  to the avatar in the cramped mobile header. */}
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

function ChevronBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
