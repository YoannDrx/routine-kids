const required = [
  "VERCEL_TOKEN",
  "VERCEL_PROJECT_ID",
  "VERCEL_TEAM_ID",
  "EXPECTED_GIT_SHA",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required Vercel verification variables: ${missing.join(", ")}`);
  process.exit(1);
}

const attempts = Number(process.env.VERCEL_VERIFY_ATTEMPTS ?? "30");
const intervalMs = Number(process.env.VERCEL_VERIFY_INTERVAL_MS ?? "10000");
const expectedSha = process.env.EXPECTED_GIT_SHA;

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function getLatestProductionDeployment() {
  const url = new URL("https://api.vercel.com/v13/deployments");
  url.searchParams.set("projectId", process.env.VERCEL_PROJECT_ID);
  url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  url.searchParams.set("target", "production");
  url.searchParams.set("state", "READY");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`Vercel API returned ${response.status}.`);
  }
  const payload = await response.json();
  return payload.deployments?.[0] ?? null;
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const deployment = await getLatestProductionDeployment();
  const deployedSha = deployment?.meta?.githubCommitSha ?? null;

  if (deployedSha === expectedSha) {
    console.log(
      `Vercel Production is READY on ${deployment.url} for commit ${expectedSha}.`,
    );
    process.exit(0);
  }

  console.log(
    `Attempt ${attempt}/${attempts}: expected ${expectedSha}, latest READY is ${deployedSha ?? "unknown"}.`,
  );
  if (attempt < attempts) await wait(intervalMs);
}

console.error(`Vercel Production did not reach expected commit ${expectedSha}.`);
process.exit(1);
