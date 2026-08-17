import { NextResponse } from "next/server";

import { createRoutineKidsAccountExport } from "@/lib/account-data";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const accountExport = await createRoutineKidsAccountExport(session.user.id);

  if (!accountExport) {
    return NextResponse.json({ error: "household_not_found" }, { status: 404 });
  }

  const day = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(accountExport, null, 2), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="routinekids-export-${day}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
