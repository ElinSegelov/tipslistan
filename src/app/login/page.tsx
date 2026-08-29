import { signIn } from "@/auth";
import { LogoMark } from "@/components/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const redirectTo = from && from.startsWith("/") ? from : "/";

  return (
    <main className="mx-auto flex min-h-dvh max-w-105 flex-col justify-center px-8 py-16">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <LogoMark size={34} />
          <div className="serif text-[30px] italic">Tipslistan</div>
        </div>
        <p className="text-sm text-text-muted">Logga in för att se ditt bibliotek av tips.</p>
      </div>

      <div className="flex flex-col gap-3">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-xl border border-border bg-bg-elevated py-3 text-sm font-semibold text-text"
          >
            Fortsätt med Google
          </button>
        </form>

        <div className="my-2 flex items-center gap-3 text-xs text-text-faint">
          <div className="h-px flex-1 bg-border" />
          eller
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", formData, { redirectTo });
          }}
          className="flex flex-col gap-2.5"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="din@mejl.se"
            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none placeholder:text-text-faint"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-ink"
          >
            Skicka inloggningslänk
          </button>
        </form>
      </div>
    </main>
  );
}
