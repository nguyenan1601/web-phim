import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://phim.nguonc.com/api";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    const res = await fetch(
      `${API_BASE}/films/search?keyword=${encodeURIComponent(keyword)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ items: data.items || [] });
  } catch {
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
