import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ pathname: string[] }> },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { pathname: segments } = await context.params;
  const pathname = segments.join("/");
  const match = /^households\/([^/]+)\/(profiles|tasks)\/[^/]+\.(jpg|png|webp)$/.exec(
    pathname,
  );

  if (!match) {
    return NextResponse.json({ error: "invalid_media_path" }, { status: 400 });
  }

  const household = await prisma.household.findFirst({
    where: {
      id: match[1],
      ownerUserId: session.user.id,
    },
    select: { id: true },
  });

  if (!household) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", result.blob.contentType);
  headers.set("Content-Length", String(result.blob.size));
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("ETag", result.blob.etag);
  headers.set("X-Content-Type-Options", "nosniff");

  if (request.headers.get("if-none-match") === result.blob.etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(result.stream, { status: 200, headers });
}
