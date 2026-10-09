import { test, expect } from "@playwright/test";
import { mockBackend, mockLogin, FAKE_USERS } from "../mocks";

const signInBtn = (page) =>
  page.getByRole("button", { name: /Sign In to QuickBite/i });

test.beforeEach(async ({ page }) => {
  await mockBackend(page); // koi login nahi, koi user nahi
});

test.describe("Login page - form", () => {
  test("T1: page sahi load hota hai", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Min. 8 characters")).toBeVisible();
    await expect(signInBtn(page)).toBeVisible();
  });

  test("T2: khali form par dono errors aate hain", async ({ page }) => {
    await page.goto("/login");
    await signInBtn(page).click();
    await expect(page.getByText("Email address is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
  });

  test("T3: ghalat email format reject hota hai", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("abc");
    await page.getByPlaceholder("Min. 8 characters").fill("Password123");
    await signInBtn(page).click();
    await expect(
      page.getByText("Please enter a valid email format."),
    ).toBeVisible();
  });

  test("T4: 8 se chhota password reject hota hai", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("a@b.com");
    await page.getByPlaceholder("Min. 8 characters").fill("1234");
    await signInBtn(page).click();
    await expect(
      page.getByText("Password must be at least 8 characters long."),
    ).toBeVisible();
  });

  test("T5: error likhne ke baad error gayab ho jata hai", async ({ page }) => {
    await page.goto("/login");
    await signInBtn(page).click();
    await expect(page.getByText("Email address is required.")).toBeVisible();
    await page.getByPlaceholder("name@example.com").fill("a");
    await expect(page.getByText("Email address is required.")).toBeHidden();
  });

  test("T6: show/hide password button", async ({ page }) => {
    await page.goto("/login");
    const pwd = page.getByPlaceholder("Min. 8 characters");
    await expect(pwd).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(pwd).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(pwd).toHaveAttribute("type", "password");
  });
});

test.describe("Login page - server ke jawab (mock)", () => {
  test("T7: ghalat credentials (401) par error dikhta hai", async ({
    page,
  }) => {
    await mockLogin(page, { status: 401 });
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("x@test.com");
    await page.getByPlaceholder("Min. 8 characters").fill("WrongPass123");
    await signInBtn(page).click();
    await expect(
      page.getByText("Invalid email or password. Please try again."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("T8: customer login -> home par redirect + token save", async ({
    page,
  }) => {
    await mockLogin(page, { user: FAKE_USERS.customer });
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("sara@test.com");
    await page.getByPlaceholder("Min. 8 characters").fill("Customer@123");
    await signInBtn(page).click();
    await expect(page).toHaveURL("/");
    expect(await page.evaluate(() => localStorage.getItem("qb_token"))).toBe(
      "fake-token",
    );
  });

  test("T9: admin login -> /admin par redirect", async ({ page }) => {
    await mockLogin(page, { user: FAKE_USERS.admin });
    await page.goto("/login");
    await page.getByPlaceholder("name@example.com").fill("admin@test.com");
    await page.getByPlaceholder("Min. 8 characters").fill("Admin@12345");
    await signInBtn(page).click();
    await expect(page).toHaveURL(/\/admin/);
  });
});

test.describe("Login page - links", () => {
  test("T10: 'Sign up now' register par le jata hai", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up now" }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("T11: 'Forgot password?' sahi page par le jata hai", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
