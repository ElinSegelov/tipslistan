"use client";

import { useEffect, useRef, useState } from "react";
import { AlertIcon } from "./icons";

/** Reusable native-<dialog>-based confirmation modal, styled to match the
    app's dark theme (no external UI library). Used for destructive actions
    that need a confirm step — deleting a tip, deleting the account.
    `requireText`, when set, disables the confirm button until the user has
    typed that exact word, for actions that deserve more friction than a
    plain "are you sure".

    Open/closed state lives in React state rather than being driven
    directly off the ref, so the `open`/`close` closures handed to the
    trigger render-prop never touch `ref.current` themselves — only the
    effect below does, which is where DOM/ref access belongs. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Avbryt",
  requireText,
  onConfirm,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  requireText?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (visible && !dialog.open) dialog.showModal();
    else if (!visible && dialog.open) dialog.close();
  }, [visible]);

  function open() {
    setTyped("");
    setError(null);
    setVisible(true);
  }

  function close() {
    if (pending) return;
    setVisible(false);
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      // If onConfirm triggers a redirect (e.g. a server action that signs
      // the user out), the client may navigate away before we get here —
      // that's fine, there's nothing left to clean up in that case.
      setVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || (requireText !== undefined && typed !== requireText);

  return (
    <>
      {trigger(open)}
      <dialog
        ref={ref}
        onClose={() => setVisible(false)}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
        className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-border bg-bg-card p-6 text-text backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="mb-1.5 flex items-center gap-2 text-red-300">
          <AlertIcon />
          <h2 className="text-[15px] font-bold">{title}</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-text-muted">{description}</p>

        {requireText !== undefined ? (
          <div className="mb-4">
            <label htmlFor="confirm-dialog-text" className="mb-1.5 block text-xs font-semibold text-text-muted">
              Skriv <span className="font-mono text-text">{requireText}</span> för att bekräfta
            </label>
            <input
              id="confirm-dialog-text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-[10px] border border-border bg-bg px-3.5 py-2.75 text-sm outline-none"
            />
          </div>
        ) : null}

        {error ? <div className="mb-4 text-sm text-red-300">{error}</div> : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="rounded-xl border border-border px-4 py-2.25 text-[13px] font-semibold text-text-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={disabled}
            className="rounded-xl bg-red-600 px-4 py-2.25 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
