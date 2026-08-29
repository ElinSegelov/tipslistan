# Marquee

En app för att samla tips du fått på filmer, serier, böcker, spel och brädspel — sök titlar, hämta
data automatiskt från respektive API, och se var filmer/serier går att streama (per land) eller vilka
plattformar/butiker spel och brädspel finns hos.

Byggd med Next.js (App Router) + TypeScript + Tailwind CSS. Databas: [Neon](https://neon.tech)
(serverless Postgres) via [Drizzle ORM](https://orm.drizzle.team). Inloggning: [Auth.js /
NextAuth v5](https://authjs.dev) med Google, GitHub och magisk länk (via [Resend](https://resend.com)).
Varje användare har sitt eget bibliotek — tips är kopplade till det inloggade kontot och syns bara
för dig.

## Kom igång

1. **Installera beroenden**

   ```bash
   npm install
   ```

2. **Skapa ett Neon-projekt** på [neon.tech](https://neon.tech) (gratis nivå räcker gott). Kopiera
   den poolade anslutningssträngen ("Pooled connection") från *Connection Details*.

3. **Skapa OAuth-appar för Google och GitHub** (behövs för inloggning):
   - **Google**: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services →
     Credentials → *Create credentials* → *OAuth client ID* → Web application. Lägg till
     `http://localhost:3000/api/auth/callback/google` som redirect-URI (och din produktions-URL när
     du deployar).
   - **GitHub**: [github.com/settings/developers](https://github.com/settings/developers) → *New
     OAuth App*. Callback URL: `http://localhost:3000/api/auth/callback/github`.

4. **Skaffa en Resend-nyckel** för inloggning via magisk länk på
   [resend.com](https://resend.com) → API Keys (gratis: 3 000 mejl/månad, inget kort krävs). I
   sandboxläge kan du skicka från `onboarding@resend.dev` utan att verifiera egen domän.

5. **Skaffa API-nycklar för innehållskällorna** (alla gratis):
   - [TMDB](https://www.themoviedb.org/settings/api) — för film & serie (sök, detaljer,
     streamingtillgänglighet per land).
   - [RAWG](https://rawg.io/apidocs) — för spel (sök, detaljer, plattformar).
   - Google Books kräver ingen nyckel för att komma igång, men du kan lägga till en om du märker att du
     når kvotgränsen.
   - BoardGameGeeks XML API2 kräver ingen nyckel alls.

6. **Kopiera miljövariabler**

   ```bash
   cp .env.example .env.local
   ```

   och fyll i `DATABASE_URL`, en genererad `AUTH_SECRET` (`npx auth secret` eller
   `openssl rand -base64 33`), OAuth-uppgifterna, Resend-nyckeln samt API-nycklarna ovan.

7. **Kör databasmigrationen** — skapar `users`/`accounts`/`sessions`/`verificationTokens`-tabellerna
   (som Auth.js behöver) och `tips`-tabellen:

   ```bash
   npx drizzle-kit migrate
   ```

8. **Kör appen**

   ```bash
   npm run dev
   ```

   Öppna [http://localhost:3000](http://localhost:3000).

## Hur datan hämtas

| Typ | Källa | Anteckning |
|---|---|---|
| Film / Serie | [TMDB](https://www.themoviedb.org/) | Sök, detaljer och streamingleverantörer (byggt på JustWatch-data) — filtreras på valt land i detaljvyn. Om titeln inte finns tillgänglig i det valda landet visas en tydlig markering istället för att sektionen bara är tom. |
| Bok | [Google Books](https://developers.google.com/books) med fallback till [Open Library](https://openlibrary.org) | Det finns ingen gratis, tillförlitlig "finns i lager"-api för svenska bokhandlar, så "Läs eller köp" länkar istället vidare till en sökning hos Bokus, Adlibris, Storytel och Libris. |
| Spel | [RAWG](https://rawg.io/apidocs) | Sök, detaljer och vilka plattformar spelet finns till. |
| Brädspel | [BoardGameGeeks XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2) | BGG har **ingen** officiell JSON-api trots att det efterfrågats länge — bara den här XML-apin. Vi anropar den direkt från en egen serverrutt (`src/lib/providers/bgg.ts`) och parsar XML till JSON själva med `fast-xml-parser`, istället för att förlita oss på en tredjeparts hostade proxy. Ger antal spelare, speltid, komplexitet, kategori och länk till BGG-sidan, plus sök-länkar till ett par svenska brädspelsbutiker. |

Tillgänglighet (streaming/plattformar/butiker) hämtas live vid varje sidvisning istället för att sparas
i databasen, eftersom den ändras över tid och (för film/serie) beror på vilket land du väljer.

Ditt valda streamingland sparas i webbläsarens `localStorage` (inget konto behövs för det).

## Inloggning & konton

Appen kräver inloggning — du kan logga in med Google, GitHub eller en magisk länk skickad via mejl
(ingen lösenordshantering). Varje konto har sitt eget bibliotek: tips du lägger till är alltid
kopplade till ditt användar-id, och du kan bara se och redigera dina egna tips. Sessioner och
kontokopplingar hanteras av Auth.js och lagras i samma Neon-databas som tipsen.

## Attribution

TMDB kräver attribution för att du använder deras data ("This product uses the TMDb API but is not
endorsed or certified by TMDb"). Lägg till det synligt i footern innan du visar appen för andra än dig
själv.

## Struktur

```
src/
  app/
    page.tsx              Hem — inloggad användares sparade tips, filter på typ
    login/page.tsx         Inloggning (Google, GitHub, magisk länk)
    login/kolla-mejlen/    Bekräftelsesida efter magisk länk
    sok/page.tsx           Sök & lägg till (server-wrapper + SearchPageClient)
    titel/[id]/page.tsx    Detaljvy
    api/
      auth/[...nextauth]/route.ts  Auth.js route handler
      search/route.ts      Sök mot rätt källa beroende på typ
      details/route.ts     Fulla detaljer för en träff
      availability/route.ts Streaming/plattformar/butiker, landsmedveten för film & serie
  auth.ts                   Auth.js-konfiguration (providers, adapter, e-postutskick)
  middleware.ts             Skyddar alla sidor utom /login och /api/auth
  lib/
    categories.ts           Kategorimetadata (färger, etiketter, källa) — inkl. brädspel
    providers/               TMDB, Google Books, Open Library, RAWG, BGG
    db/schema.ts             Drizzle-schema (users/accounts/sessions/verificationTokens + tips)
    db/index.ts               Drizzle-klient mot Neon
    actions/tips.ts           Server actions för att lägga till/uppdatera tips (scopade till inloggad användare)
  components/                Delad UI
drizzle/                     Genererade SQL-migrationer (drizzle-kit generate)
drizzle.config.ts
```
