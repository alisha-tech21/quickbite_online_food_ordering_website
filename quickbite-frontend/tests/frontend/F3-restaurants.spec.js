import { test, expect } from "@playwright/test";
import { mockBackend, FAKE_RESTAURANTS } from "../mocks";

test("P1: home page load hota hai aur Restaurants ka link maujood hai", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/QuickBite/i);
  await expect(page.locator('a[href="/restaurants"]').first()).toBeVisible();
});

test("P2: navbar se Restaurants page par jana", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/");
  await page.locator('a[href="/restaurants"]').first().click();
  await expect(page).toHaveURL(/\/restaurants/);
});

test("P3: restaurants ki list screen par dikhti hai", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  for (const r of FAKE_RESTAURANTS) {
    await expect(page.getByRole("heading", { name: r.name })).toBeVisible();
  }
});

test("P4: free delivery wale restaurant par 'FREE Delivery' likha aata hai", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  await expect(page.getByText("FREE Delivery").first()).toBeVisible();
});

test("P5: 'View Menu' sahi restaurant ke page par le jata hai", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  await page
    .getByRole("link", { name: /View Menu/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/restaurants\/aaaaaaaaaaaaaaaaaaaaaaa1/);
});

test("P6: search box me type karna", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  const search = page.getByPlaceholder("Gulberg specialty kitchens...");
  await search.fill("pizza");
  await expect(search).toHaveValue("pizza");
});

test("P7: search karne par server ko 'search' parameter jata hai", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  const reqPromise = page.waitForRequest(
    (r) => /\/api\/restaurants\?/.test(r.url()) && r.url().includes("pizza"),
  );
  await page.getByPlaceholder("Gulberg specialty kitchens...").fill("pizza");
  await reqPromise; // agar request nahi gayi to test fail
});

test("P8: restaurants na hon to crash nahi hota", async ({ page }) => {
  await mockBackend(page, { restaurants: [] });
  await page.goto("/restaurants");
  await expect(
    page.getByPlaceholder("Gulberg specialty kitchens..."),
  ).toBeVisible();
});

test("P9: offers page khulta hai", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/offers");
  await expect(page).toHaveURL(/\/offers/);
});

test("P10: login ke baad navbar me user ka naam dikhta hai", async ({
  page,
}) => {
  await mockBackend(page, {
    me: {
      _id: "u1",
      fullName: "Sara Tariq",
      email: "s@t.com",
      role: "customer",
    },
  });
  await page.addInitScript(() => localStorage.setItem("qb_token", "fake"));
  await page.goto("/");
  await expect(page.getByText("Sara T.").first()).toBeVisible();
});
