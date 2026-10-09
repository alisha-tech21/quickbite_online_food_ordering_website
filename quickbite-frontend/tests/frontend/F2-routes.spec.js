import { test, expect } from "@playwright/test";
import { mockBackend, setFakeToken, FAKE_USERS } from "../mocks";

test.describe("Bina login", () => {
  for (const path of [
    "/cart",
    "/checkout",
    "/my-orders",
    "/admin",
    "/admin/orders",
    "/admin/users",
  ]) {
    test(`R1: ${path} -> /login par bhej deta hai`, async ({ page }) => {
      await mockBackend(page);
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("R2: public pages bina login khulte hain", async ({ page }) => {
    await mockBackend(page);
    for (const path of [
      "/",
      "/restaurants",
      "/offers",
      "/login",
      "/register",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path === "/" ? "/$" : path));
    }
  });
});

test.describe("Role ke hisaab se access", () => {
  test("R3: customer /admin nahi khol sakta", async ({ page }) => {
    await mockBackend(page, { me: FAKE_USERS.customer });
    await setFakeToken(page);
    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("R4: customer /admin/users nahi khol sakta", async ({ page }) => {
    await mockBackend(page, { me: FAKE_USERS.customer });
    await setFakeToken(page);
    await page.goto("/admin/users");
    await expect(page).toHaveURL("/");
  });

  test("R5: admin /admin/users khol sakta hai", async ({ page }) => {
    await mockBackend(page, { me: FAKE_USERS.admin });
    await setFakeToken(page);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test("R6: branch manager /admin khol sakta hai", async ({ page }) => {
    await mockBackend(page, { me: FAKE_USERS.manager });
    await setFakeToken(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("R7: branch manager /admin/settings nahi khol sakta (sirf admin)", async ({
    page,
  }) => {
    await mockBackend(page, { me: FAKE_USERS.manager });
    await setFakeToken(page);
    await page.goto("/admin/settings");
    await expect(page).toHaveURL("/");
  });

  test("R8: customer /cart khol sakta hai", async ({ page }) => {
    await mockBackend(page, { me: FAKE_USERS.customer });
    await setFakeToken(page);
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart/);
  });
});

test("R9: ghalat/expired token -> logout + /login", async ({ page }) => {
  await mockBackend(page, { me: null }); // /auth/me 401 dega
  await setFakeToken(page, "expired-token");
  await page.goto("/cart");
  await expect(page).toHaveURL(/\/login/);
  expect(
    await page.evaluate(() => localStorage.getItem("qb_token")),
  ).toBeNull();
});

test("R10: ghalat URL par 404 page, aur wapas home ka link", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/yeh-page-nahi-hai");
  await expect(page.getByRole("heading", { name: /404/ })).toBeVisible();
  await page.getByRole("link", { name: /Back to home/i }).click();
  await expect(page).toHaveURL("/");
});
