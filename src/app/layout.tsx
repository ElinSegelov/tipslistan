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

const description =
  "Dina tips på filmer, serier, böcker, videospel och brädspel, samlade på ett ställe.";

export const metadata: Metadata = {
  // Krävs för att dela-bilden (opengraph-image.png) och Open Graph/Twitter-
  // taggarna ska bli fullständiga URL:er. Byt till din egen domän här den
  // dag Tipslistan flyttar dit.
  metadataBase: new URL("https://tipslistan.vercel.app"),
  title: "Tipslistan",
  description,
  openGraph: {
    title: "Tipslistan",
    description,
    siteName: "Tipslistan",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tipslistan",
    description,
  },
  // Chrome/Android's install prompt gets its icon from manifest.ts
  // (src/app/manifest.ts); iOS ignores that file, so its "Add to Home
  // Screen" icon and standalone behavior come from these apple-* fields
  // instead, both point at the same list-icon artwork as the favicon.
  // Delningsbilden (opengraph-image.png/twitter-image.png i src/app/)
  // plockas upp automatiskt av Next.js utan att behövas nämnas här.
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Tipslistan",
    statusBarStyle: "black-translucent",
    // iOS doesn't read manifest.ts for its home-screen splash screen (that's
    // the Android/Chrome path) — it needs an exact pixel-perfect image per
    // device size/orientation/pixel-ratio via these link tags instead, or
    // it just shows a blank flash while the app loads. Covers every iPhone
    // from the SE/8 generation through 16 Pro Max, plus common iPads, in
    // portrait (landscape omitted — home-screen launches are portrait in
    // practice). Generated from public/icon-512.png centered on the app's
    // background color; regenerate if that icon or --bg ever changes.
    startupImage: [
      { url: "/splash/apple-splash-320x568-2x.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-375x667-2x.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-414x736-3x.png", media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-375x812-3x.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-414x896-2x.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-414x896-3x.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-390x844-3x.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-428x926-3x.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-393x852-3x.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-430x932-3x.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-402x874-3x.png", media: "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-440x956-3x.png", media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash/apple-splash-768x1024-2x.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-820x1180-2x.png", media: "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-834x1194-2x.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash/apple-splash-1024x1366-2x.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
    ],
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
        <div className="relative z-1 flex min-h-dvh flex-col">{children}</div>
      </body>
    </html>
  );
}
