import { NextResponse } from "next/server";

import { startApiRequest } from "@/lib/api-observability";
import { getMissingCommercialProductionEnv } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const log = startApiRequest(request, "/api/health");
  const missingConfiguration = getMissingCommercialProductionEnv();

  if (missingConfiguration.length > 0) {
    log.done(503, {
      configuration: "incomplete",
      missingConfiguration: missingConfiguration.join(","),
    });
    return NextResponse.json(
      { status: "unavailable", service: "routinekids-web" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

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
