"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, COUNTRY_AWARE_TYPES } from "@/lib/categories";
import type { AvailabilityResult, TipRecord } from "@/lib/types";
import { useCountry } from "@/lib/useCountry";
import { PosterPlaceholder, TypeBadge } from "./TypeBadge";
import { CountrySelector } from "./CountrySelector";
import { AvailabilityPills } from "./AvailabilityPills";
import { StarIcon } from "./icons";

export function DetailView({ tip }: { tip: TipRecord }) {
  const cat = CATEGORIES[tip.type];
  const countryAware = COUNTRY_AWARE_TYPES.includes(tip.type);
  const [country, setCountry] = useCountry();

  // `loading` is derived from whether the fetched data matches the current
  // request key, rather than a separate flag flipped at the top of the
  // effect — that keeps every setState call inside an async callback.
  const requestKey = `${tip.type}|${tip.externalSource}|${tip.externalId}|${country}`;
  const [availabilityState, setAvailabilityState] = useState<{ key: string; data: AvailabilityResult | null }>({
    key: "",
    data: null,
  });
  const loading = availabilityState.key !== requestKey;
  const availability = availabilityState.key === requestKey ? availabilityState.data : null;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      type: tip.type,
      source: tip.externalSource,
      id: tip.externalId,
      title: tip.title,
      country,
    });
    fetch(`/api/availability?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAvailabilityState({ key: requestKey, data: data.error ? null : data });
      })
      .catch(() => {
        if (!cancelled) setAvailabilityState({ key: requestKey, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, tip.type, tip.externalSource, tip.externalId, tip.title, country]);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-9 sm:grid-cols-[220px_1fr]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border">
          <PosterPlaceholder type={tip.type} fontSize="text-[88px]" />
          {tip.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tip.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-2.5 flex items-center gap-2">
            <TypeBadge type={tip.type} />
            <span className="text-xs text-text-faint">Källa: {cat.source}</span>
          </div>
          <h1 className="serif mb-3 text-[46px] italic leading-[1.05]">{tip.title}</h1>
          <div className="mb-4.5 flex flex-wrap items-center gap-2 text-[13.5px] text-text-muted">
            {tip.year ? <span>{tip.year}</span> : null}
            {tip.genre ? (
              <>
                <Dot />
                <span>{tip.genre}</span>
              </>
            ) : null}
            {tip.extra ? (
              <>
                <Dot />
                <span>{tip.extra}</span>
              </>
            ) : null}
            {tip.rating ? (
              <>
                <Dot />
                <span className="flex items-center gap-1">
                  <StarIcon /> {tip.rating}
                </span>
              </>
            ) : null}
          </div>

          {tip.description ? (
            <p className="mb-5 max-w-160 text-sm leading-relaxed text-text-muted">{tip.description}</p>
          ) : null}

          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-cyan-800/60 bg-cyan-950/40 text-[10px] font-bold">
              {tip.recommender.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px] text-text-muted">
              Tipsat av <strong className="text-text">{tip.recommender}</strong>
              {" · "}
              {new Date(tip.createdAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {tip.note ? (
            <div className="border-l-2 py-1 pl-4" style={{ borderColor: `oklch(0.72 0.13 ${cat.hue})` }}>
              <span className="serif italic text-base text-text/90">&ldquo;{tip.note}&rdquo;</span>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] font-bold uppercase tracking-wide text-text-muted">{cat.availLabel}</div>
          {countryAware ? <CountrySelector value={country} onChange={setCountry} /> : null}
        </div>
        <AvailabilityPills data={availability} loading={loading} hue={cat.hue} country={country} />
      </div>
    </>
  );
}

function Dot() {
  return <span className="h-0.75 w-0.75 rounded-full bg-text-muted/60" />;
}
