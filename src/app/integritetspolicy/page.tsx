import Link from "next/link";
import { Footer } from "@/components/Footer";
import { LogoMark } from "@/components/icons";

export const metadata = {
  title: "Integritetspolicy för Tipslistan",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <main className="flex-1 min-w-0 w-full mx-auto max-w-160 px-4 pb-16 pt-14 sm:px-10">
        <Link href="/" className="mb-10 flex items-center gap-3">
          <LogoMark />
          <span className="serif italic text-[22px] tracking-wide">Tipslistan</span>
        </Link>

        <h1 className="serif mb-2 text-[34px] italic leading-[1.1]">Integritetspolicy</h1>
        <p className="mb-10 text-[13px] text-text-faint">Senast uppdaterad 30 augusti 2026.</p>

        <div className="flex flex-col gap-8 text-[14.5px] leading-relaxed text-text-muted">
          <p>
            Tipslistan är ett litet, personligt drivet projekt, inte ett företag. Den här sidan
            beskriver i klartext vilka uppgifter tjänsten samlar in, varför, och vilka rättigheter du
            har. Den är skriven för att vara begriplig snarare än juridiskt heltäckande; hör av dig om
            något är oklart.
          </p>

          <Section title="Vem som är ansvarig för dina uppgifter">
            <p>
              Ansvarig för dina uppgifter är Tipslistan. Frågor om dina uppgifter går till{" "}
              <a href="mailto:tipslistan-support@googlegroups.com">tipslistan-support@googlegroups.com</a>.
            </p>
          </Section>

          <Section title="Vilka uppgifter vi samlar in">
            <p>Det handlar om tre kategorier:</p>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li>
                <strong className="text-text">Kontouppgifter.</strong> Loggar du in med Google får vi
                ditt namn, din e-postadress och din profilbild från Google. Loggar du in med magisk
                länk (skickad via Resend) sparar vi bara e-postadressen du anger.
              </li>
              <li>
                <strong className="text-text">Innehåll du själv lägger till.</strong> Titlar, typ
                (film/serie/bok/spel/brädspel), år, betyg, genre, beskrivning, vem som tipsade dig,
                din anteckning och din recension, samt om du markerat något som sett/läst/spelat.
              </li>
              <li>
                <strong className="text-text">Tekniska uppgifter.</strong> En sessionscookie som håller
                dig inloggad (hanteras av Auth.js). Vilket land du valt för streaming-tillgänglighet
                sparas bara i din egen webbläsare (<code>localStorage</code>) och skickas aldrig till
                oss.
              </li>
            </ul>
          </Section>

          <Section title="Varför vi samlar in det (rättslig grund)">
            <p>
              Uppgifterna används uteslutande för att tillhandahålla tjänsten du bett om: visa upp
              ditt bibliotek, hålla dig inloggad, och koppla dina tips till ditt konto så att bara du
              ser dem. Den rättsliga grunden är fullgörande av avtal. Vi ger dig den tjänst du valt
              att använda, och för själva inloggningen är grunden ditt samtycke genom att logga in.
            </p>
          </Section>

          <Section title="Vilka vi delar uppgifter med">
            <p>Tipslistan delar inte dina uppgifter i marknadsföringssyfte. Följande tredje parter är
              inblandade i att driva tjänsten:</p>
            <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
              <li><strong className="text-text">Google</strong>, om du väljer att logga in med Google.</li>
              <li><strong className="text-text">Resend</strong>, skickar inloggningslänken om du loggar in via mail.</li>
              <li><strong className="text-text">Neon</strong>, databashosting. All data i tjänsten (konton, sessioner, tips) lagras hos dem.</li>
              <li><strong className="text-text">Vercel</strong>, driftar själva webbappen.</li>
              <li>
                <strong className="text-text">TMDB, Google Books, Open Library, RAWG och BoardGameGeek.</strong>{" "}
                När du söker efter en titel skickas din sökterm till respektive tjänst för att hämta
                omslag, beskrivning och betyg. Inga konto- eller personuppgifter skickas till dessa
                tjänster.
              </li>
            </ul>
          </Section>

          <Section title="Hur länge vi sparar uppgifterna">
            <p>
              Så länge ditt konto finns kvar. Vill du att kontot och alla dina tips ska raderas, maila{" "}
              <a href="mailto:tipslistan-support@googlegroups.com">tipslistan-support@googlegroups.com</a>{" "}
              så tar vi bort allt kopplat till dig.
            </p>
          </Section>

          <Section title="Dina rättigheter">
            <p>
              Enligt GDPR har du rätt att få tillgång till, rätta eller radera dina uppgifter, samt
              rätt till dataportabilitet och att invända mot behandlingen. Kontakta oss så hjälper vi
              dig. Du har också rätt att klaga hos{" "}
              <a href="https://www.imy.se/" target="_blank" rel="noreferrer">Integritetsskyddsmyndigheten (IMY)</a>.
            </p>
          </Section>

          <Section title="Ändringar av den här policyn">
            <p>
              Ändras något väsentligt i hur Tipslistan hanterar dina uppgifter uppdateras den här
              sidan och datumet högst upp.
            </p>
          </Section>

          <Section title="Kontakt">
            <p>
              <a href="mailto:tipslistan-support@googlegroups.com">tipslistan-support@googlegroups.com</a>
            </p>
          </Section>

          <p className="text-[12.5px] text-text-faint">
            Den här sidan är skriven för att vara tydlig och rättvisande för hur Tipslistan faktiskt
            fungerar, men är inte juridisk rådgivning. Se{" "}
            <Link href="/anvandarvillkor">användarvillkoren</Link> för villkoren för att använda
            tjänsten.
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
