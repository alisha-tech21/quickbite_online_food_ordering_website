import { test, expect } from "@playwright/test";
import { USERS, bearer, login } from "./helpers";

// Har endpoint par kaun kaun ja sakta hai. 200 = ijazat, 403 = role ghalat, 401 = login nahi.
const ADMIN_ONLY = [
  "admin/users",
  "admin/users/stats",
  "admin/settings",
  "admin/vouchers",
  "admin/reviews",
];
const OPS = ["admin/dashboard", "admin/orders", "admin/menu-items"]; // admin, branch_manager (+kitchen_staff)
const LOGIN_REQUIRED = ["cart", "orders/mine", "auth/me"];

const tokens = {};
test.beforeAll(async ({ playwright }) => {
  const ctx = await playwright.request.newContext({
    baseURL: process.env.API_URL || "http://localhost:5001/api/",
  });
  for (const [name, u] of Object.entries(USERS))
    tokens[name] = await login(ctx, u);
  await ctx.dispose();
});

test.describe("Sirf admin ke endpoints", () => {
  for (const path of ADMIN_ONLY) {
    test(`AC1: GET ${path}`, async ({ request }) => {
      expect((await request.get(path)).status(), "bina token").toBe(401);
      expect(
        (
          await request.get(path, { headers: bearer(tokens.customer) })
        ).status(),
        "customer",
      ).toBe(403);
      expect(
        (await request.get(path, { headers: bearer(tokens.rider) })).status(),
        "rider",
      ).toBe(403);
      expect(
        (await request.get(path, { headers: bearer(tokens.manager) })).status(),
        "branch_manager",
      ).toBe(403);
      expect(
        (await request.get(path, { headers: bearer(tokens.admin) })).status(),
        "admin",
      ).toBe(200);
    });
  }
});

test.describe("Admin aur branch manager ke endpoints", () => {
  for (const path of OPS) {
    test(`AC2: GET ${path}`, async ({ request }) => {
      expect((await request.get(path)).status(), "bina token").toBe(401);
      expect(
        (
          await request.get(path, { headers: bearer(tokens.customer) })
        ).status(),
        "customer",
      ).toBe(403);
      expect(
        (await request.get(path, { headers: bearer(tokens.rider) })).status(),
        "rider",
      ).toBe(403);
      expect(
        (await request.get(path, { headers: bearer(tokens.manager) })).status(),
        "branch_manager",
      ).toBe(200);
      expect(
        (await request.get(path, { headers: bearer(tokens.admin) })).status(),
        "admin",
      ).toBe(200);
    });
  }
});

test.describe("Login zaroori wale endpoints", () => {
  for (const path of LOGIN_REQUIRED) {
    test(`AC3: GET ${path} bina token 401, token ke sath 200`, async ({
      request,
    }) => {
      expect((await request.get(path)).status()).toBe(401);
      expect(
        (
          await request.get(path, { headers: bearer(tokens.customer) })
        ).status(),
      ).toBe(200);
    });
  }
});

test.describe("Customer admin kaam nahi kar sakta (likhne wale endpoints)", () => {
  test("AC4: customer restaurant nahi bana sakta", async ({ request }) => {
    const res = await request.post("restaurants/admin", {
      headers: bearer(tokens.customer),
      data: { name: "Hack" },
    });
    expect(res.status()).toBe(403);
  });

  test("AC5: customer user nahi bana sakta", async ({ request }) => {
    const res = await request.post("admin/users", {
      headers: bearer(tokens.customer),
      data: { fullName: "Hack" },
    });
    expect(res.status()).toBe(403);
  });

  test("AC6: customer settings nahi badal sakta", async ({ request }) => {
    const res = await request.put("admin/settings", {
      headers: bearer(tokens.customer),
      data: { taxPercentage: 0 },
    });
    expect(res.status()).toBe(403);
  });

  test("AC7: branch manager settings nahi badal sakta (sirf admin)", async ({
    request,
  }) => {
    const res = await request.put("admin/settings", {
      headers: bearer(tokens.manager),
      data: { taxPercentage: 0 },
    });
    expect(res.status()).toBe(403);
  });

  test("AC8: customer voucher nahi bana sakta", async ({ request }) => {
    const res = await request.post("admin/vouchers", {
      headers: bearer(tokens.customer),
      data: { code: "HACK" },
    });
    expect(res.status()).toBe(403);
  });

  test("AC9: customer order ka status nahi badal sakta", async ({
    request,
  }) => {
    const res = await request.patch(
      "admin/orders/507f1f77bcf86cd799439011/status",
      {
        headers: bearer(tokens.customer),
        data: { status: "delivered" },
      },
    );
    expect(res.status()).toBe(403);
  });
});

test.describe("Public endpoints bina login", () => {
  for (const path of [
    "restaurants",
    "restaurants/reviews",
    "menu-items",
    "menu-items/categories",
    "vouchers/active",
    "settings",
  ]) {
    test(`AC10: GET ${path} public hai`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(200);
    });
  }
});

test("AC11: profile update se role nahi badal sakta (mass assignment)", async ({
  request,
}) => {
  const res = await request.put("users/me", {
    headers: bearer(tokens.customer),
    data: { role: "admin", status: "active" },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).user.role).toBe("customer");
  const me = await (
    await request.get("auth/me", { headers: bearer(tokens.customer) })
  ).json();
  expect(me.user.role).toBe("customer");
});
