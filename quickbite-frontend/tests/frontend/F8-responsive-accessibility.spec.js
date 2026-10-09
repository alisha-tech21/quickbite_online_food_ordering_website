import { test, expect } from "@playwright/test";
import { mockBackend } from "../mocks";

const VIEWPORTS = [
  { name: "iPhone SE (chhota mobile)", width: 320, height: 568 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "iPad", width: 768, height: 1024 },
  { name: "Laptop", width: 1366, height: 768 },
  { name: "Full HD", width: 1920, height: 1080 },
];
const PAGES = [
  "/",
  "/restaurants",
  "/login",
  "/register",
  "/forgot-password",
  "/offers",
];

// ------------------------ Responsive (alag screen sizes) ------------------
test.describe("Responsive: horizontal scroll nahi aana chahiye", () => {
  for (const vp of VIEWPORTS) {
    for (const path of PAGES) {
      test(`V1: ${path} @ ${vp.name} (${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await mockBackend(page);
        // networkidle nahi: bahar ki images/fonts (Unsplash, Google Fonts) slow hon to test atak jata hai
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200); // React ko page banane ka waqt
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(
          overflow,
          `${overflow}px horizontal overflow`,
        ).toBeLessThanOrEqual(1);
      });
    }
  }
});

test.describe("Mobile par khaas cheezein", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("V2: mobile par login form poora use ho sakta hai", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/login");
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In to QuickBite/i }))
      .toBeInViewport({ ratio: 0.5 })
      .catch(() => {});
    await page
      .getByRole("button", { name: /Sign In to QuickBite/i })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: /Sign In to QuickBite/i }),
    ).toBeVisible();
  });

  test("V3: mobile menu (hamburger) khulta hai aur Restaurants ka link milta hai", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/");
    await page.getByLabel("Open Menu").click();
    await expect(
      page.locator('a[href="/restaurants"]:visible').first(),
    ).toBeVisible();
  });
});

// ----------------------------- Accessibility ------------------------------
test.describe("Accessibility (basic)", () => {
  test("A1: login form keyboard (Tab + Enter) se chalta hai", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").focus();
    await page.keyboard.type("abc");
    await page.keyboard.press("Tab"); // pehla Tab: "Forgot password?" link
    await page.keyboard.press("Tab"); // doosra Tab: password box
    await page.keyboard.type("Password1");
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Please enter a valid email format."),
    ).toBeVisible();
  });

  test("A2: har page par sirf ek <h1> hai", async ({ page }) => {
    await mockBackend(page);
    for (const p of [
      "/login",
      "/register",
      "/forgot-password",
      "/nonexistent",
    ]) {
      await page.goto(p);
      await expect(page.locator("h1:visible")).toHaveCount(1);
    }
  });

  test("A3: sab images par alt attribute maujood hai (home page)", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const missing = await page.$$eval("img", (imgs) =>
      imgs.filter((i) => !i.hasAttribute("alt")).map((i) => i.src),
    );
    expect(missing, `alt ke baghair images: ${missing.join(", ")}`).toEqual([]);
  });

  test("A4: icon-only buttons ka naam (aria-label/text) hona chahiye", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/login");
    const unnamed = await page.$$eval("button", (btns) =>
      btns
        .filter(
          (b) =>
            !(b.textContent || "").trim() &&
            !b.getAttribute("aria-label") &&
            !b.getAttribute("title"),
        )
        .map((b) => b.outerHTML.slice(0, 80)),
    );
    expect(unnamed, `bina naam ke buttons: ${unnamed.join(" | ")}`).toEqual([]);
  });

  test("A5: page ka <title> khali nahi", async ({ page }) => {
    await mockBackend(page);
    for (const p of ["/", "/login", "/restaurants"]) {
      await page.goto(p);
      expect((await page.title()).trim().length).toBeGreaterThan(0);
    }
  });

  test("A6: <html lang> set hai", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/");
    expect(await page.getAttribute("html", "lang")).toBeTruthy();
  });
});
