import { expect, test, type Page } from "@playwright/test";
import Stripe from "stripe";

test.skip(
  process.env.E2E_AUTHENTICATED !== "true",
  "Authenticated tests require an isolated disposable database.",
);

test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "ipad-landscape",
    "Authenticated business flows run once; public and visual checks cover both viewports.",
  );
});

const password = "RoutineKids-e2e-password-2026";
const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const stripeWebhookSecret = "whsec_routinekids_ci_webhook_secret";
const stripeMonthlyPrice = "price_routinekids_ci_monthly";

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

async function signUpViaApiAndUnlock(page: Page, suffix: string) {
  const email = `routinekids-e2e-${suffix}@example.test`;
  await page.goto("/sign-up");
  const signUpStatus = await page.evaluate(async ({ email: accountEmail, password: accountPassword, suffix: accountSuffix }) => {
    const response = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Parent ${accountSuffix}`,
        email: accountEmail,
        password: accountPassword,
        callbackURL: "/settings",
      }),
    });
    return response.status;
  }, { email, password, suffix });
  expect(signUpStatus).toBe(200);

  await page.goto("/settings");
  const stepUpStatus = await page.evaluate(async (credential) => {
    const response = await fetch("/api/v1/parent/step-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    return response.status;
  }, password);
  expect(stepUpStatus).toBe(200);
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

  const householdUpdate = await page.evaluate(async () => {
    const response = await fetch("/api/v1/household", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Équipage E2E",
        locale: "fr",
        timeZone: "Europe/Paris",
        soundsEnabled: false,
        morningStart: "06:30",
        morningEnd: "09:00",
        eveningStart: "17:30",
        eveningEnd: "21:00",
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(householdUpdate.status).toBe(200);
  expect(householdUpdate.body.household.name).toBe("Équipage E2E");

  const profileUpdate = await page.evaluate(async (id) => {
    const response = await fetch(`/api/v1/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Luna Mission",
        age: 6,
        avatar: "👩‍🚀",
        headline: "Cap sur les étoiles",
      }),
    });
    return { status: response.status, body: await response.json() };
  }, profileId);
  expect(profileUpdate.status).toBe(200);

  const photoUpload = blobConfigured
    ? await page.evaluate(async (id) => {
        const response = await fetch(`/api/v1/profiles/${id}/photo`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=",
          }),
        });
        return { status: response.status, body: await response.json() };
      }, profileId)
    : null;
  if (photoUpload) {
    expect(photoUpload.status).toBe(200);
    expect(photoUpload.body.photoUrl).toMatch(/^rk-media:households\//);
  }

  const customTemplate = await page.evaluate(async () => {
    const response = await fetch("/api/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Préparer la fusée",
        shortLabel: "Fusée",
        icon: "sparkles",
        durationMinutes: 7,
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(customTemplate.status).toBe(201);

  const assignTemplate = ({ id, templateId }: { id: string; templateId: string }) =>
    page.evaluate(async ({ id: profile, templateId: template }) => {
    const response = await fetch("/api/v1/routine-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childProfileId: profile,
        templateId: template,
        period: "MORNING",
        scheduleDays: [1, 3, 5],
      }),
    });
    return { status: response.status, body: await response.json() };
  }, { id, templateId });

  const assignmentAtLimit = await assignTemplate({
    id: profileId,
    templateId: customTemplate.body.template.id as string,
  });
  expect(assignmentAtLimit.status).toBe(409);

  const firstMorningTaskId = await page.evaluate(async () => {
    const payload = await (await fetch("/api/v1/household")).json();
    return payload.household.childProfiles[0].routines.find(
      (routine: { period: string }) => routine.period === "MORNING",
    ).tasks[0].id as string;
  });
  const deleteInitialTaskStatus = await page.evaluate(async ({ id, taskId }) => {
    const response = await fetch(`/api/v1/routine-tasks/${taskId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childProfileId: id }),
    });
    return response.status;
  }, { id: profileId, taskId: firstMorningTaskId });
  expect(deleteInitialTaskStatus).toBe(200);

  const assignment = await assignTemplate({
    id: profileId,
    templateId: customTemplate.body.template.id as string,
  });
  expect(assignment.status).toBe(201);
  const taskId = assignment.body.task.id as string;

  const scheduleUpdate = await page.evaluate(async ({ id, taskId }) => {
    const response = await fetch(`/api/v1/routine-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childProfileId: id, scheduleDays: [1, 2] }),
    });
    return { status: response.status, body: await response.json() };
  }, { id: profileId, taskId });
  expect(scheduleUpdate.status).toBe(200);
  expect(scheduleUpdate.body.task.scheduleDays).toEqual([1, 2]);

  await page.goto("/");
  await expect(page.getByText("Luna Mission", { exact: true })).toBeVisible();
  const householdSnapshot = await page.evaluate(async () => {
    const response = await fetch("/api/v1/household");
    return response.json();
  });
  const routinePeriods = householdSnapshot.household.childProfiles[0].routines.map(
    (routine: { period: string }) => routine.period,
  );
  expect(routinePeriods).toEqual(expect.arrayContaining(["MORNING", "EVENING"]));
  const morningTasks = householdSnapshot.household.childProfiles[0].routines.find(
    (routine: { period: string }) => routine.period === "MORNING",
  ).tasks as Array<{ id: string }>;
  expect(morningTasks.some((task) => task.id === taskId)).toBe(true);

  const reorderStatus = await page.evaluate(async ({ id, orderedTaskIds }) => {
    const response = await fetch("/api/v1/routines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childProfileId: id, period: "MORNING", orderedTaskIds }),
    });
    return response.status;
  }, { id: profileId, orderedTaskIds: morningTasks.map((task) => task.id).reverse() });
  expect(reorderStatus).toBe(200);

  const mediaPath = photoUpload
    ? String(photoUpload.body.photoUrl).replace("rk-media:", "/api/media/")
    : null;
  if (mediaPath) {
    const ownerMediaStatus = await page.evaluate(async (path) => (await fetch(path)).status, mediaPath);
    expect(ownerMediaStatus).toBe(200);
  }

  const foreignContext = await browser.newContext();
  const foreignPage = await foreignContext.newPage();
  await signUpViaApiAndUnlock(foreignPage, `${suffix}-foreign`);
  const foreignDeletionStatus = await foreignPage.evaluate(async (targetProfileId) => {
    const response = await fetch(`/api/v1/profiles/${targetProfileId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return response.status;
  }, profileId);
  expect(foreignDeletionStatus).toBe(404);
  if (mediaPath) {
    const foreignMediaStatus = await foreignPage.evaluate(async (path) => (await fetch(path)).status, mediaPath);
    expect(foreignMediaStatus).toBe(404);
  }
  await foreignContext.close();

  await page.reload();
  await expect(page.getByText("Luna Mission", { exact: true })).toBeVisible();

  const ownerDeletionStatus = await page.evaluate(async (targetProfileId) => {
    const response = await fetch(`/api/v1/profiles/${targetProfileId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return response.status;
  }, profileId);
  expect(ownerDeletionStatus).toBe(200);
});

