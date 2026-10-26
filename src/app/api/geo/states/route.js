import { NextResponse } from "next/server";
import { getStates } from "@/lib/geo-india";

export async function GET() {
  return NextResponse.json(await getStates(), { headers: { "Cache-Control": "public, max-age=86400" } });
}
