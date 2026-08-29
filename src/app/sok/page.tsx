import { BackToLibrary, Header } from "@/components/Header";
import { SearchPageClient } from "@/components/SearchPageClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  return (
    <>
      <Header variant="minimal" />
      <BackToLibrary />
      <main className="mx-auto max-w-190 px-10 pb-16 pt-9">
        <SearchPageClient />
      </main>
    </>
  );
}
