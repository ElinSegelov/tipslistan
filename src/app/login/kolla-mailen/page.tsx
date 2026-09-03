import { LogoMark } from "@/components/icons";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-105 flex-col items-center justify-center px-8 py-16 gap-2 text-center">
      <div className="flex justify-center items-center gap-3">
        <LogoMark size={34} />
        <div className="serif text-[28px] italic">Kolla din mail</div>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        Vi har skickat en inloggningslänk till din mailadress. Länken är giltig i 24 timmar.
      </p>
      <p className="mt-3 text-sm text-text-muted">
        Hittar du inte mailet? Kolla skräpposten eller försök igen.
      </p>
    </main>
  );
}
