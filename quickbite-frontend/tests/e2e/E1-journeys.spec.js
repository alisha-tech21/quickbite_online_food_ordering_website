import {
  test,
  expect,
  USERS,
  API,
  apiLogin,
  apiClearCart,
  apiMyOrders,
  apiAddToCart,
  apiPlaceOrder,
  findOrderableItem,
  loginWithToken,
  loginViaUI,
} from "./fixtures";

// Pehle check: test backend chal raha hai?
test.beforeAll(async ({ request }) => {
  const res = await request.get(`${API}health`).catch(() => null);
  if (!res || res.status() !== 200)
    throw new Error(
      "Test backend (localhost:5001) nahi chal raha. Terminal 1 check karein.",
    );
});

test.describe("Login (asli frontend + asli backend)", () => {
  test("E1: customer sahi password se login -> home, token save", async ({
    page,
  }) => {
    await loginViaUI(page, USERS.customer);
    await expect(page).toHaveURL("/");
    expect(
      await page.evaluate(() => localStorage.getItem("qb_token")),
    ).toBeTruthy();
  });

  test("E2: ghalat password -> error dikhta hai, login page par hi rehta hai", async ({
    page,
  }) => {
    await loginViaUI(page, {
      email: USERS.customer.email,
      password: "WrongPass123",
    });
    await expect(
      page.getByText("Invalid email or password. Please try again."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("E3: admin login -> /admin khulta hai", async ({ page }) => {
    await loginViaUI(page, USERS.admin);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("E4: customer /admin kholne ki koshish -> home par wapas (asli role check)", async ({
    page,
    request,
  }) => {
    await loginWithToken(page, await apiLogin(request, USERS.customer));
    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("E5: bina login /my-orders -> /login, phir login ke baad wapas /my-orders", async ({
    page,
  }) => {
    await page.goto("/my-orders");
    await expect(page).toHaveURL(/\/login/);
    await page.getByPlaceholder("name@example.com").fill(USERS.customer.email);
    await page
      .getByPlaceholder("Min. 8 characters")
      .fill(USERS.customer.password);
    await page.getByRole("button", { name: /Sign In to QuickBite/i }).click();
    await expect(page).toHaveURL(/\/my-orders/);
  });

  test("E6: ghalat token (asli backend 401 deta hai) -> logout aur /login", async ({
    page,
  }) => {
    await loginWithToken(page, "garbage.token.value");
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login/);
    expect(
      await page.evaluate(() => localStorage.getItem("qb_token")),
    ).toBeNull();
  });
});

test.describe("Restaurants (asli database ka data)", () => {
  test("E7: database ka pehla restaurant screen par dikhta hai", async ({
    page,
    request,
  }) => {
    const { restaurants } = await (
      await request.get(`${API}restaurants`)
    ).json();
    expect(restaurants.length).toBeGreaterThan(0);
    await page.goto("/restaurants");
    await expect(
      page.getByRole("heading", { name: restaurants[0].name }),
    ).toBeVisible();
  });

  test("E8: live search asli backend se filter karta hai", async ({
    page,
    request,
  }) => {
    const { restaurants } = await (
      await request.get(`${API}restaurants`)
    ).json();
    await page.goto("/restaurants");
    const box = page.getByPlaceholder("Gulberg specialty kitchens...");

    await box.fill(restaurants[0].name);
    await expect(
      page.getByRole("heading", { name: restaurants[0].name }),
    ).toBeVisible();

    await box.fill("zzzzqqqq-koi-nahi");
    await expect(
      page.getByText("No restaurants found matching your filters."),
    ).toBeVisible();
  });

  test("E9: 'View Menu' asli menu items dikhata hai", async ({
    page,
    request,
  }) => {
    const { restaurantId, item } = await findOrderableItem(request);
    await page.goto(`/restaurants/${restaurantId}`);
    await expect(page.getByText(item.name).first()).toBeVisible();
  });
});

test.describe("Cart aur Order (poora safar)", () => {
  test("E10: server par rakha cart /cart page par nazar aata hai", async ({
    page,
    request,
  }) => {
    const token = await apiLogin(request, USERS.customer);
    await apiClearCart(request, token);
    const { item } = await findOrderableItem(request);
    await apiAddToCart(request, token, item._id, 2);

    await loginWithToken(page, token);
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your Shopping Cart" }),
    ).toBeVisible();
    await expect(page.getByText(item.name).first()).toBeVisible();
    await apiClearCart(request, token);
  });

  test("E11: PURA ORDER: menu -> Add -> cart -> payment -> order -> My Orders (aur database me check)", async ({
    page,
    request,
  }) => {
    const token = await apiLogin(request, USERS.customer);
    await apiClearCart(request, token);
    const { restaurantId } = await findOrderableItem(request);
    const before = await apiMyOrders(request, token);

    await loginWithToken(page, token);

    // 1) Menu se item add karna
    await page.goto(`/restaurants/${restaurantId}`);
    await page
      .getByRole("button", { name: "Add", exact: true, disabled: false })
      .first()
      .click();
    await page.getByRole("button", { name: /Add to Cart/ }).click();

    // 2) Cart
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your Shopping Cart" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Proceed to Payment/ }).click();

    // 3) Payment: Cash on Delivery
    const cod = page.locator('input[name="paymentMethodModal"][value="cod"]');
    if (await cod.count()) await cod.check();
    await page.getByRole("button", { name: /Place Order/ }).click();

    // 4) Kamyabi ka message aur My Orders
    await expect(page.getByText("Your Order is Placed!")).toBeVisible();
    await page.getByRole("button", { name: /View My Orders/ }).click();
    await expect(page).toHaveURL(/\/my-orders/);

    // 5) Database me exactly 1 naya order bana
    const after = await apiMyOrders(request, token);
    const created = after.filter((o) => !before.some((b) => b._id === o._id));
    expect(created, "exactly 1 naya order banna chahiye").toHaveLength(1);
    expect(created[0].status).toBe("confirmed");
    expect(created[0].paymentMethod).toBe("cod");

    // 6) Wohi order screen par bhi dikhta hai
    await expect(
      page
        .getByText(new RegExp(`Order #QB-${created[0].customerOrderNumber}\\b`))
        .first(),
    ).toBeVisible();

    // 7) Cart khali ho gaya
    const cart = (
      await (
        await request.get(`${API}cart`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json()
    ).cart;
    expect(cart.items).toEqual([]);
  });

  test("E12: My Orders se order cancel -> database me 'cancelled'", async ({
    page,
    request,
  }) => {
    const token = await apiLogin(request, USERS.customer);
    const { item } = await findOrderableItem(request);
    await apiPlaceOrder(request, token, item); // taake koi cancel-able order zaroor ho
    const before = await apiMyOrders(request, token);
    const confirmedBefore = before
      .filter((o) => o.status === "confirmed")
      .map((o) => o._id);
    expect(confirmedBefore.length).toBeGreaterThan(0);

    await loginWithToken(page, token);
    await page.goto("/my-orders");
    await page
      .getByRole("button", { name: "Cancel", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Cancel Order", exact: true })
      .click();
    await expect(page.getByText("Order cancelled successfully")).toBeVisible();

    const after = await apiMyOrders(request, token);
    const nowCancelled = after.filter(
      (o) => confirmedBefore.includes(o._id) && o.status === "cancelled",
    );
    expect(nowCancelled, "exactly 1 order cancel hona chahiye").toHaveLength(1);
  });
});
