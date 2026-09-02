import { COUNTRIES } from "@/lib/countries";
import type { AvailabilityResult } from "@/lib/types";
import { AlertIcon, ListIcon } from "./icons";

export function AvailabilityPills({
  data,
  loading,
  hue,
  country,
}: {
  data: AvailabilityResult | null;
  loading: boolean;
  hue: number;
  country: string;
}) {
  if (loading) {
    return <div className="text-sm text-text-faint">Hämtar …</div>;
  }
  if (!data) {
    return <div className="text-sm text-text-faint">Kunde inte hämta tillgänglighet just nu.</div>;
  }

  if (data.countryAware && data.unavailableInCountry) {
    const countryLabel = COUNTRIES.find((c) => c.code === country)?.label ?? country;
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-amber-700/40 bg-amber-950/15 px-4 py-3.5 text-[13px] text-amber-200/90">
        <AlertIcon className="mt-0.5 flex-none" />
        <span>
          Inte tillgänglig att streama i <strong>{countryLabel}</strong> just nu. Prova ett annat land i
          väljaren ovan, eller kolla igen senare — utbudet ändras löpande.
        </span>
      </div>
    );
  }

  if (data.items.length === 0) {
    return <div className="text-sm text-text-faint">Ingen information hittades.</div>;
  }

  return (
    // `max-w-full` + `overflow-hidden` as a targeted backstop right at the
    // source, on top of the page-wide overflow-x guard in globals.css: an
    // individual pill can't itself force this row (and so the page) wider
    // than its column, even with an unusually long service name and lots
    // of them (many streaming options on a narrow phone is what surfaced
    // this). `max-w-full` rather than `100vw` on purpose — `vw` is
    // relative to the viewport, not this element's own column, so on an
    // indented container it can end up *wider* than the available space
    // instead of capping it.
    <div className="flex max-w-full flex-col gap-3 overflow-clip">
      <div className="flex flex-wrap gap-2.5">
        {data.items.map((item, i) =>
          item.url ? (
            <a
              key={`${item.name}-${i}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold"
              style={
                item.primary
                  ? { background: `oklch(0.3 0.06 ${hue} / 0.45)`, color: `oklch(0.88 0.1 ${hue})` }
                  : { border: "1px solid var(--border)", color: "var(--text-faint)" }
              }
            >
              {item.primary ? <ListIcon /> : null}
              {item.name}
              <span className="font-medium opacity-65">· {item.mode}</span>
            </a>
          ) : (
            <div
              key={`${item.name}-${i}`}
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold"
              style={
                item.primary
                  ? { background: `oklch(0.3 0.06 ${hue} / 0.45)`, color: `oklch(0.88 0.1 ${hue})` }
                  : { border: "1px solid var(--border)", color: "var(--text-faint)" }
              }
            >
              {item.primary ? <ListIcon /> : null}
              {item.name}
              <span className="font-medium opacity-65">· {item.mode}</span>
            </div>
          )
        )}
      </div>
      {data.moreUrl ? (
        <a href={data.moreUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold">
          Se alla streamingalternativ →
        </a>
      ) : null}
    </div>
  );
}
