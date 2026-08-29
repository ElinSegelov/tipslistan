import Link from "next/link";
import { auth, signOut } from "@/auth";
import { LogoMark, PlusIcon, SearchIcon } from "./icons";

export async function Header({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <LogoMark />
        <span className="serif italic text-[22px] tracking-wide">Marquee</span>
      </Link>

      {variant === "full" ? (
        <div className="flex items-center gap-3.5">
          <Link
            href="/sok"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-text/80"
            aria-label="Sök"
          >
            <SearchIcon />
          </Link>
          <Link
            href="/sok"
            className="flex items-center gap-[7px] rounded-full bg-accent py-2.5 pl-[15px] pr-[18px] text-[13.5px] font-bold text-accent-ink"
          >
            <PlusIcon />
            Lägg till tips
          </Link>
          {user ? <UserMenu name={user.name} email={user.email} image={user.image} /> : null}
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-[13px] font-semibold text-text-muted">
            <ChevronBack /> Tillbaka till biblioteket
          </Link>
          {user ? <UserMenu name={user.name} email={user.email} image={user.image} /> : null}
        </div>
      )}
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
    <div className="flex items-center gap-2.5">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-[38px] w-[38px] rounded-full border border-border" />
      ) : (
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-cyan-800/60 bg-cyan-950/40 text-[13px] font-bold">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
