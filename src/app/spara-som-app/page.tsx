import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SaveAsAppPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header variant="minimal" back />
      <main className="flex-1 mx-auto max-w-2xl px-4 pb-16 pt-9 sm:px-10">
        <h1 className="serif mb-3 text-[36px] italic leading-[1.05]">Spara som app</h1>
        <p className="mb-8 max-w-140 text-sm leading-relaxed text-text-muted">
          Lägg till Tipslistan på hemskärmen så öppnas den som en egen app — utan adressfält eller
          bläddrarknappar, med en egen ikon och en snabb startbild.
        </p>

        <section className="mb-6 rounded-2xl border border-border bg-bg-card p-5.5">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">
            iPhone/iPad (Safari)
          </div>
          <ol className="flex flex-col gap-2.5 text-sm leading-relaxed text-text-muted">
            <li>1. Öppna tipslistan.vercel.app i Safari.</li>
            <li>2. Tryck på dela-ikonen (rutan med pilen uppåt) i menyraden.</li>
            <li>3. Skrolla ner i listan och välj &quot;Lägg till på hemskärmen&quot;.</li>
            <li>4. Tryck &quot;Lägg till&quot; uppe till höger.</li>
          </ol>
          <p className="mt-4 text-[12.5px] leading-relaxed text-text-faint">
            Det här går bara i Safari. Chrome, Firefox och andra webbläsare på iPhone kan öppna
            sidan precis som vanligt, men bara Safari kan lägga till den som en riktig app på
            hemskärmen.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-bg-card p-5.5">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-text-muted">
            Android (Chrome)
          </div>
          <ol className="flex flex-col gap-2.5 text-sm leading-relaxed text-text-muted">
            <li>1. Öppna tipslistan.vercel.app i Chrome.</li>
            <li>2. Tryck på de tre prickarna uppe till höger.</li>
            <li>3. Välj &quot;Lägg till på startskärmen&quot; eller &quot;Installera app&quot;.</li>
            <li>4. Bekräfta.</li>
          </ol>
          <p className="mt-4 text-[12.5px] leading-relaxed text-text-faint">
            De flesta Android-webbläsarna stödjer det här.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
