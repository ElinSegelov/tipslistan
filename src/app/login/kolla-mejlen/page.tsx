import { LogoMark } from "@/components/icons";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center px-8 py-16 text-center">
      <LogoMark size={34} />
      <div className="serif mt-3 text-[28px] italic">Kolla din mejl</div>
      <p className="mt-3 text-sm text-text-muted">
        Vi har skickat en inloggningslänk till din mejladress. Länken är giltig i 24 timmar.
      </p>
    </main>
  );
}
