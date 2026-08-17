const required = ["GITHUB_REPOSITORY", "EXPECTED_GIT_SHA"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `Missing required production verification variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const attempts = Number(process.env.DEPLOYMENT_VERIFY_ATTEMPTS ?? "30");
const intervalMs = Number(
  process.env.DEPLOYMENT_VERIFY_INTERVAL_MS ?? "10000",
);
const expectedSha = process.env.EXPECTED_GIT_SHA;
const repository = process.env.GITHUB_REPOSITORY;
const githubToken = process.env.GITHUB_TOKEN;

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function githubRequest(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "RoutineKids-production-verifier",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub Deployments API returned ${response.status}.`);
  }
  return response.json();
}

async function getProductionDeployment() {
  const query = new URLSearchParams({ sha: expectedSha, per_page: "100" });
  const deployments = await githubRequest(
    `/repos/${repository}/deployments?${query}`,
  );

  return (
    deployments.find(
      (deployment) =>
        deployment.production_environment === true ||
        deployment.environment?.toLowerCase() === "production",
    ) ?? null
  );
}

async function getLatestDeploymentStatus(deployment) {
  const statuses = await githubRequest(
    `/repos/${repository}/deployments/${deployment.id}/statuses?per_page=1`,
  );
  return statuses[0] ?? null;
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const deployment = await getProductionDeployment();
    const latestStatus = deployment
      ? await getLatestDeploymentStatus(deployment)
      : null;

    if (latestStatus?.state === "success") {
      const deploymentUrl =
        latestStatus.environment_url ??
        latestStatus.target_url ??
        "URL unavailable";
      console.log(
        `Vercel Production is ready at ${deploymentUrl} for commit ${expectedSha}.`,
      );
      process.exit(0);
    }

    console.log(
      `Attempt ${attempt}/${attempts}: Production deployment for ${expectedSha} is ${latestStatus?.state ?? "not available yet"}.`,
    );
  } catch (error) {
    console.warn(
      `Attempt ${attempt}/${attempts}: ${error instanceof Error ? error.message : "GitHub deployment lookup failed."}`,
    );
  }
  if (attempt < attempts) await wait(intervalMs);
}

console.error(
  `Vercel Production did not report a successful deployment for ${expectedSha}.`,
);
process.exit(1);
