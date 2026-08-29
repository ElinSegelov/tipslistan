import { Header } from "@/components/Header";
import { SearchPageClient } from "@/components/SearchPageClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  return (
    <main className="mx-auto max-w-[760px] px-10 pb-16 pt-9">
      <Header variant="minimal" />
      <SearchPageClient />
    </main>
  );
}
