import { CATEGORIES, type ContentType } from "@/lib/categories";

export function TypeBadge({ type }: { type: ContentType }) {
  const cat = CATEGORIES[type];
  return (
    <span
      className="rounded-full px-1.75 py-0.5 text-[10.5px] font-bold tracking-wide"
      style={{
        background: `oklch(0.3 0.06 ${cat.hue} / 0.45)`,
        color: `oklch(0.86 0.1 ${cat.hue})`,
      }}
    >
      {cat.label}
    </span>
  );
}

/** The large italic-serif monogram placeholder used instead of a real poster/cover. */
export function PosterPlaceholder({
  type,
  fontSize = "text-[74px]",
}: {
  type: ContentType;
  fontSize?: string;
}) {
  const cat = CATEGORIES[type];
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(150deg, oklch(0.28 0.05 ${cat.hue} / 0.55) 0%, oklch(0.19 0.02 262) 65%)`,
      }}
    >
      <span
        className={`serif italic opacity-20 ${fontSize}`}
        style={{ color: `oklch(0.85 0.1 ${cat.hue})` }}
      >
        {cat.letter}
      </span>
    </div>
  );
}
