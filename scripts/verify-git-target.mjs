import { execFileSync } from "node:child_process";

const expectedRepository = "YoannDrx/routine-kids";

function getGitHubRepository(remoteUrl) {
  const match = remoteUrl.match(
    /^(?:git@github\.com:|https:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([^/]+\/[^/]+?)(?:\.git)?$/,
  );

  return match?.[1] ?? null;
}

function runGit(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(message) {
  console.error(`RoutineKids Git target check failed: ${message}`);
  process.exit(1);
}

const remotes = runGit("remote").split("\n").filter(Boolean);

if (remotes.length !== 1 || remotes[0] !== "origin") {
  fail(`expected only the origin remote, received: ${remotes.join(", ") || "none"}`);
}

const fetchUrl = runGit("remote", "get-url", "origin");
const pushUrl = runGit("remote", "get-url", "--push", "origin");

if (
  getGitHubRepository(fetchUrl) !== expectedRepository ||
  getGitHubRepository(pushUrl) !== expectedRepository
) {
  fail(
    `origin must fetch and push only to ${expectedRepository} over GitHub SSH or HTTPS`,
  );
}

if (
  process.env.GITHUB_REPOSITORY &&
  process.env.GITHUB_REPOSITORY !== expectedRepository
) {
  fail(`GitHub Actions repository must be ${expectedRepository}`);
}

console.log(`Git target verified: ${expectedRepository}`);
