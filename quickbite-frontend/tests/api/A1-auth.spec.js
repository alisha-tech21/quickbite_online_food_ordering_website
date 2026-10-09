import { test, expect } from "@playwright/test";
import { USERS, bearer, login } from "./helpers";

test.describe("Health aur 404", () => {
  test("B1: /health chalta hai", async ({ request }) => {
    const res = await request.get("health");
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("B2: ghalat route par JSON 404 aata hai (HTML nahi)", async ({
    request,
  }) => {
    const res = await request.get("yeh-route-nahi-hai");
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("Route not found");
  });
});

test.describe("Login", () => {
  for (const [name, u] of Object.entries(USERS)) {
    test(`B3: ${name} sahi credentials se login hota hai`, async ({
      request,
    }) => {
      const res = await request.post("auth/login", {
        data: { email: u.email, password: u.password },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe(u.email);
      expect(body.user.role).toBe(u.role);
      expect(
        body.user.password,
        "password response me nahi aana chahiye",
      ).toBeUndefined();
    });
  }

  test("B4: ghalat password -> 401 'Invalid credentials'", async ({
    request,
  }) => {
    const res = await request.post("auth/login", {
      data: { email: USERS.customer.email, password: "WrongPass123" },
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).message).toBe("Invalid credentials");
  });

  test("B5: na-maujood email -> 401 aur wohi message (pata na chale ke email register hai ya nahi)", async ({
    request,
  }) => {
    const wrongPass = await request.post("auth/login", {
      data: { email: USERS.customer.email, password: "WrongPass123" },
    });
    const noUser = await request.post("auth/login", {
      data: { email: "nobody@nowhere.com", password: "WrongPass123" },
    });
    expect(noUser.status()).toBe(401);
    expect((await noUser.json()).message).toBe(
      (await wrongPass.json()).message,
    );
  });

  test("B6: email ke bajaye phone se bhi login hota hai (agar phone maujood ho)", async ({
    request,
  }) => {
    const token = await login(request, USERS.customer);
    const me = await (
      await request.get("auth/me", { headers: bearer(token) })
    ).json();
    test.skip(!me.user.phone, "Seed user ka phone nahi mila");
    const res = await request.post("auth/login", {
      data: { phone: me.user.phone, password: USERS.customer.password },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe("Register (sirf validation, koi account nahi banta, koi email nahi jati)", () => {
  test("B7: zaroori fields na hon -> 400", async ({ request }) => {
    const res = await request.post("auth/register", {
      data: { email: "x@y.com" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain("required");
  });

  test("B8: 8 se chhota password -> 400", async ({ request }) => {
    const res = await request.post("auth/register", {
      data: {
        fullName: "Test User",
        email: "short@test.com",
        phone: "3001112233",
        password: "123",
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain("at least 8");
  });

  test("B9: pehle se maujood email -> 400", async ({ request }) => {
    const res = await request.post("auth/register", {
      data: {
        fullName: "Dup User",
        email: USERS.customer.email,
        phone: "3009990001",
        password: "Password123",
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain("already exists");
  });
});

test.describe("Token (/auth/me)", () => {
  test("B10: sahi token -> apna profile, password nahi", async ({
    request,
  }) => {
    const token = await login(request, USERS.customer);
    const res = await request.get("auth/me", { headers: bearer(token) });
    expect(res.status()).toBe(200);
    const { user } = await res.json();
    expect(user.email).toBe(USERS.customer.email);
    expect(user.password).toBeUndefined();
  });

  test("B11: bina token -> 401", async ({ request }) => {
    expect((await request.get("auth/me")).status()).toBe(401);
  });

  test("B12: ghalat/bana hua token -> 401", async ({ request }) => {
    const res = await request.get("auth/me", {
      headers: bearer("abc.def.ghi"),
    });
    expect(res.status()).toBe(401);
  });

  test("B13: token ke saath chhed-chhad (aakhri akshar badla) -> 401", async ({
    request,
  }) => {
    const token = await login(request, USERS.customer);
    const tampered = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    const res = await request.get("auth/me", { headers: bearer(tampered) });
    expect(res.status()).toBe(401);
  });

  test("B14: 'Bearer' ke baghair (sirf token) -> 401", async ({ request }) => {
    const token = await login(request, USERS.customer);
    const res = await request.get("auth/me", {
      headers: { Authorization: token },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("OTP aur password reset (sirf ghalat input)", () => {
  test("B15: ghalat OTP -> 400", async ({ request }) => {
    const res = await request.post("auth/verify-otp", {
      data: { email: USERS.customer.email, code: "000000" },
    });
    expect(res.status()).toBe(400);
  });

  test("B16: forgot-password na-maujood email par bhi wohi 200 jawab (email leak nahi hoti)", async ({
    request,
  }) => {
    const res = await request.post("auth/forgot-password", {
      data: { email: "nobody@nowhere.com" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).message).toContain("If an account exists");
  });

  test("B17: reset-password chhota password -> 400", async ({ request }) => {
    const res = await request.post("auth/reset-password", {
      data: { token: "abc", newPassword: "123" },
    });
    expect(res.status()).toBe(400);
  });

  test("B18: reset-password ghalat token -> 400", async ({ request }) => {
    const res = await request.post("auth/reset-password", {
      data: { token: "ghalat-token", newPassword: "Password123" },
    });
    expect(res.status()).toBe(400);
  });
});
