import { test, expect } from "@playwright/test";
import { mockBackend, FAKE_USERS } from "../mocks";

const reply = (status, body) => (r) =>
  r.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

// ------------------------------- OTP --------------------------------------
test.describe("Verify OTP", () => {
  // OTP page ko email chahiye (router state se). Register page ke raste se aate hain.
  async function openOtp(page) {
    await mockBackend(page);
    await page.route(
      "**/api/auth/register",
      reply(201, { success: true, email: "ali.khan@test.com" }),
    );
    await page.goto("/register");
    await page.getByPlaceholder("e.g. Tariq Mahmood").fill("Ali Khan");
    await page.getByPlaceholder("tariq@example.com").fill("ali.khan@test.com");
    await page.getByPlaceholder("300 1234567").fill("3001234567");
    await page.getByPlaceholder("Min. 8 characters").fill("Password1");
    await page.getByPlaceholder("Re-type password").fill("Password1");
    await page.locator('input[name="agreeTerms"]').check();
    await page
      .getByRole("button", { name: /Create Account & Continue/i })
      .click();
    await expect(page).toHaveURL(/\/verify-otp/);
  }

  test("O1: email ke baghair seedha aao to /register par wapas", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/verify-otp");
    await expect(page).toHaveURL(/\/register/);
  });

  test("O2: email masked dikhti hai (poori nahi)", async ({ page }) => {
    await openOtp(page);
    await expect(page.getByText("ali.••••@test.com")).toBeVisible();
    await expect(page.getByText("ali.khan@test.com")).toHaveCount(0);
  });

  test("O3: 6 boxes hain", async ({ page }) => {
    await openOtp(page);
    await expect(page.locator('input[inputmode="numeric"]')).toHaveCount(6);
  });

  test("O4: sirf numbers accept hote hain, huroof nahi", async ({ page }) => {
    await openOtp(page);
    const first = page.locator('input[inputmode="numeric"]').first();
    await first.fill("a");
    await expect(first).toHaveValue("");
    await first.fill("5");
    await expect(first).toHaveValue("5");
  });

  test("O5: 6 digit paste karne se sab boxes bhar jate hain", async ({
    page,
  }) => {
    await openOtp(page);
    const boxes = page.locator('input[inputmode="numeric"]');
    await boxes.first().focus();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData("text", "123456");
      document.activeElement.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    for (let i = 0; i < 6; i++)
      await expect(boxes.nth(i)).toHaveValue(String(i + 1));
  });

  test("O6: adhoora code (3 digits) par error aata hai", async ({ page }) => {
    await openOtp(page);
    const boxes = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 3; i++) await boxes.nth(i).fill("1");
    await page.getByRole("button", { name: /Verify & Sign In/i }).click();
    await expect(page.getByText("Enter the full 6-digit code")).toBeVisible();
  });

  test("O7: sahi code -> login + home", async ({ page }) => {
    await openOtp(page);
    await page.route(
      "**/api/auth/verify-otp",
      reply(200, { success: true, token: "tok", user: FAKE_USERS.customer }),
    );
    const boxes = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill("1");
    await page.getByRole("button", { name: /Verify & Sign In/i }).click();
    await expect(page).toHaveURL("/");
    expect(await page.evaluate(() => localStorage.getItem("qb_token"))).toBe(
      "tok",
    );
  });

  test("O8: ghalat code -> error toast, page par hi rehta hai", async ({
    page,
  }) => {
    await openOtp(page);
    await page.route(
      "**/api/auth/verify-otp",
      reply(400, {
        success: false,
        message: "Invalid or expired verification code",
      }),
    );
    const boxes = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill("9");
    await page.getByRole("button", { name: /Verify & Sign In/i }).click();
    await expect(
      page.getByText("Invalid or expired verification code"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/verify-otp/);
  });

  test("O9: Resend button shuru me disabled (45s timer)", async ({ page }) => {
    await openOtp(page);
    await expect(
      page.getByRole("button", { name: "Resend Code" }),
    ).toBeDisabled();
    await expect(page.getByText(/Resend code in/)).toBeVisible();
  });
});

