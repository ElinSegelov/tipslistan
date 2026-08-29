import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/providers";
import type { ContentType } from "@/lib/categories";
import { DEFAULT_COUNTRY } from "@/lib/countries";

const VALID_TYPES: ContentType[] = ["film", "serie", "bok", "spel", "brädspel"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ContentType | null;
  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const title = searchParams.get("title") ?? "";
  const country = searchParams.get("country") || DEFAULT_COUNTRY;

  if (!type || !VALID_TYPES.includes(type) || !source || !id) {
    return NextResponse.json({ error: "type, source och id krävs." }, { status: 400 });
  }

  try {
    const result = await getAvailability(type, source, id, country, title);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Kunde inte hämta tillgänglighet.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
