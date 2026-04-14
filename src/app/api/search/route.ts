import { NextRequest, NextResponse } from "next/server";
import { searchPhimAdvanced } from "@/lib/search";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchPhimAdvanced(keyword);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