// ---------------------------- Forgot password -----------------------------
test.describe("Forgot password", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto("/forgot-password");
  });

  test("FP1: page load hota hai", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Forgot Your Password/i }),
    ).toBeVisible();
  });

  test("FP2: khali email par API call nahi jati (browser rok deta hai)", async ({
    page,
  }) => {
    let called = 0;
    await page.route("**/api/auth/forgot-password", (r) => {
      called++;
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.getByRole("button", { name: /Send Reset Link/i }).click();
    expect(called).toBe(0);
  });

  test("FP3: ghalat email format par API call nahi jati", async ({ page }) => {
    let called = 0;
    await page.route("**/api/auth/forgot-password", (r) => {
      called++;
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.getByPlaceholder("e.g. yourname@gmail.com").fill("notanemail");
    await page.getByRole("button", { name: /Send Reset Link/i }).click();
    expect(called).toBe(0);
  });

  test("FP4: sahi email -> 'Check your inbox' message", async ({ page }) => {
    await page.route(
      "**/api/auth/forgot-password",
      reply(200, { success: true }),
    );
    await page.getByPlaceholder("e.g. yourname@gmail.com").fill("ali@test.com");
    await page.getByRole("button", { name: /Send Reset Link/i }).click();
    await expect(page.getByText(/Check your inbox/)).toBeVisible();
  });

  test("FP5: server error -> toast, form wapas use ho sakta hai", async ({
    page,
  }) => {
    await page.route(
      "**/api/auth/forgot-password",
      reply(500, { success: false, message: "Email service down" }),
    );
    await page.getByPlaceholder("e.g. yourname@gmail.com").fill("ali@test.com");
    await page.getByRole("button", { name: /Send Reset Link/i }).click();
    await expect(page.getByText("Email service down")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send Reset Link/i }),
    ).toBeEnabled();
  });
});

// ---------------------------- Reset password ------------------------------
test.describe("Reset password", () => {
  const btn = (page) =>
    page.getByRole("button", { name: /Reset Password & Sign In/i });
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto("/reset-password/abc123token");
  });

  test("RP1: password match na ho to error", async ({ page }) => {
    await page.getByPlaceholder("Create a strong password").fill("Password1");
    await page.getByPlaceholder("Re-enter your new password").fill("Password2");
    await btn(page).click();
    await expect(page.getByText("Passwords do not match!")).toBeVisible();
  });

  test("RP2: kamzor password (sab small letters) reject", async ({ page }) => {
    await page.getByPlaceholder("Create a strong password").fill("password");
    await page.getByPlaceholder("Re-enter your new password").fill("password");
    await btn(page).click();
    await expect(
      page.getByText("Please meet all password security requirements."),
    ).toBeVisible();
  });

  test("RP3: sahi password -> URL ka token API ko jata hai aur /login par redirect", async ({
    page,
  }) => {
    let body;
    await page.route("**/api/auth/reset-password", (r) => {
      body = r.request().postDataJSON();
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    await page.getByPlaceholder("Create a strong password").fill("Password1");
    await page.getByPlaceholder("Re-enter your new password").fill("Password1");
    await btn(page).click();
    await expect(page).toHaveURL(/\/login/);
    expect(body).toMatchObject({
      token: "abc123token",
      newPassword: "Password1",
    });
  });

  test("RP4: expired token -> error toast, /reset-password par hi rehta hai", async ({
    page,
  }) => {
    await page.route(
      "**/api/auth/reset-password",
      reply(400, {
        success: false,
        message: "Reset link is invalid or has expired",
      }),
    );
    await page.getByPlaceholder("Create a strong password").fill("Password1");
    await page.getByPlaceholder("Re-enter your new password").fill("Password1");
    await btn(page).click();
    await expect(
      page.getByText("Reset link is invalid or has expired"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password\//);
  });
});
