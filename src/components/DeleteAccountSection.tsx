"use client";

import { deleteAccount } from "@/lib/actions/account";
import { ConfirmDialog } from "./ConfirmDialog";
import { TrashIcon } from "./icons";

export function DeleteAccountSection() {
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
            // A successful call signs the user out, which redirects and
            // never returns here — only the error case reaches this line.
            if (result && "error" in result) throw new Error(result.error);
          }}
        />
      </div>
    </section>
  );
}
