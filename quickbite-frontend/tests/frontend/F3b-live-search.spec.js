import { test, expect } from "@playwright/test";
import { mockBackend, FAKE_RESTAURANTS } from "../mocks";

const SEARCH = "Gulberg specialty kitchens...";
const isList = (url) => url.pathname === "/api/restaurants";
const reply = (route, restaurants) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      success: true,
      restaurants,
      total: restaurants.length,
    }),
  });

test("L1: debounce - 'pizza' jaldi type karne par har akshar ki alag request nahi jati", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  await page.waitForLoadState("networkidle");

  const searches = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (isList(u) && u.searchParams.get("search"))
      searches.push(u.searchParams.get("search"));
  });

  const box = page.getByPlaceholder(SEARCH);
  await box.pressSequentially("pizza", { delay: 60 }); // har akshar ke beech 60ms
  await expect.poll(() => searches.includes("pizza")).toBe(true);

  // Beech ke adhoore lafz ("p", "pi", "piz"...) server ko nahi jane chahiye
  expect(
    searches,
    `Server ko ye searches gayin: ${searches.join(", ")}`,
  ).not.toContain("p");
  expect(
    searches.length,
    `Server ko ye searches gayin: ${searches.join(", ")}`,
  ).toBeLessThanOrEqual(2);
});

test("L2: slow purana jawab naye result ko overwrite nahi karta", async ({
  page,
}) => {
  await mockBackend(page);
  // "pi" ka jawab 2 second late aur ghalat; "pizza" ka jawab foran aur sahi
  await page.route(isList, async (route) => {
    const s = new URL(route.request().url()).searchParams.get("search");
    if (s === "pi") {
      await new Promise((r) => setTimeout(r, 2000));
      return reply(route, [{ ...FAKE_RESTAURANTS[0], name: "Wrong Place" }]);
    }
    if (s === "pizza") return reply(route, [FAKE_RESTAURANTS[2]]); // Pizza Corner
    return reply(route, FAKE_RESTAURANTS);
  });

  await page.goto("/restaurants");
  const box = page.getByPlaceholder(SEARCH);

  const piSent = page.waitForRequest((r) => {
    const u = new URL(r.url());
    return isList(u) && u.searchParams.get("search") === "pi";
  });
  await box.pressSequentially("pi");
  await piSent; // "pi" ki slow request chal chuki hai
  await box.pressSequentially("zza"); // ab "pizza"

  await expect(
    page.getByRole("heading", { name: "Pizza Corner" }),
  ).toBeVisible();
  await page.waitForTimeout(2500); // slow "pi" wala jawab ab aa chuka hoga
  await expect(page.getByRole("heading", { name: "Wrong Place" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "Pizza Corner" }),
  ).toBeVisible();
});

test("L3: search saaf karne par URL se search hat jata hai", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/restaurants");
  const box = page.getByPlaceholder(SEARCH);
  await box.fill("pizza");
  await expect(page).toHaveURL(/search=pizza/);
  await box.fill("");
  await expect(page).not.toHaveURL(/search=/);
});

test("L4: navbar se /restaurants par jane par purani search saaf ho jati hai (wapas nahi aati)", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/restaurants?search=pizza");
  const box = page.getByPlaceholder(SEARCH);
  await expect(box).toHaveValue("pizza");

  await page.locator('a[href="/restaurants"]').first().click();
  await expect(box).toHaveValue("");
  await page.waitForTimeout(1000); // debounce ka waqt guzar jaye
  await expect(page).not.toHaveURL(/search=/);
});
