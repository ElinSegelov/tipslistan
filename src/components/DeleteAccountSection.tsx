"use client";

import { useEffect, useRef, useState } from "react";
import { deleteAccount, finalizeAccountDeletion } from "@/lib/actions/account";
import { ConfirmDialog } from "./ConfirmDialog";
import { CheckIcon, TrashIcon } from "./icons";

// How long the "kontot är raderat" confirmation stays up before the user is
// actually signed out — long enough to read, short enough not to feel stuck.
const LOGOUT_DELAY_MS = 2500;

export function DeleteAccountSection() {
  const successRef = useRef<HTMLDialogElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const dialog = successRef.current;
    if (!dialog) return;
    if (showSuccess && !dialog.open) dialog.showModal();
  }, [showSuccess]);

  // Once the success dialog is up, sign the user out (and redirect to
  // /login) after a short delay — this is the actual logout, split out of
  // deleteAccount() so it only happens once they've seen the confirmation.
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      finalizeAccountDeletion();
    }, LOGOUT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  return (
    <section className="rounded-2xl border border-red-900/40 bg-red-950/10 p-5">
      <div className="text-[13px] font-bold uppercase tracking-wide text-red-300">Farlig zon</div>
      <p className="mt-1.5 max-w-120 text-sm leading-relaxed text-text-muted">
        Raderar ditt konto och alla dina tips permanent, direkt. Det går inte att ångra.
      </p>
      <div className="mt-4">
        <ConfirmDialog
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="flex items-center gap-1.75 rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-2.25 text-[13px] font-bold text-red-300"
            >
              <TrashIcon /> Radera konto
            </button>
          )}
          title="Radera ditt konto?"
          description="Det här tar bort kontot och alla dina tips permanent, direkt. Det går inte att ångra."
          confirmLabel="Radera konto"
          requireText="RADERA"
          onConfirm={async () => {
            const result = await deleteAccount();
            if ("error" in result) throw new Error(result.error);
            // Success: ConfirmDialog closes itself right after this
            // resolves, and we open the confirmation dialog below instead
            // of signing out immediately.
            setShowSuccess(true);
          }}
        />
      </div>

      {/* Shown for a few seconds right after a successful deletion, before
          finalizeAccountDeletion() above signs the user out — confirms the
          deletion actually happened instead of yanking them straight to the
          login page. No buttons: there's nothing left to confirm or cancel,
          so Escape/backdrop-dismiss is blocked to keep it visible for the
          full delay. */}
      <dialog
        ref={successRef}
        onCancel={(e) => e.preventDefault()}
        className="m-auto w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-border bg-bg-card p-6 text-text backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="mb-1.5 flex items-center gap-2 text-emerald-300">
          <CheckIcon />
          <h2 className="text-[15px] font-bold">Kontot är raderat</h2>
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          Kontot och alla dina tips är permanent borttagna. Du loggas ut om ett ögonblick …
        </p>
      </dialog>
    </section>
  );
}
