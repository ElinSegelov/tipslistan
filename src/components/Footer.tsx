import Link from "next/link";

// Required/recommended attribution for the free APIs the app's providers
// (src/lib/providers/*) pull data and images from. Rendered on every page
// (see src/app/**/page.tsx) so it covers RAWG's "every page the data is
// used on" requirement too. The TMDB sentence is their mandated exact
// wording — don't translate or reword it.
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-[11.5px] leading-relaxed text-text-faint sm:px-10">
        <p>
          Data och bilder hämtas från{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB
          </a>
          ,{" "}
          <a href="https://books.google.com/" target="_blank" rel="noreferrer">
            Google Books
          </a>
          ,{" "}
          <a href="https://openlibrary.org/" target="_blank" rel="noreferrer">
            Open Library
          </a>
          ,{" "}
          <a href="https://rawg.io/" target="_blank" rel="noreferrer">
            RAWG
          </a>{" "}
          och{" "}
          <a href="https://boardgamegeek.com/" target="_blank" rel="noreferrer">
            BoardGameGeek
          </a>
          .
        </p>
        <p className="mt-1.5">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Speldata från RAWG
          Video Games Database. Brädspelsdata från BoardGameGeek.
        </p>
        <p className="mt-3">
          <Link href="/integritetspolicy">Integritetspolicy</Link>
          {" · "}
          <Link href="/anvandarvillkor">Användarvillkor</Link>
        </p>
      </div>
    </footer>
  );
}
