import { test, expect } from "@playwright/test";
import {
  mockBackend,
  mockCart,
  mockRestaurantPage,
  setFakeToken,
  makeCartItem,
  failApi,
  FAKE_USERS,
  RID,
} from "../mocks";

const plusBtn = (page) =>
  page
    .locator("button")
    .filter({ has: page.locator("svg.lucide-plus") })
    .first();
const minusBtn = (page) =>
  page
    .locator("button")
    .filter({ has: page.locator("svg.lucide-minus") })
    .first();
const trashBtn = (page) =>
  page
    .locator("button")
    .filter({ has: page.locator("svg.lucide-trash-2") })
    .first();

async function loggedIn(page) {
  await mockBackend(page, { me: FAKE_USERS.customer });
  await setFakeToken(page);
}

// ----------------------------- Menu page ----------------------------------
test.describe("Restaurant menu page", () => {
  test("C1: menu items naam aur price ke sath dikhte hain", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page);
    await mockRestaurantPage(page);
    await page.goto(`/restaurants/${RID}`);
    await expect(page.getByText("Zinger Burger").first()).toBeVisible();
    await expect(page.getByText("Rs. 500").first()).toBeVisible();
  });

  test("C2: login ke baghair 'Add' dabane par /login khulta hai", async ({
    page,
  }) => {
    await mockBackend(page); // koi user nahi
    await mockRestaurantPage(page);
    await page.goto(`/restaurants/${RID}`);
    await page
      .getByRole("button", { name: "Add", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("C3: menu ki search me dish dhoondhna", async ({ page }) => {
    await loggedIn(page);
    await mockCart(page);
    await mockRestaurantPage(page);
    await page.goto(`/restaurants/${RID}`);
    const search = page.getByPlaceholder("Search dishes in menu...");
    await search.fill("Cold");
    await expect(page.getByText("Cold Drink").first()).toBeVisible();
    await expect(page.getByText("Zinger Burger")).toHaveCount(0);
  });

  test("C4: search me kuch na milne par Zinger Burger gayab, crash nahi", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page);
    await mockRestaurantPage(page);
    await page.goto(`/restaurants/${RID}`);
    await page.getByPlaceholder("Search dishes in menu...").fill("zzzzzz");
    await expect(page.getByText("Zinger Burger")).toHaveCount(0);
    await expect(
      page.getByPlaceholder("Search dishes in menu..."),
    ).toBeVisible();
  });

  test("C5: menu khali ho to 'Menu not available' dikhta hai", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page);
    await mockRestaurantPage(page, []);
    await page.goto(`/restaurants/${RID}`);
    await expect(page.getByText("Menu not available")).toBeVisible();
  });

  test("C6: Add -> modal -> 'Add to Cart' par sahi item server ko jata hai", async ({
    page,
  }) => {
    await loggedIn(page);
    const cart = await mockCart(page);
    await mockRestaurantPage(page);
    await page.goto(`/restaurants/${RID}`);
    await page
      .getByRole("button", { name: "Add", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: /Add to Cart • Rs\. 500/ }).click();
    await expect
      .poll(() => cart.calls.some((c) => c.method === "POST"))
      .toBe(true);
    const post = cart.calls.find((c) => c.method === "POST");
    expect(post.body).toMatchObject({ menuItemId: "m1", quantity: 1 });
  });
});

