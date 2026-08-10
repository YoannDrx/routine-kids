import { expect, test } from "@playwright/test";

test("signed-out family board exposes real account entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/RoutineKids/);
  await page.getByRole("button", { name: /ajouter un astronaute|add astronaut/i }).click();
  await expect(page).toHaveURL(/\/sign-up\?callbackUrl=/);

  await page.goto("/");
  await page.getByRole("button", { name: /parametres parent|parent settings/i }).click();
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=/);
  await expect(page.locator("body")).not.toContainText("admin");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("pricing only promises enforced Family Plus capabilities", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByText(/4[,.]99€\/mois/)).toBeVisible();
  await expect(page.getByText(/39[,.]99€\/an/)).toBeVisible();
  await expect(page.getByText(/20 missions par routine/i)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/sans limite applicative/i);
  await expect(page.locator("body")).not.toContainText(/missions illimitees/i);
});

test("password recovery keeps account existence private", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("unknown@example.com");
  await page.getByRole("button", { name: /envoyer le lien/i }).click();

  await expect(page.getByRole("status")).toContainText(/si cette adresse/i);
});

test("web app manifest is installable and declares a maskable icon", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();

  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([expect.objectContaining({ purpose: "maskable" })]),
  );
});

test("production discovery and service-worker routes expose safe headers", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Disallow: /api/");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("/privacy");

  const serviceWorker = await request.get("/sw.js");
  expect(serviceWorker.ok()).toBeTruthy();
  expect(serviceWorker.headers()["content-type"]).toContain(
    "application/javascript",
  );
  expect(serviceWorker.headers()["cache-control"]).toContain("max-age=0");
});

test("unknown pages offer a route back to the family board", async ({ page }) => {
  await page.goto("/mission-introuvable");

  await expect(page.getByRole("heading", { name: "Mission introuvable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour à RoutineKids" })).toHaveAttribute(
    "href",
    "/",
  );
});

test("legal, support, and health surfaces are publicly reachable", async ({
  page,
  request,
}) => {
  for (const path of ["/privacy", "/terms", "/support"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "RoutineKids", exact: true }),
    ).toBeVisible();
  }

  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const payload = await health.json();
  expect(payload).toMatchObject({
    service: "routinekids-web",
    status: "ok",
  });
});
