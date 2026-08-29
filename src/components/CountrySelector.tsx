"use client";

import { COUNTRIES } from "@/lib/countries";

export function CountrySelector({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-[12.5px] text-text-muted">
      Streamingland
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-[12.5px] text-text outline-none"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
