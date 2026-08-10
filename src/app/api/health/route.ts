import { NextResponse } from "next/server";

import { startApiRequest } from "@/lib/api-observability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const log = startApiRequest(request, "/api/health");

  try {
    await prisma.$queryRaw`SELECT 1`;
    log.done(200, { database: "reachable" });
    return NextResponse.json(
      {
        status: "ok",
        service: "routinekids-web",
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    log.failed(error, 503, { database: "unreachable" });
    return NextResponse.json(
      { status: "unavailable", service: "routinekids-web" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
