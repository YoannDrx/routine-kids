import "server-only";

type LogDetails = Record<string, boolean | number | string | null | undefined>;

function writeLog(
  level: "error" | "info" | "warn",
  details: Record<string, unknown>,
) {
  const payload = JSON.stringify({
    level,
    service: "routinekids-web",
    timestamp: new Date().toISOString(),
    ...details,
  });

  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

export function startApiRequest(request: Request, route: string) {
  const startedAt = Date.now();
  const requestId =
    request.headers.get("x-vercel-id") ??
    request.headers.get("x-request-id") ??
    crypto.randomUUID();

  writeLog("info", { event: "api.start", requestId, route });

  return {
    done(status: number, details: LogDetails = {}) {
      writeLog(status >= 500 ? "error" : status >= 400 ? "warn" : "info", {
        event: "api.done",
        requestId,
        route,
        status,
        durationMs: Date.now() - startedAt,
        ...details,
      });
    },
    failed(error: unknown, status = 500, details: LogDetails = {}) {
      writeLog("error", {
        event: "api.failed",
        requestId,
        route,
        status,
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : "UnknownError",
        ...details,
      });
    },
  };
}
