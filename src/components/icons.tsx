import type { SVGProps } from "react";

/** Same bulleted-list mark as the favicon/app icons (see src/app/favicon.ico,
    public/icon-*.png) — a rounded dark tile with the amber list glyph, so
    the wordmark logo and the icon read as the same brand everywhere. */
export function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill="var(--bg-elevated)" />
      <circle cx="5.85" cy="7.8" r="1.3" fill="var(--accent)" />
      <path d="M10.05 7.8h9.4" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="5.85" cy="12" r="1.3" fill="var(--accent)" />
      <path d="M10.05 12h9.4" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="5.85" cy="16.2" r="1.3" fill="var(--accent)" />
      <path d="M10.05 16.2h9.4" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function StarIcon({ fill = "oklch(0.78 0.14 65)", ...props }: SVGProps<SVGSVGElement> & { fill?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={fill} {...props}>
      <path d="M12 2l2.9 6.6L22 9.3l-5 5 1.3 7.2L12 18l-6.3 3.5L7 14.3l-5-5 7.1-.7L12 2z" />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}


export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Same bulleted-list motif as the app favicon — used wherever we point at a
    specific streaming/purchase option, replacing the old play-triangle. */
export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" {...props}>
      <circle cx="3.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <path d="M8.5 6h12" />
      <circle cx="3.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <path d="M8.5 12h12" />
      <circle cx="3.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
      <path d="M8.5 18h8" />
    </svg>
  );
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9L2.5 18a1.5 1.5 0 001.3 2.2h16.4a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-2.6 0z" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16M9 7V4.5a1 1 0 011-1h4a1 1 0 011 1V7m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10zM10 11v6M14 11v6" />
    </svg>
  );
}

export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4" />
    </svg>
  );
}
