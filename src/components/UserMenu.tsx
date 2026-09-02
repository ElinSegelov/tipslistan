"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions/account";

/** Avatar button in the header that opens a small dropdown (Inställningar,
    Logga ut) instead of the account controls sitting loose in the header
    row — keeps the mobile header to one tidy row of same-size circular
    controls instead of a cramped avatar+text stack next to the "Nytt
    tips" button. */
export function UserMenu({
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Kontomeny"
        aria-expanded={open}
        aria-haspopup="menu"
        className="block h-11 w-11 flex-none overflow-hidden rounded-full border border-border"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-cyan-800/60 bg-cyan-950/40 text-[13px] font-bold">
            {initial}
          </div>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-xl shadow-black/30"
        >
          <div className="border-b border-border px-3.5 py-3">
            <div className="truncate text-[13px] font-semibold text-text">{name ?? "Ditt konto"}</div>
            {email ? <div className="truncate text-[12px] text-text-faint">{email}</div> : null}
          </div>
          <Link
            href="/installningar"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="block px-3.5 py-2.75 text-[13px] font-semibold text-text hover:bg-bg-card"
          >
            Inställningar
          </Link>
          <Link
            href="/spara-som-app"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="block px-3.5 py-2.75 text-[13px] font-semibold text-text hover:bg-bg-card"
          >
            Spara som app
          </Link>
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-3.5 py-2.75 text-left text-[13px] font-semibold text-text-muted hover:bg-bg-card"
            >
              Logga ut
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