test("signed Stripe webhooks are idempotent and cannot be regressed by an older event", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-stripe-${Date.now()}`.replaceAll(/[^a-z0-9-]/gi, "-");
  await signUpAndUnlock(page, suffix);
  const userId = await page.evaluate(async () => {
    const session = await (await fetch("/api/auth/get-session")).json();
    return session.user.id as string;
  });
  const timestamp = Math.floor(Date.now() / 1_000);

  const subscription = (status: "active" | "canceled") => ({
    id: `sub_${suffix}`,
    object: "subscription",
    cancel_at_period_end: false,
    customer: `cus_${suffix}`,
    items: {
      object: "list",
      data: [{
        id: `si_${suffix}`,
        object: "subscription_item",
        current_period_start: timestamp,
        current_period_end: timestamp + 2_592_000,
        price: { id: stripeMonthlyPrice, object: "price" },
      }],
    },
    livemode: false,
    metadata: { userId },
    status,
  });

  async function deliver(event: Record<string, unknown>) {
    const payload = JSON.stringify(event);
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: stripeWebhookSecret,
    });
    return page.evaluate(async ({ payload: body, signature: header }) => {
      const response = await fetch("/api/billing/stripe-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": header,
        },
        body,
      });
      return { status: response.status, body: await response.json() };
    }, { payload, signature });
  }

  const activeEvent = {
    id: `evt_${suffix}_active`,
    object: "event",
    api_version: "2026-07-29.dahlia",
    created: timestamp,
    data: { object: subscription("active") },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "customer.subscription.updated",
  };
  const activeResult = await deliver(activeEvent);
  expect(activeResult.status).toBe(200);

  const duplicateResult = await deliver(activeEvent);
  expect(duplicateResult.status).toBe(200);
  expect(duplicateResult.body.duplicate).toBe(true);

  const staleResult = await deliver({
    ...activeEvent,
    id: `evt_${suffix}_stale`,
    created: timestamp - 60,
    data: { object: subscription("canceled") },
  });
  expect(staleResult.status).toBe(200);

  const household = await page.evaluate(async () =>
    (await (await fetch("/api/v1/household")).json()).household,
  );
  expect(household.subscription).toMatchObject({
    plan: "FAMILY_PLUS",
    status: "ACTIVE",
    provider: "STRIPE",
    environment: "TEST",
  });

  const invalidSignature = await page.evaluate(async () =>
    (await fetch("/api/billing/stripe-webhook", {
      method: "POST",
      headers: { "stripe-signature": "invalid" },
      body: "{}",
    })).status,
  );
  expect(invalidSignature).toBe(400);
});
