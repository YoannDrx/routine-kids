import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const snapshotDirectory = resolve(process.cwd(), ".routinekids-snapshots");
const premiumPlans = ["FAMILY", "FAMILY_PLUS"];

try {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { id: "asc" },
  });
  const invalidPremiumSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.provider === "NONE" &&
      premiumPlans.includes(subscription.plan),
  );

  const summary = {
    scanned: subscriptions.length,
    invalidPremium: invalidPremiumSubscriptions.length,
    apply,
  };

  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    console.log("Dry run only. Re-run with --apply to snapshot and downgrade.");
    process.exitCode = invalidPremiumSubscriptions.length > 0 ? 2 : 0;
  } else if (invalidPremiumSubscriptions.length === 0) {
    console.log(JSON.stringify(summary, null, 2));
    console.log("No provider-less premium subscription requires reconciliation.");
  } else {
    await mkdir(snapshotDirectory, { recursive: true });
    const timestamp = new Date().toISOString().replaceAll(":", "-");
    const snapshotPath = resolve(
      snapshotDirectory,
      `subscriptions-before-reconciliation-${timestamp}.json`,
    );
    await writeFile(
      snapshotPath,
      `${JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          reason: "Downgrade premium subscriptions without a Stripe or Apple provider proof",
          subscriptions,
        },
        null,
        2,
      )}\n`,
      { encoding: "utf8", flag: "wx", mode: 0o600 },
    );

    const result = await prisma.subscription.updateMany({
      where: {
        provider: "NONE",
        plan: { in: premiumPlans },
      },
      data: {
        plan: "FREE",
        status: "ACTIVE",
        periodStart: null,
        periodEnd: null,
        cancelAtPeriodEnd: false,
        gracePeriodEndsAt: null,
        revokedAt: null,
      },
    });

    console.log(
      JSON.stringify(
        {
          ...summary,
          downgraded: result.count,
          snapshotPath,
        },
        null,
        2,
      ),
    );
  }
} finally {
  await prisma.$disconnect();
}
