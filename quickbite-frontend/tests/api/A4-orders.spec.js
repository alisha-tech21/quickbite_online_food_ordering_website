import { test, expect } from "@playwright/test";
import { USERS, ADDRESS, bearer, login, findOrderableItem } from "./helpers";

let customer, rider, found;
test.beforeAll(async ({ playwright }) => {
  const ctx = await playwright.request.newContext({
    baseURL: process.env.API_URL || "http://localhost:5001/api/",
  });
  customer = await login(ctx, USERS.customer);
  rider = await login(ctx, USERS.rider);
  found = await findOrderableItem(ctx);
  await ctx.dispose();
});

const checkout = (request, body, token = customer) =>
  request.post("orders/checkout", { headers: bearer(token), data: body });

const validBody = (over = {}) => ({
  items: [{ menuItemId: found.item._id, quantity: 2 }],
  paymentMethod: "cod",
  deliveryAddress: ADDRESS,
  ...over,
});

test.describe("Order ki validation", () => {
  test("OR1: bina login -> 401", async ({ request }) => {
    const res = await request.post("orders/checkout", { data: validBody() });
    expect(res.status()).toBe(401);
  });

  test("OR2: khali items -> 400 'Cart is empty'", async ({ request }) => {
    const res = await checkout(request, validBody({ items: [] }));
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe("Cart is empty");
  });

  test("OR3: items hi na hon -> 400", async ({ request }) => {
    const { items, ...rest } = validBody();
    expect((await checkout(request, rest)).status()).toBe(400);
  });

  test("OR4: payment method na ho -> 400", async ({ request }) => {
    const { paymentMethod, ...rest } = validBody();
    const res = await checkout(request, rest);
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe("Invalid payment method");
  });

  test("OR5: ghalat payment method ('bitcoin') -> 400", async ({ request }) => {
    expect(
      (
        await checkout(request, validBody({ paymentMethod: "bitcoin" }))
      ).status(),
    ).toBe(400);
  });

  test("OR6: address na ho -> 400", async ({ request }) => {
    const res = await checkout(request, validBody({ deliveryAddress: {} }));
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBe("Delivery address is required");
  });

  test("OR7: item ki ID na ho -> 400", async ({ request }) => {
    const res = await checkout(
      request,
      validBody({ items: [{ quantity: 1 }] }),
    );
    expect(res.status()).toBe(400);
  });

  test("OR8: database me na-maujood item -> 400", async ({ request }) => {
    const res = await checkout(
      request,
      validBody({
        items: [{ menuItemId: "507f1f77bcf86cd799439011", quantity: 1 }],
      }),
    );
    expect(res.status()).toBe(400);
  });

  test("OR9: ghalat voucher code -> 4xx (server crash nahi)", async ({
    request,
  }) => {
    const res = await checkout(
      request,
      validBody({ voucherCode: "NOT-A-REAL-CODE" }),
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("Order banana, dekhna, cancel karna", () => {
  let orderId;

  test("OR10: sahi COD order -> 201, rakam database ki price se bani", async ({
    request,
  }) => {
    const res = await checkout(request, validBody());
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    const order = body.orders[0];
    orderId = order._id;
    expect(order.status).toBe("confirmed");
    expect(order.paymentMethod).toBe("cod");
    expect(order.itemsSubtotal).toBe(found.item.price * 2);
    expect(order.totalAmount).toBeGreaterThanOrEqual(order.itemsSubtotal);
  });

  test("OR11: client ki bheji hui qeemat (price/unitPrice = 1) ignore hoti hai", async ({
    request,
  }) => {
    const res = await checkout(
      request,
      validBody({
        items: [
          { menuItemId: found.item._id, quantity: 1, price: 1, unitPrice: 1 },
        ],
        totalAmount: 1,
      }),
    );
    expect(res.status()).toBe(201);
    const order = (await res.json()).orders[0];
    expect(order.itemsSubtotal).toBe(found.item.price);
    expect(order.totalAmount).not.toBe(1);
  });

  test("OR12: naya order /orders/mine me nazar aata hai", async ({
    request,
  }) => {
    test.skip(!orderId, "OR10 ne order nahi banaya");
    const res = await request.get("orders/mine", { headers: bearer(customer) });
    expect(res.status()).toBe(200);
    const { orders } = await res.json();
    expect(orders.some((o) => o._id === orderId)).toBe(true);
  });

  test("OR13: malik apna order dekh sakta hai", async ({ request }) => {
    test.skip(!orderId, "OR10 ne order nahi banaya");
    const res = await request.get(`orders/${orderId}`, {
      headers: bearer(customer),
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).order._id).toBe(orderId);
  });

  test("OR14: na-maujood order -> 404", async ({ request }) => {
    const res = await request.get("orders/507f1f77bcf86cd799439011", {
      headers: bearer(customer),
    });
    expect(res.status()).toBe(404);
  });

  test("OR15: dusra banda (rider) customer ka order cancel nahi kar sakta -> 403", async ({
    request,
  }) => {
    test.skip(!orderId, "OR10 ne order nahi banaya");
    const res = await request.patch(`orders/${orderId}/cancel`, {
      headers: bearer(rider),
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test("OR16: malik apna order cancel kar sakta hai", async ({ request }) => {
    test.skip(!orderId, "OR10 ne order nahi banaya");
    const res = await request.patch(`orders/${orderId}/cancel`, {
      headers: bearer(customer),
      data: { reason: "Test" },
    });
    expect(res.status()).toBe(200);
    const view = await (
      await request.get(`orders/${orderId}`, { headers: bearer(customer) })
    ).json();
    expect(view.order.status).toBe("cancelled");
  });

  test("OR17: cancel hua order dobara cancel nahi hota -> 400", async ({
    request,
  }) => {
    test.skip(!orderId, "OR10 ne order nahi banaya");
    const res = await request.patch(`orders/${orderId}/cancel`, {
      headers: bearer(customer),
      data: {},
    });
    expect(res.status()).toBe(400);
  });
});
