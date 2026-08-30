import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Tipslistan",
  description: "Dina tips på filmer, serier, böcker, tv-spel och brädspel — samlade på ett ställe.",
  // Chrome/Android's install prompt gets its icon from manifest.ts
  // (src/app/manifest.ts); iOS ignores that file, so its "Add to Home
  // Screen" icon and standalone behavior come from these apple-* fields
  // instead — both point at the same list-icon artwork as the favicon.
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Tipslistan",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#11161f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${instrumentSerif.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full antialiased">
        <div className="cinematic-backdrop" />
        <div className="relative z-[1] min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
