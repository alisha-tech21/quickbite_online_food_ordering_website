import { test, expect } from "@playwright/test";
import { USERS, ADDRESS, bearer, login, findOrderableItem } from "./helpers";

// NOTE: SG4 rate limit ko khatam kar deta hai (15 min tak login 429 dega), isliye SG6 (jo login karta hai)
// SG4 se PEHLE rakha gaya hai. S1 dobara chalane se pehle backend restart karein (nodemon me "rs" likhein).
// ---------------------------------------------------------------------------
// Ye tests aapke backend ki MUMKINA kamzoriyan dhoondhte hain (code padh kar likhe gaye).
// Agar koi test FAIL ho to wo "asli masla" hai jise theek karna chahiye, test ki ghalti nahi.
// Pass hone ka matlab: aapka backend us hamle se mehfooz hai.
// ---------------------------------------------------------------------------

test("SG1: NoSQL injection - login me email ki jagah {$ne:null} bhejne se login nahi hona chahiye", async ({
  request,
}) => {
  for (const u of Object.values(USERS)) {
    const res = await request.post("auth/login", {
      data: { email: { $ne: null }, password: u.password },
    });
    expect(
      res.status(),
      `Injection se login ho gaya! (password: ${u.role} wala)`,
    ).not.toBe(200);
  }
});

test("SG2: login me password na ho to server crash (500) nahi karna chahiye", async ({
  request,
}) => {
  const res = await request.post("auth/login", {
    data: { email: USERS.customer.email },
  });
  expect(
    res.status(),
    "password ke baghair login par 500 aaya, 400/401 aana chahiye",
  ).toBeLessThan(500);
});

test("SG3: khali body se login par 500 nahi aana chahiye", async ({
  request,
}) => {
  const res = await request.post("auth/login", { data: {} });
  expect(res.status()).toBeLessThan(500);
});

test("SG6: manfi tip se order ki rakam kam nahi honi chahiye", async ({
  request,
}) => {
  const token = await login(request, USERS.customer);
  const { item } = await findOrderableItem(request);
  const res = await request.post("orders/checkout", {
    headers: bearer(token),
    data: {
      items: [{ menuItemId: item._id, quantity: 1 }],
      paymentMethod: "cod",
      deliveryAddress: ADDRESS,
      tipAmount: -500,
    },
  });
  if (res.status() === 201) {
    const order = (await res.json()).orders[0];
    // order cancel kar do taake test database saaf rahe
    await request.patch(`orders/${order._id}/cancel`, {
      headers: bearer(token),
      data: {},
    });
    expect(
      order.totalAmount,
      `manfi tip (-500) accept ho gayi, total ${order.totalAmount} (subtotal ${order.itemsSubtotal})`,
    ).toBeGreaterThanOrEqual(order.itemsSubtotal);
  } else {
    expect(res.status()).toBe(400);
  }
});

test("SG4: bar bar ghalat password par rate limit (429) lagna chahiye (brute force se bachao)", async ({
  request,
}) => {
  const statuses = [];
  for (let i = 0; i < 15; i++) {
    const res = await request.post("auth/login", {
      data: { email: USERS.customer.email, password: `Wrong${i}Pass` },
    });
    statuses.push(res.status());
  }
  expect(
    statuses,
    `15 ghalat koshishon ke status: ${[...new Set(statuses)].join(",")}`,
  ).toContain(429);
});

test("SG5: 6-digit OTP par bar bar andaza lagane se rok (429) honi chahiye", async ({
  request,
}) => {
  const statuses = [];
  for (let i = 0; i < 20; i++) {
    const res = await request.post("auth/verify-otp", {
      data: { email: USERS.customer.email, code: String(100000 + i) },
    });
    statuses.push(res.status());
  }
  expect(
    statuses,
    `20 ghalat OTP ke status: ${[...new Set(statuses)].join(",")}`,
  ).toContain(429);
});

test("SG7: error jawab me 'stack' (code ki tafseel) nahi aani chahiye", async ({
  request,
}) => {
  const res = await request.get("yeh-route-nahi-hai");
  const body = await res.json();
  expect(
    body.stack,
    "Error ke jawab me stack trace dikh raha hai. Production me NODE_ENV=production hona chahiye.",
  ).toBeUndefined();
});

test("SG8: suspended user ko 403 milna chahiye, 401 'token invalid' nahi (nazar-e-sani ke liye)", async ({
  request,
}) => {
  test.skip(
    true,
    "Is ke liye suspended user chahiye. Baad me admin API se banaya jayega.",
  );
});
