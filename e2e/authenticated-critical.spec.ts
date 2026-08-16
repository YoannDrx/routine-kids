import { expect, test, type Page } from "@playwright/test";

test.skip(
  process.env.E2E_AUTHENTICATED !== "true",
  "Authenticated tests require an isolated disposable database.",
);

const password = "RoutineKids-e2e-password-2026";

async function signUpAndUnlock(page: Page, suffix: string) {
  const email = `routinekids-e2e-${suffix}@example.test`;
  await page.goto("/sign-up?callbackUrl=/settings");
  await page.getByRole("textbox", { name: /Pr[eé]nom parent/i }).fill(`Parent ${suffix}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: /Cr[eé]er le compte parent/i }).click();

  await expect(page).toHaveURL((url) => url.pathname === "/settings");
  await page.locator("#parent-gate-credential").fill(password);
  const verificationResponse = page.waitForResponse(
    (response) => Boolean(response.request().headers()["next-action"]),
  );
  await page.getByRole("button", { name: /Valider|V[eé]rifier/i }).click();
  await verificationResponse;
  await expect(page.getByRole("dialog", { name: "RoutineKids" })).toBeHidden({
    timeout: 10_000,
  });
  await expect(page.getByRole("dialog", { name: /Param[eè]tres/i })).toBeVisible();
  return email;
}

test("a new parent can onboard and a second household cannot mutate that profile", async ({
  page,
  browser,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`.replaceAll(/[^a-z0-9-]/gi, "-");
  await signUpAndUnlock(page, `${suffix}-owner`);

  const created = await page.evaluate(async () => {
    const response = await fetch("/api/v1/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Luna E2E",
        age: 5,
        avatar: "👩‍🚀",
        headline: "Prête pour la mission",
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(created.status).toBe(201);
  const profileId = created.body.profile.id as string;

  await page.goto("/");
  await expect(page.getByText("Luna E2E", { exact: true })).toBeVisible();
  const routinePeriods = await page.evaluate(async () => {
    const response = await fetch("/api/v1/household");
    const payload = await response.json();
    return payload.household.childProfiles[0].routines.map(
      (routine: { period: string }) => routine.period,
    );
  });
  expect(routinePeriods).toEqual(expect.arrayContaining(["MORNING", "EVENING"]));

  const foreignContext = await browser.newContext();
  const foreignPage = await foreignContext.newPage();
  await signUpAndUnlock(foreignPage, `${suffix}-foreign`);
  const foreignDeletionStatus = await foreignPage.evaluate(async (targetProfileId) => {
    const response = await fetch(`/api/v1/profiles/${targetProfileId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return response.status;
  }, profileId);
  expect(foreignDeletionStatus).toBe(404);
  await foreignContext.close();

  await page.reload();
  await expect(page.getByText("Luna E2E", { exact: true })).toBeVisible();
});
