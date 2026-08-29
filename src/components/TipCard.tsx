"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { TipRecord } from "@/lib/types";
import { PosterPlaceholder } from "./TypeBadge";
import { BookmarkIcon, CheckIcon, StarIcon } from "./icons";

export function TipCard({
  tip,
  onToggleCompleted,
}: {
  tip: TipRecord;
  onToggleCompleted: (id: string, next: boolean) => void;
}) {
  const cat = CATEGORIES[tip.type];
  const recInitial = tip.recommender?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-2.5">
      <Link href={`/titel/${tip.id}`} className="group block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border">
          <PosterPlaceholder type={tip.type} fontSize="text-[64px]" />
          {tip.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tip.posterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompleted(tip.id, !tip.completed);
            }}
            aria-label={tip.completed ? `Markera som ${cat.pendingLabel.toLowerCase()}` : `Markera som ${cat.doneLabel.toLowerCase()}`}
            className="absolute top-2.5 right-2.5 flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/10 bg-black/55 text-text backdrop-blur-sm"
          >
            {tip.completed ? <CheckIcon /> : <BookmarkIcon />}
          </button>

          {tip.rating ? (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur-sm">
              <StarIcon />
              <span className="text-[11.5px] font-bold">{tip.rating}</span>
            </div>
          ) : null}
        </div>
      </Link>

      <div>
        <Link href={`/titel/${tip.id}`} className="line-clamp-2 text-[14.5px] font-bold leading-tight text-text hover:text-text">
          {tip.title}
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
          {tip.year ? <span>{tip.year}</span> : null}
          {tip.year ? <span className="h-0.75 w-0.75 rounded-full bg-text-muted/60" /> : null}
          <span
            className="rounded-full px-1.75 py-0.5 text-[10.5px] font-bold"
            style={{ background: `oklch(0.3 0.06 ${cat.hue} / 0.45)`, color: `oklch(0.86 0.1 ${cat.hue})` }}
          >
            {cat.label}
          </span>
        </div>
        {tip.recommender ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-text-faint">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-bg-elevated text-[8.5px] font-bold text-text">
              {recInitial}
            </span>
            Tipsat av {tip.recommender}
          </div>
        ) : null}
      </div>
    </div>
  );
}
