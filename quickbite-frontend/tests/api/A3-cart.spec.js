import { test, expect } from "@playwright/test";
import { USERS, bearer, login, findOrderableItem } from "./helpers";

const FAKE_ID = "507f1f77bcf86cd799439011"; // sahi format, magar database me nahi

let token, adminToken, item;
test.beforeAll(async ({ playwright }) => {
  const ctx = await playwright.request.newContext({
    baseURL: process.env.API_URL || "http://localhost:5001/api/",
  });
  token = await login(ctx, USERS.customer);
  adminToken = await login(ctx, USERS.admin);
  item = (await findOrderableItem(ctx)).item;
  await ctx.dispose();
});

test.beforeEach(async ({ request }) => {
  await request.delete("cart", { headers: bearer(token) }); // har test khali cart se shuru
});

const add = (request, body) =>
  request.post("cart/items", { headers: bearer(token), data: body });
const getCart = async (request) =>
  (await (await request.get("cart", { headers: bearer(token) })).json()).cart;

test("CT1: naye user ka cart khali hai", async ({ request }) => {
  const cart = await getCart(request);
  expect(cart.items).toEqual([]);
});

test("CT2: item add karna -> 201, quantity 1", async ({ request }) => {
  const res = await add(request, { menuItemId: item._id });
  expect(res.status()).toBe(201);
  const { cart } = await res.json();
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].quantity).toBe(1);
  expect(cart.items[0].menuItem._id).toBe(item._id);
});

test("CT3: wohi item dobara add karne par quantity jud jati hai (alag line nahi)", async ({
  request,
}) => {
  await add(request, { menuItemId: item._id, quantity: 1 });
  await add(request, { menuItemId: item._id, quantity: 2 });
  const cart = await getCart(request);
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].quantity).toBe(3);
});

test("CT4: menuItemId na ho -> 400", async ({ request }) => {
  expect((await add(request, {})).status()).toBe(400);
});

test("CT5: database me na-maujood item -> 404", async ({ request }) => {
  expect((await add(request, { menuItemId: FAKE_ID })).status()).toBe(404);
});

test("CT6: bekaar ID ('abc') par crash nahi, 404 aata hai", async ({
  request,
}) => {
  const res = await add(request, { menuItemId: "abc" });
  expect(res.status()).toBe(404);
  expect((await res.json()).message).toBe("Resource not found");
});

test("CT7: quantity 500 -> 99 par ruk jati hai", async ({ request }) => {
  await add(request, { menuItemId: item._id, quantity: 500 });
  expect((await getCart(request)).items[0].quantity).toBe(99);
});

test("CT8: manfi ya ghalat quantity (-5, 'abc') -> 1 ban jati hai", async ({
  request,
}) => {
  await add(request, { menuItemId: item._id, quantity: -5 });
  expect((await getCart(request)).items[0].quantity).toBe(1);
  await request.delete("cart", { headers: bearer(token) });
  await add(request, { menuItemId: item._id, quantity: "abc" });
  expect((await getCart(request)).items[0].quantity).toBe(1);
});

test("CT9: quantity update 1 -> 3", async ({ request }) => {
  await add(request, { menuItemId: item._id });
  const res = await request.patch(`cart/items/${item._id}`, {
    headers: bearer(token),
    data: { quantity: 3 },
  });
  expect(res.status()).toBe(200);
  expect((await getCart(request)).items[0].quantity).toBe(3);
});

test("CT10: quantity 0 karne se item hat jata hai", async ({ request }) => {
  await add(request, { menuItemId: item._id });
  await request.patch(`cart/items/${item._id}`, {
    headers: bearer(token),
    data: { quantity: 0 },
  });
  expect((await getCart(request)).items).toEqual([]);
});

test("CT11: quantity ke bajaye text bhejna -> 400", async ({ request }) => {
  await add(request, { menuItemId: item._id });
  const res = await request.patch(`cart/items/${item._id}`, {
    headers: bearer(token),
    data: { quantity: "abc" },
  });
  expect(res.status()).toBe(400);
});

test("CT12: cart me na-maujood item update karna -> 404", async ({
  request,
}) => {
  const res = await request.patch(`cart/items/${FAKE_ID}`, {
    headers: bearer(token),
    data: { quantity: 2 },
  });
  expect(res.status()).toBe(404);
});

test("CT13: item remove -> hat jata hai; dobara remove -> 404", async ({
  request,
}) => {
  await add(request, { menuItemId: item._id });
  expect(
    (
      await request.delete(`cart/items/${item._id}`, { headers: bearer(token) })
    ).status(),
  ).toBe(200);
  expect((await getCart(request)).items).toEqual([]);
  expect(
    (
      await request.delete(`cart/items/${item._id}`, { headers: bearer(token) })
    ).status(),
  ).toBe(404);
});

test("CT14: poora cart clear", async ({ request }) => {
  await add(request, { menuItemId: item._id, quantity: 2 });
  const res = await request.delete("cart", { headers: bearer(token) });
  expect(res.status()).toBe(200);
  expect((await getCart(request)).items).toEqual([]);
});

test("CT15: har user ka cart alag hai (admin ko customer ka item nahi dikhta)", async ({
  request,
}) => {
  await add(request, { menuItemId: item._id, quantity: 2 });
  const adminCart = (
    await (await request.get("cart", { headers: bearer(adminToken) })).json()
  ).cart;
  expect(
    adminCart.items.find(
      (i) => i.menuItem?._id === item._id && i.quantity === 2,
    ),
  ).toBeUndefined();
});

test("CT16: cart ke sab endpoints bina login band", async ({ request }) => {
  expect((await request.get("cart")).status()).toBe(401);
  expect(
    (
      await request.post("cart/items", { data: { menuItemId: item._id } })
    ).status(),
  ).toBe(401);
  expect((await request.delete("cart")).status()).toBe(401);
});
