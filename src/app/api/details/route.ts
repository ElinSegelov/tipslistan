import { NextRequest, NextResponse } from "next/server";
import { getDetails } from "@/lib/providers";
import type { ContentType } from "@/lib/categories";

const VALID_TYPES: ContentType[] = ["film", "serie", "bok", "spel", "brädspel"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ContentType | null;
  const source = searchParams.get("source");
  const id = searchParams.get("id");

  if (!type || !VALID_TYPES.includes(type) || !source || !id) {
    return NextResponse.json({ error: "type, source och id krävs." }, { status: 400 });
  }

  try {
    const result = await getDetails(type, source, id);
    return NextResponse.json({ result });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Kunde inte hämta detaljer.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
