import { test, expect } from "@playwright/test";
import { mockBackend } from "../mocks";

const submit = (page) =>
  page.getByRole("button", { name: /Create Account & Continue/i });
const fields = (page) => ({
  name: page.getByPlaceholder("e.g. Tariq Mahmood"),
  email: page.getByPlaceholder("tariq@example.com"),
  phone: page.getByPlaceholder("300 1234567"),
  pass: page.getByPlaceholder("Min. 8 characters"),
  confirm: page.getByPlaceholder("Re-type password"),
  terms: page.locator('input[name="agreeTerms"]'),
});

async function fillValid(page, over = {}) {
  const f = fields(page);
  const d = {
    name: "Ali Khan",
    email: "ali@test.com",
    phone: "3001234567",
    pass: "Password1",
    confirm: "Password1",
    ...over,
  };
  await f.name.fill(d.name);
  await f.email.fill(d.email);
  await f.phone.fill(d.phone);
  await f.pass.fill(d.pass);
  await f.confirm.fill(d.confirm);
  if (over.terms !== false) await f.terms.check();
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
  await page.goto("/register");
});

test.describe("Register - required fields", () => {
  test("G1: khali form par sab errors aate hain", async ({ page }) => {
    await submit(page).click();
    await expect(page.getByText("Full name is required.")).toBeVisible();
    await expect(page.getByText("Email address is required.")).toBeVisible();
    await expect(page.getByText("Phone number is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
    await expect(page.getByText("Confirm password is required.")).toBeVisible();
  });

  test("G2: terms tick na ho to toast error aata hai aur API call nahi jati", async ({
    page,
  }) => {
    let called = 0;
    await page.route("**/api/auth/register", (r) => {
      called++;
      r.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    });
    await fillValid(page, { terms: false });
    await submit(page).click();
    await expect(
      page.getByText("Please agree to the Terms of Service and Privacy Policy"),
    ).toBeVisible();
    expect(called).toBe(0);
  });
});

test.describe("Register - Full Name (boundary + invalid)", () => {
  const cases = [
    ["numbers wala naam", "Ali123", "Name cannot contain numbers or symbols."],
    [
      "symbols wala naam",
      "Ali@Khan",
      "Name cannot contain numbers or symbols.",
    ],
    [
      "2 letters (minimum se kam)",
      "Al",
      "Full name must be at least 3 characters long.",
    ],
    [
      "31 letters (maximum se zyada)",
      "A".repeat(31),
      "Full name cannot exceed 30 characters.",
    ],
  ];
  for (const [title, value, msg] of cases) {
    test(`G3: ${title}`, async ({ page }) => {
      await fillValid(page, { name: value });
      await submit(page).click();
      await expect(page.getByText(msg)).toBeVisible();
    });
  }

  test("G4: boundary - 3 letters aur 30 letters dono valid hain", async ({
    page,
  }) => {
    for (const n of ["Ali", "A".repeat(30)]) {
      await page.goto("/register");
      await fillValid(page, { name: n });
      await submit(page).click();
      await expect(
        page.getByText(/Name cannot|at least 3|cannot exceed/),
      ).toHaveCount(0);
    }
  });
});

test.describe("Register - Email", () => {
  for (const bad of ["abc", "abc@", "abc@test", "@test.com", "a b@test.com"]) {
    test(`G5: ghalat email "${bad}" reject`, async ({ page }) => {
      await fillValid(page, { email: bad });
      await submit(page).click();
      await expect(
        page.getByText("Please enter a valid email address."),
      ).toBeVisible();
    });
  }
});

test.describe("Register - Phone", () => {
  test("G6: 8 digits reject (minimum 9)", async ({ page }) => {
    await fillValid(page, { phone: "30012345" });
    await submit(page).click();
    await expect(
      page.getByText("Please enter a valid phone number."),
    ).toBeVisible();
  });

  test("G7: 9 digits accept (boundary)", async ({ page }) => {
    await fillValid(page, { phone: "300123456" });
    await submit(page).click();
    await expect(
      page.getByText("Please enter a valid phone number."),
    ).toHaveCount(0);
  });
});

test.describe("Register - Password", () => {
  test("G8: 8 chars magar number nahi -> reject", async ({ page }) => {
    await fillValid(page, { pass: "Password", confirm: "Password" });
    await submit(page).click();
    await expect(
      page.getByText("Must be 8+ chars and include a number."),
    ).toBeVisible();
  });

  test("G9: number hai magar 7 chars -> reject", async ({ page }) => {
    await fillValid(page, { pass: "Pass123", confirm: "Pass123" });
    await submit(page).click();
    await expect(
      page.getByText("Must be 8+ chars and include a number."),
    ).toBeVisible();
  });

  test("G10: confirm password match na kare -> reject", async ({ page }) => {
    await fillValid(page, { confirm: "Different1" });
    await submit(page).click();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });

  test("G11: type karte waqt checklist (8 chars / number / match) live update hoti hai", async ({
    page,
  }) => {
    const f = fields(page);
    const ok = (label) => page.getByText(label).locator("..");
    await f.pass.fill("abcdefgh");
    await expect(page.getByText("Min. 8 chars")).toHaveClass(/emerald/);
    await expect(page.getByText("1 number")).not.toHaveClass(/emerald/);
    await f.pass.fill("abcdefg1");
    await expect(page.getByText("1 number")).toHaveClass(/emerald/);
    await f.confirm.fill("abcdefg1");
    await expect(page.getByText("Match")).toHaveClass(/emerald/);
  });
});

test.describe("Register - server ke jawab", () => {
  test("G12: kamyabi -> /verify-otp par jata hai", async ({ page }) => {
    await page.route("**/api/auth/register", (r) =>
      r.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, email: "ali@test.com" }),
      }),
    );
    await fillValid(page);
    await submit(page).click();
    await expect(page).toHaveURL(/\/verify-otp/);
  });

  test("G13: pehle se maujood email -> email field ke neeche error", async ({
    page,
  }) => {
    await page.route("**/api/auth/register", (r) =>
      r.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "An account with this email or phone already exists",
        }),
      }),
    );
    await fillValid(page);
    await submit(page).click();
    await expect(
      page.getByText("An account with this email or phone already exists"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("G14: server 500 -> toast error, page crash nahi", async ({ page }) => {
    await page.route("**/api/auth/register", (r) =>
      r.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Registration failed",
        }),
      }),
    );
    await fillValid(page);
    await submit(page).click();
    await expect(page.getByText("Registration failed")).toBeVisible();
    await expect(submit(page)).toBeEnabled();
  });

  test("G15: request chalte waqt button disable hota hai (double submit nahi)", async ({
    page,
  }) => {
    let hits = 0;
    await page.route("**/api/auth/register", async (r) => {
      hits++;
      await new Promise((res) => setTimeout(res, 800));
      r.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, email: "ali@test.com" }),
      });
    });
    await fillValid(page);
    await submit(page).click();
    await expect(
      page.getByRole("button", { name: /Creating account/i }),
    ).toBeDisabled();
    await expect(page).toHaveURL(/\/verify-otp/);
    expect(hits).toBe(1);
  });

  test("G16: sahi data server ko bheja jata hai (payload check)", async ({
    page,
  }) => {
    let body;
    await page.route("**/api/auth/register", (r) => {
      body = r.request().postDataJSON();
      r.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, email: "ali@test.com" }),
      });
    });
    await fillValid(page);
    await submit(page).click();
    await expect(page).toHaveURL(/\/verify-otp/);
    expect(body).toMatchObject({
      fullName: "Ali Khan",
      email: "ali@test.com",
      phone: "3001234567",
      countryCode: "+92",
    });
    expect(body.confirmPassword).toBeUndefined();
  });
});

test("G17: 'Sign in' link login par le jata hai", async ({ page }) => {
  await page.getByRole("link", { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/login/);
});
