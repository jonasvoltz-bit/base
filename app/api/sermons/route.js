import { NextResponse } from "next/server";
import { getSermonList } from "@/lib/notion";

export async function GET() {
  try {
    const sermons = await getSermonList();
    return NextResponse.json({ sermons });
  } catch (err) {
    console.error("[/api/sermons]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
