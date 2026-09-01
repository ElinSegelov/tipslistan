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

/** Placeholder shown instead of a real poster/cover — permanently for
    manually-added tips (they never have a posterUrl), briefly for
    API-sourced ones while the image loads. Spells out the category
    ("Bok", "Film", …) rather than the old two-letter monogram, since for
    manual entries this is the only visual the card ever gets. Defaults to
    a large 4rem label everywhere; pass `sizeClassName` to override it at
    a specific call site (e.g. a smaller size on the detail page in mobile
    view, where the poster column is narrower). `break-words` keeps the
    longest label ("Brädspel") from overflowing narrow grid cards. */
export function PosterPlaceholder({
  type,
  sizeClassName = "text-[4rem]",
}: {
  type: ContentType;
  sizeClassName?: string;
}) {
  const cat = CATEGORIES[type];
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 text-center"
      style={{
        background: `linear-gradient(150deg, oklch(0.28 0.05 ${cat.hue} / 0.55) 0%, oklch(0.19 0.02 262) 65%)`,
      }}
    >
      <span
        className={`serif break-words italic leading-tight opacity-40 ${sizeClassName}`}
        style={{ color: `oklch(0.85 0.1 ${cat.hue})` }}
      >
        {cat.label}
      </span>
    </div>
  );
}
