import "server-only";

export function ensureServerEnv() {
  // Next.js loads .env files locally and Vercel injects environment variables
  // at build/runtime. Reading .env.local explicitly makes the deployment file
  // tracer expect a secret, untracked file inside the server artifact.
}
