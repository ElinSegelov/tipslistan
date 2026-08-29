import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/providers";
import type { ContentType } from "@/lib/categories";

const VALID_TYPES: ContentType[] = ["film", "serie", "bok", "spel", "brädspel"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ContentType | null;
  const q = searchParams.get("q")?.trim();

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Ogiltig eller saknad 'type'." }, { status: 400 });
  }
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await search(type, q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Sökningen misslyckades.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
