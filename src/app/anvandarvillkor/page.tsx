import Link from "next/link";
import { Footer } from "@/components/Footer";
import { LogoMark } from "@/components/icons";

export const metadata = {
  title: "Användarvillkor för Tipslistan",
};

export default function TermsPage() {
  return (
    <>
      <main className="mx-auto max-w-160 px-4 pb-16 pt-14 sm:px-10">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <LogoMark />
          <span className="serif italic text-[22px] tracking-wide">Tipslistan</span>
        </Link>

        <h1 className="serif mb-2 text-[34px] italic leading-[1.1]">Användarvillkor</h1>
        <p className="mb-10 text-[13px] text-text-faint">Senast uppdaterad 30 augusti 2026.</p>

        <div className="flex flex-col gap-8 text-[14.5px] leading-relaxed text-text-muted">
          <p>
            Genom att skapa ett konto och använda Tipslistan godkänner du de här villkoren. De är
            skrivna för att vara raka och begripliga. Det här är ett litet, personligt projekt, inte
            en kommersiell tjänst.
          </p>

          <Section title="Om tjänsten">
            <p>
              Tipslistan låter dig spara tips du fått på filmer, serier, böcker, spel och brädspel,
              och hämtar automatiskt omslag, beskrivning och betyg från tredjepartskällor (TMDB,
              Google Books, Open Library, RAWG och BoardGameGeek). Tjänsten är gratis att använda.
            </p>
          </Section>

          <Section title="Ditt konto">
            <p>
              Du loggar in med Google eller en magisk länk skickad till din mejladress. Du ansvarar
              för att hålla din inloggning säker. Varje konto har sitt eget bibliotek. Du kan bara
              se och redigera dina egna tips.
            </p>
          </Section>

          <Section title="Innehåll du lägger till">
            <p>
              Du ansvarar för det du själv skriver in, till exempel titlar, anteckningar och
              recensioner. Lägg inte in olagligt eller kränkande innehåll. Vi förbehåller oss rätten
              att ta bort konton som missbrukar tjänsten.
            </p>
          </Section>

          <Section title="Data från tredje part">
            <p>
              Omslag, beskrivningar, betyg och tillgänglighetsinformation (streaming/plattformar/butiker)
              hämtas från TMDB, Google Books, Open Library, RAWG och BoardGameGeek. Vi ansvarar inte
              för att den datan är korrekt eller aktuell. Kontrollera alltid mot källan vid tvekan.
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </Section>

          <Section title="Inga garantier">
            <p>
              Tipslistan tillhandahålls i befintligt skick, utan garantier om ständig drift eller
              felfri funktion. Tjänsten drivs av en enskild person på fritiden, och vi kan inte lova
              en viss upptid eller support-svarstid. Vi ansvarar inte för eventuell förlust av data,
              även om vi gör vårt bästa för att undvika det.
            </p>
          </Section>

          <Section title="Ändringar av tjänsten och villkoren">
            <p>
              Tipslistan kan komma att ändras, pausas eller läggas ner. Väsentliga ändringar av de här
              villkoren publiceras här med ett uppdaterat datum. Fortsätter du använda tjänsten efter
              en ändring innebär det att du godkänner de nya villkoren.
            </p>
          </Section>

          <Section title="Uppsägning">
            <p>
              Du kan när som helst sluta använda tjänsten och be om att ditt konto och all din data
              raderas. Se{" "}
              <Link href="/integritetspolicy">integritetspolicyn</Link> för kontaktuppgifter.
            </p>
          </Section>

          <Section title="Tillämplig lag">
            <p>Svensk lag tillämpas på de här villkoren.</p>
          </Section>

          <Section title="Kontakt">
            <p>
              <a href="mailto:tipslistan-support@googlegroups.com">tipslistan-support@googlegroups.com</a>
            </p>
          </Section>

          <p className="text-[12.5px] text-text-faint">
            Den här texten är skriven för att rimligt och tydligt beskriva villkoren för Tipslistan,
            men är inte juridisk rådgivning.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-text">{title}</h2>
      {children}
    </section>
  );
}
