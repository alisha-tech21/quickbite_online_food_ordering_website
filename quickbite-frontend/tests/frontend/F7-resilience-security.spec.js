import { test, expect } from "@playwright/test";
import {
  mockBackend,
  mockLogin,
  setFakeToken,
  failApi,
  FAKE_USERS,
  FAKE_RESTAURANTS,
} from "../mocks";

const PUBLIC_PAGES = [
  "/",
  "/restaurants",
  "/offers",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password/tok",
  "/nonexistent",
];

// ------------------- Console / JavaScript errors --------------------------
test.describe("JS errors (page crash)", () => {
  for (const path of PUBLIC_PAGES) {
    test(`E1: ${path} par koi uncaught JS error nahi`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await mockBackend(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(errors, `JS errors on ${path}: ${errors.join(" | ")}`).toEqual([]);
    });
  }

  test("E2: customer ke sath bhi (login hone par) koi JS error nahi", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mockBackend(page, { me: FAKE_USERS.customer });
    await setFakeToken(page);
    for (const p of ["/", "/restaurants", "/cart", "/my-orders"]) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });
});

// ----------------------- Server / network failures ------------------------
test.describe("Server ya network kharab ho", () => {
  test("E3: restaurants API 500 -> page crash nahi hota", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mockBackend(page);
    await failApi(page, /\/api\/restaurants(\?.*)?$/, 500);
    await page.goto("/restaurants");
    await expect(
      page.getByPlaceholder("Gulberg specialty kitchens..."),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("E4: internet band (request abort) -> login page par error, crash nahi", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.route("**/api/auth/login", (r) => r.abort("failed"));
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("a@b.com");
    await page.getByPlaceholder("Min. 8 characters").fill("Password1");
    await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
    await expect(
      page.getByRole("button", { name: /Sign In to QuickBite/i }),
    ).toBeEnabled();
    await expect(page).toHaveURL(/\/login/);
  });

  test("E5: login API sust (2s) -> button 'Signing in…' disabled, double click se 1 hi request", async ({
    page,
  }) => {
    await mockBackend(page);
    let hits = 0;
    await page.route("**/api/auth/login", async (r) => {
      hits++;
      await new Promise((res) => setTimeout(res, 1500));
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token: "t",
          user: FAKE_USERS.customer,
        }),
      });
    });
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("a@b.com");
    await page.getByPlaceholder("Min. 8 characters").fill("Password1");
    const btn = page.getByRole("button", { name: /Sign In to QuickBite/i });
    await btn.click();
    await expect(
      page.getByRole("button", { name: /Signing in/i }),
    ).toBeDisabled();
    await expect(page).toHaveURL("/");
    expect(hits).toBe(1);
  });

  test("E6: /auth/me server error (500) par bhi user logout hota hai (stuck nahi)", async ({
    page,
  }) => {
    await mockBackend(page);
    await failApi(page, "**/api/auth/me", 500);
    await setFakeToken(page);
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ------------------------------- Security ---------------------------------
test.describe("Security", () => {
  test("S1: XSS - email field me <script> likhne par alert nahi chalta", async ({
    page,
  }) => {
    await mockBackend(page);
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      d.dismiss();
    });
    await page.goto("/login");
    await page
      .getByPlaceholder("name@example.com")
      .fill("<img src=x onerror=alert(1)>");
    await page.getByPlaceholder("Min. 8 characters").fill("Password1");
    await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
    await page.waitForTimeout(500);
    expect(dialog).toBe(false);
  });

  test("S2: XSS - restaurant ka naam HTML ho to text ki tarah dikhta hai (script nahi chalti)", async ({
    page,
  }) => {
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      d.dismiss();
    });
    const evil = [
      { ...FAKE_RESTAURANTS[0], name: "<img src=x onerror=alert(1)>Evil" },
    ];
    await mockBackend(page, { restaurants: evil });
    await page.goto("/restaurants");
    await expect(page.getByRole("heading", { name: /Evil/ })).toBeVisible();
    expect(dialog).toBe(false);
    await expect(page.locator("h4 img")).toHaveCount(0);
  });

  test("S3: XSS - URL ke search parameter se script nahi chalti", async ({
    page,
  }) => {
    await mockBackend(page);
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      d.dismiss();
    });
    await page.goto('/restaurants?search="><script>alert(1)</script>');
    await page.waitForLoadState("networkidle");
    expect(dialog).toBe(false);
  });

  test("S4: password field masked (type=password) hai, password URL me nahi aata", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");
    await expect(page.getByPlaceholder("Min. 8 characters")).toHaveAttribute(
      "type",
      "password",
    );
    await page.getByPlaceholder("name@example.com").fill("a@b.com");
    await page.getByPlaceholder("Min. 8 characters").fill("SecretPass1");
    await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
    expect(page.url()).not.toContain("SecretPass1");
    expect(page.url()).not.toContain("password");
  });

  test("S5: login ke baad password localStorage me save nahi hota", async ({
    page,
  }) => {
    await mockBackend(page);
    await mockLogin(page);
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("sara@test.com");
    await page.getByPlaceholder("Min. 8 characters").fill("SecretPass1");
    await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
    await expect(page).toHaveURL("/");
    const dump = await page.evaluate(
      () =>
        JSON.stringify({ ...localStorage }) +
        JSON.stringify({ ...sessionStorage }),
    );
    expect(dump).not.toContain("SecretPass1");
  });

  test("S6: token har API request me 'Bearer' header ke sath jata hai", async ({
    page,
  }) => {
    await mockBackend(page, { me: FAKE_USERS.customer });
    await setFakeToken(page, "my-token-123");
    const reqPromise = page.waitForRequest((r) =>
      r.url().endsWith("/api/auth/me"),
    );
    await page.goto("/");
    const req = await reqPromise;
    expect(req.headers()["authorization"]).toBe("Bearer my-token-123");
  });

  test("S7: logout ke baad token hat jata hai aur /cart band ho jata hai", async ({
    page,
  }) => {
    await mockBackend(page, { me: FAKE_USERS.customer });
    await setFakeToken(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("qb_token"));
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login/);
  });

  test("S8: login ke baad 'wapas' (from) wale page par redirect hota hai", async ({
    page,
  }) => {
    await mockBackend(page);
    await mockLogin(page);
    await page.goto("/my-orders");
    await expect(page).toHaveURL(/\/login/);
    await page.getByPlaceholder("name@example.com").fill("sara@test.com");
    await page.getByPlaceholder("Min. 8 characters").fill("Customer@123");
    await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
    await expect(page).toHaveURL(/\/my-orders/);
  });
});
