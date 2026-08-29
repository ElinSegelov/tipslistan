"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LIST, type ContentType } from "@/lib/categories";
import type { TipRecord } from "@/lib/types";
import { toggleTipCompleted } from "@/lib/actions/tips";
import { TipCard } from "./TipCard";

type FilterKey = ContentType | "alla";

export function LibraryGrid({ initialTips }: { initialTips: TipRecord[] }) {
  const [tips, setTips] = useState(initialTips);
  const [filter, setFilter] = useState<FilterKey>("alla");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { alla: tips.length, film: 0, serie: 0, bok: 0, spel: 0, brädspel: 0 };
    for (const t of tips) c[t.type]++;
    return c;
  }, [tips]);

  const visible = filter === "alla" ? tips : tips.filter((t) => t.type === filter);

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
      <div className="mb-9 flex flex-wrap gap-2.5">
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

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-text-muted">
          {tips.length === 0
            ? "Inga tips ännu — lägg till ditt första via “Lägg till tips” ovan."
            : "Inga tips i den här kategorin än."}
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
