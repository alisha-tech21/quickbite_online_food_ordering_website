import { test as base, expect } from "@playwright/test";

export const API = "http://localhost:5001/api/";

export const USERS = {
  admin: { email: "admin@quickbite.pk", password: "Admin@12345" },
  customer: { email: "sara.tariq@gmail.com", password: "Customer@123" },
};
export const ADDRESS = {
  label: "Home",
  line1: "House 1, Street 2",
  area: "Gulberg",
  city: "Lahore",
};

// ---------------------------------------------------------------------------
// SAFETY GUARD (har test par khud chalta hai):
// Agar frontend ne test backend (localhost:5001) ke ilawa kisi aur /api/ ko call kiya
// (jaise asli backend port 5000), to test FAIL ho jata hai.
// ---------------------------------------------------------------------------
export const test = base.extend({
  guard: [
    async ({ page }, use) => {
      const hits = [];
      page.on("request", (r) => {
        const u = new URL(r.url());
        if (u.pathname.startsWith("/api/")) hits.push(r.url());
      });
      await use();
      const bad = hits.filter(
        (u) => !u.startsWith("http://localhost:5001/api/"),
      );
      expect(
        bad,
        `SAFETY: frontend ne test backend (5001) ke ilawa yahan call kiya: ${bad[0]}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

const bearer = (t) => ({ Authorization: `Bearer ${t}` });

export async function apiLogin(request, user) {
  const res = await request.post(`${API}auth/login`, { data: user });
  expect(
    res.status(),
    `${user.email} login fail. Backend 5001 par chal raha hai? Seed hua?`,
  ).toBe(200);
  return (await res.json()).token;
}

export const apiClearCart = (request, token) =>
  request.delete(`${API}cart`, { headers: bearer(token) });

export async function apiMyOrders(request, token) {
  const res = await request.get(`${API}orders/mine`, {
    headers: bearer(token),
  });
  expect(res.status()).toBe(200);
  return (await res.json()).orders || [];
}

export async function apiAddToCart(request, token, menuItemId, quantity = 1) {
  const res = await request.post(`${API}cart/items`, {
    headers: bearer(token),
    data: { menuItemId, quantity },
  });
  expect(res.status()).toBe(201);
}

export async function apiPlaceOrder(request, token, item) {
  const res = await request.post(`${API}orders/checkout`, {
    headers: bearer(token),
    data: {
      items: [{ menuItemId: item._id, quantity: 1 }],
      paymentMethod: "cod",
      deliveryAddress: ADDRESS,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).orders[0];
}

// Order-able item (restaurant khula, item available)
export async function findOrderableItem(request) {
  const rest = await (await request.get(`${API}restaurants`)).json();
  const list = (rest.restaurants || []).filter(
    (r) => r.isOpen !== false && r.isActive !== false,
  );
  for (const r of list.slice(0, 8)) {
    const body = await (
      await request.get(`${API}menu-items?restaurantId=${r._id}`)
    ).json();
    const item = (body.items || []).find((i) => i.isAvailable !== false);
    if (item) return { restaurantId: r._id, restaurant: r, item };
  }
  throw new Error(
    "Koi order-able item nahi mila. Test database me seed chala hai?",
  );
}

// Browser ko "login hua hua" bana do (asli token daal kar)
export async function loginWithToken(page, token) {
  await page.addInitScript((t) => localStorage.setItem("qb_token", t), token);
}

// Asli login form bhar kar login
export async function loginViaUI(page, { email, password }) {
  await page.goto("/login");
  await page.getByPlaceholder("name@example.com").fill(email);
  await page.getByPlaceholder("Min. 8 characters").fill(password);
  await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
}
