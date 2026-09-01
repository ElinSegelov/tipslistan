import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, email } = session.user;

  return (
    <>
      <Header variant="minimal" back />
      <main className="flex-1 mx-auto max-w-2xl px-4 pb-16 pt-9 sm:px-10">
        <h1 className="serif mb-6 text-[36px] italic leading-[1.05]">Inställningar</h1>

        <section className="mb-8 rounded-2xl border border-border bg-bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-text-muted">Inloggad som</div>
          <div className="mt-1.5 text-sm text-text">{name ?? email ?? "Okänd användare"}</div>
          {email && name ? <div className="text-[13px] text-text-muted">{email}</div> : null}
        </section>

        <DeleteAccountSection />
      </main>
      <Footer />
    </>
  );
}
