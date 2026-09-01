import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchPageClient } from "@/components/SearchPageClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  return (
    <>
      <Header variant="minimal" back />
      <main className="flex-1 mx-auto max-w-190 px-4 pb-16 pt-9 sm:px-10">
        <SearchPageClient />
      </main>
      <Footer />
    </>
  );
}
