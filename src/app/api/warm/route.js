import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Wakes the database (Neon pauses an idle free compute after 5 minutes) and doubles as a
// health check. The site pings it quietly on first load, so the database is already awake
// by the time a visitor logs in or opens a page that needs fresh data.
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
