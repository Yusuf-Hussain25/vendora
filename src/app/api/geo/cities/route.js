import { NextResponse } from "next/server";
import { getCities } from "@/lib/geo-india";

export async function GET(request) {
  const state = request.nextUrl.searchParams.get("state") || "";
  return NextResponse.json({ cities: await getCities(state) }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
