import type { MetadataRoute } from "next";

// Powers the "Add to Home Screen"/"Install app" prompt in Chrome/Android
// (and desktop PWA installs). Next.js auto-serves this at
// /manifest.webmanifest and links it from <head> — no manual wiring needed.
// iOS doesn't read this file; its home-screen icon/behavior comes from the
// apple-* metadata in src/app/layout.tsx instead.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tipslistan",
    short_name: "Tipslistan",
    description: "Dina tips på filmer, serier, böcker, videospel och brädspel — samlade på ett ställe.",
    start_url: "/",
    display: "standalone",
    background_color: "#11161f",
    theme_color: "#11161f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
