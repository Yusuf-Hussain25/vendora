import { NextResponse } from "next/server";
import { isPinCode } from "@/lib/india";
import { lookupPinCode } from "@/lib/geo-india";

export async function GET(_request, { params }) {
  const { pin } = await params;
  if (!isPinCode(pin)) return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
  const result = await lookupPinCode(pin);
  if (!result) return NextResponse.json({ error: "We couldn't find that PIN code." }, { status: 404 });
  return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=86400" } });
}
