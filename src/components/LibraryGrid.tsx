"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LIST, type ContentType } from "@/lib/categories";
import type { TipRecord } from "@/lib/types";
import { toggleTipCompleted } from "@/lib/actions/tips";
import { CheckIcon } from "./icons";
import { TipCard } from "./TipCard";

type FilterKey = ContentType | "alla";
type CompletionFilter = "alla" | "klara" | "ej_klara";

const COMPLETION_CHIPS: { key: CompletionFilter; label: string }[] = [
  { key: "alla", label: "Alla" },
  { key: "klara", label: "Klara" },
  { key: "ej_klara", label: "Ej klara" },
];

export function LibraryGrid({ initialTips }: { initialTips: TipRecord[] }) {
  const [tips, setTips] = useState(initialTips);
  const [filter, setFilter] = useState<FilterKey>("alla");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("alla");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { alla: tips.length, film: 0, serie: 0, bok: 0, spel: 0, brädspel: 0 };
    for (const t of tips) c[t.type]++;
    return c;
  }, [tips]);

  const byCategory = filter === "alla" ? tips : tips.filter((t) => t.type === filter);
  // With no completion filter chosen, push done tips to the bottom instead
  // of leaving them mixed in chronologically — `sort` is stable, so within
  // "not done" and "done" the existing (newest-first) order is untouched.
  // Either single-status filter already shows one group, so there's
  // nothing left to reorder there.
  const visible =
    completionFilter === "alla"
      ? [...byCategory].sort((a, b) => Number(a.completed) - Number(b.completed))
      : byCategory.filter((t) => (completionFilter === "klara" ? t.completed : !t.completed));

  async function toggleCompleted(id: string, next: boolean) {
    setTips((prev) => prev.map((t) => (t.id === id ? { ...t, completed: next } : t)));
    const result = await toggleTipCompleted(id, next);
    if ("error" in result) {
      console.error(result.error);
      // Roll back on failure.
      setTips((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !next } : t)));
    }
  }

  const chips: { key: FilterKey; label: string }[] = [
    { key: "alla", label: "Alla" },
    ...CATEGORY_LIST.map((c) => ({ key: c.key, label: c.pluralLabel })),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2.5">
        {chips.map((chip) => {
          const active = filter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={
                active
                  ? "rounded-full bg-accent px-4 py-2.5 text-[13.5px] font-bold text-accent-ink"
                  : "rounded-full border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text-muted"
              }
            >
              {chip.label}
              <span className="ml-1.5 font-semibold opacity-65">{counts[chip.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-9 flex flex-wrap items-center gap-1.5 rounded-full border border-border p-1 w-fit">
        {COMPLETION_CHIPS.map((chip) => {
          const active = completionFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setCompletionFilter(chip.key)}
              className={
                active
                  ? "flex items-center gap-1.25 rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-bold text-text"
                  : "flex items-center gap-1.25 rounded-full px-3 py-1.5 text-xs font-semibold text-text-muted"
              }
            >
              {chip.key === "klara" ? (
                <span className="text-emerald-400">
                  <CheckIcon />
                </span>
              ) : chip.key === "ej_klara" ? (
                <span className="h-2.5 w-2.5 rounded-full border border-current" />
              ) : null}
              {chip.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-text-muted">
          {tips.length === 0
            ? "Inga tips ännu — lägg till ditt första via “Lägg till tips” ovan."
            : "Inga tips matchar de här filtren."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((tip) => (
            <TipCard key={tip.id} tip={tip} onToggleCompleted={toggleCompleted} />
          ))}
        </div>
      )}
    </div>
  );
}
