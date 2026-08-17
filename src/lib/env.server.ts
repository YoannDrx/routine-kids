import "server-only";

export function ensureServerEnv() {
  // Next.js loads .env files locally and Vercel injects environment variables
  // at build/runtime. Reading .env.local explicitly makes the deployment file
  // tracer expect a secret, untracked file inside the server artifact.
}

export function getRequiredProductionSecret(name: "BETTER_AUTH_SECRET") {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production.`);
  }

  return "routine-kids-local-development-only";
}