// ------------------------------ Cart page ---------------------------------
test.describe("Cart page", () => {
  test("K1: khali cart ka message aur 'Browse Restaurants' link", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page, []);
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Browse Restaurants" }).click();
    await expect(page).toHaveURL(/\/restaurants/);
  });

  test("K2: items, quantity aur total sahi dikhte hain (500 x 2 = 1,000)", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page, [makeCartItem("m1", "Zinger Burger", 500, 2)]);
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your Shopping Cart" }),
    ).toBeVisible();
    await expect(page.getByText("Zinger Burger").first()).toBeVisible();
    await expect(page.getByText("Rs. 1,000").first()).toBeVisible();
    await expect(
      page.getByText(/1 restaurant • 1 item selected/),
    ).toBeVisible();
  });

  test("K3: 2 alag items ka count '2 items selected'", async ({ page }) => {
    await loggedIn(page);
    await mockCart(page, [
      makeCartItem("m1", "Zinger Burger", 500, 1),
      makeCartItem("m3", "Cold Drink", 120, 1),
    ]);
    await page.goto("/cart");
    await expect(page.getByText(/2 items selected/)).toBeVisible();
  });

  test("K4: '+' dabane par quantity 1 -> 2 (server ko PATCH jata hai) aur total update", async ({
    page,
  }) => {
    await loggedIn(page);
    const cart = await mockCart(page, [
      makeCartItem("m1", "Zinger Burger", 500, 1),
    ]);
    await page.goto("/cart");
    await plusBtn(page).click();
    await expect
      .poll(() => cart.calls.find((c) => c.method === "PATCH")?.body)
      .toEqual({ quantity: 2 });
    await expect(page.getByText("Rs. 1,000").first()).toBeVisible();
  });

  test("K5: '-' dabane par quantity 3 -> 2", async ({ page }) => {
    await loggedIn(page);
    const cart = await mockCart(page, [
      makeCartItem("m1", "Zinger Burger", 500, 3),
    ]);
    await page.goto("/cart");
    await minusBtn(page).click();
    await expect
      .poll(() => cart.calls.find((c) => c.method === "PATCH")?.body)
      .toEqual({ quantity: 2 });
  });

  test("K6: quantity 1 par '-' dabane se item hat jata hai (cart khali)", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page, [makeCartItem("m1", "Zinger Burger", 500, 1)]);
    await page.goto("/cart");
    await minusBtn(page).click();
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });

  test("K7: kachre (trash) button se sirf wohi item hatta hai", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page, [
      makeCartItem("m1", "Zinger Burger", 500, 1),
      makeCartItem("m3", "Cold Drink", 120, 1),
    ]);
    await page.goto("/cart");
    await trashBtn(page).click();
    await expect(page.getByText("Zinger Burger")).toHaveCount(0);
    await expect(page.getByText("Cold Drink").first()).toBeVisible();
  });

  test("K8: 'Clear All' se poora cart khali", async ({ page }) => {
    await loggedIn(page);
    await mockCart(page, [
      makeCartItem("m1", "Zinger Burger", 500, 1),
      makeCartItem("m3", "Cold Drink", 120, 1),
    ]);
    await page.goto("/cart");
    await page.getByRole("button", { name: "Clear All" }).click();
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });

  test("K9: quantity update fail (500) hone par purani quantity rehti hai aur error dikhta hai", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page, [makeCartItem("m1", "Zinger Burger", 500, 1)]);
    await failApi(
      page,
      "**/api/cart/items/m1",
      500,
      "Unable to update quantity",
    );
    await page.goto("/cart");
    await plusBtn(page).click();
    await expect(page.getByText("Unable to update quantity")).toBeVisible();
    await expect(page.getByText("Rs. 500").first()).toBeVisible();
  });

  test("K10: cart load fail (500) par page crash nahi hota", async ({
    page,
  }) => {
    await loggedIn(page);
    await failApi(page, "**/api/cart", 500);
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });
});

// ----------------------------- Checkout -----------------------------------
test.describe("Checkout guards", () => {
  test("K11: bina login /checkout -> /login", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/);
  });

  test("K12: login hai magar cart khali -> checkout par khali-cart screen / cart par redirect", async ({
    page,
  }) => {
    await loggedIn(page);
    await mockCart(page, []);
    await page.goto("/checkout");
    await expect(
      page
        .getByRole("link", { name: /Browse Restaurants|restaurants/i })
        .first(),
    ).toBeVisible();
  });
});
