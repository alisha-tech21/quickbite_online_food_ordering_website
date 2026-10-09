// Backend ke nakli jawab. Is se frontend akele test hota hai, DB ko haath bhi nahi lagta.

export const FAKE_USERS = {
  customer: {
    _id: "u1",
    fullName: "Sara Tariq",
    email: "sara@test.com",
    role: "customer",
  },
  admin: {
    _id: "u2",
    fullName: "Admin User",
    email: "admin@test.com",
    role: "admin",
  },
  manager: {
    _id: "u3",
    fullName: "Usman Manager",
    email: "m@test.com",
    role: "branch_manager",
  },
};

export const FAKE_RESTAURANTS = [
  {
    _id: "aaaaaaaaaaaaaaaaaaaaaaa1",
    name: "Burger Hub",
    cuisines: ["Burgers", "Fries"],
    rating: 4.5,
    deliveryFee: 0,
    deliveryTimeMin: 20,
    deliveryTimeMax: 30,
  },
  {
    _id: "aaaaaaaaaaaaaaaaaaaaaaa2",
    name: "Biryani House",
    cuisines: ["Biryani"],
    rating: 4.2,
    deliveryFee: 120,
    deliveryTimeMin: 30,
    deliveryTimeMax: 45,
  },
  {
    _id: "aaaaaaaaaaaaaaaaaaaaaaa3",
    name: "Pizza Corner",
    cuisines: ["Pizza"],
    rating: 4.8,
    deliveryFee: 99,
    deliveryTimeMin: 25,
    deliveryTimeMax: 35,
  },
];

const json = (route, status, body) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

/**
 * Har test ke shuru me call karein.
 * Pehle sab /api/ calls ko khali jawab dete hain, phir specific wale override karte hain.
 * (Playwright me baad me likha gaya route pehle chalta hai.)
 */
export async function mockBackend(page, opts = {}) {
  const { me = null, restaurants = FAKE_RESTAURANTS } = opts;

  // 1) Catch-all: koi bhi API jo humne mock nahi ki, khali success de do
  // DHYAN: "**/api/**" likhna ghalat hai, kyunke wo aapke apne code (/src/api/authApi.js) ko bhi pakad leta hai.
  // Isliye sirf wo URLs pakdte hain jinka path "/api/" se shuru hota hai (asli backend).
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    (route) =>
      json(route, 200, {
        success: true,
        data: [],
        restaurants: [],
        items: [],
        menuItems: [],
        reviews: [],
        orders: [],
        vouchers: [],
        total: 0,
      }),
  );

  // 2) Restaurants list (params ke sath ya bina, dono)
  await page.route(/\/api\/restaurants(\?.*)?$/, (route) =>
    json(route, 200, { success: true, restaurants, total: restaurants.length }),
  );

  // 3) /auth/me : token ke sath kaun user hai
  await page.route("**/api/auth/me", (route) =>
    me
      ? json(route, 200, { success: true, user: me })
      : json(route, 401, { success: false, message: "Not authorized" }),
  );
}

// Browser me "login hua hua" bana do (qb_token daal do)
export async function setFakeToken(page, token = "fake-token") {
  await page.addInitScript((t) => localStorage.setItem("qb_token", t), token);
}

// Login API ka nakli jawab
export async function mockLogin(
  page,
  {
    status = 200,
    user = FAKE_USERS.customer,
    message = "Invalid credentials",
  } = {},
) {
  await page.route("**/api/auth/login", (route) =>
    status === 200
      ? json(route, 200, { success: true, token: "fake-token", user })
      : json(route, status, { success: false, message }),
  );
}

// ---------------------------------------------------------------------------
// Cart ke liye STATEFUL mock: quantity badhane/ghatane/hatane par asli backend ki tarah
// state badalti hai. `state.items` ko test se bhi check kiya ja sakta hai.
// ---------------------------------------------------------------------------
export const RID = "aaaaaaaaaaaaaaaaaaaaaaa1"; // FAKE_RESTAURANTS[0]._id

export const makeCartItem = (id, name, price, quantity = 1) => ({
  _id: `ci-${id}`,
  quantity,
  restaurant: { _id: RID, name: "Burger Hub" },
  menuItem: {
    _id: id,
    name,
    price,
    description: `${name} desc`,
    category: "Burgers",
    restaurant: RID,
  },
});

export async function mockCart(page, initialItems = []) {
  const state = { items: [...initialItems], calls: [] };
  const cart = () => ({ success: true, cart: { items: state.items } });

  // Cart page restaurant aur settings bhi mangta hai
  await page.route("**/api/settings", (route) =>
    json(route, 200, {
      success: true,
      settings: {
        freeDeliveryAbove: 2000,
        packagingFee: 20,
        taxPercentage: 5,
        baseDeliveryFee: 100,
        paymentMethods: {
          cod: true,
          jazzcash: true,
          easypaisa: true,
          card: true,
        },
      },
    }),
  );
  await page.route(new RegExp(`/api/restaurants/${RID}(\\?.*)?$`), (route) =>
    json(route, 200, { success: true, restaurant: FAKE_RESTAURANTS[0] }),
  );

  await page.route(
    /\/api\/cart(\/items(\/[^/?]+)?)?(\?.*)?$/,
    async (route) => {
      const req = route.request();
      const method = req.method();
      const m = req.url().match(/\/items\/([^/?]+)/);
      const itemId = m?.[1];
      state.calls.push({ method, itemId, body: req.postDataJSON?.() });

      if (method === "GET") return json(route, 200, cart());
      if (method === "POST") {
        const { menuItemId, quantity } = req.postDataJSON();
        const found = state.items.find((i) => i.menuItem._id === menuItemId);
        if (found) found.quantity += quantity;
        else {
          const m = FAKE_MENU.find((x) => x._id === menuItemId) || {
            _id: menuItemId,
            name: "Item",
            price: 100,
          };
          state.items.push(makeCartItem(m._id, m.name, m.price, quantity));
        }
        return json(route, 200, cart());
      }
      if (method === "PATCH") {
        const { quantity } = req.postDataJSON();
        state.items = state.items.map((i) =>
          i.menuItem._id === itemId ? { ...i, quantity } : i,
        );
        return json(route, 200, cart());
      }
      if (method === "DELETE" && itemId) {
        state.items = state.items.filter((i) => i.menuItem._id !== itemId);
        return json(route, 200, cart());
      }
      if (method === "DELETE") {
        state.items = [];
        return json(route, 200, { success: true });
      }
      return json(route, 200, cart());
    },
  );
  return state;
}

// Koi bhi API ko fail karwane ke liye
export async function failApi(
  page,
  urlGlob,
  status = 500,
  message = "Server error",
) {
  await page.route(urlGlob, (route) =>
    json(route, status, { success: false, message }),
  );
}

// Restaurant detail page ke liye menu
export const FAKE_MENU = [
  {
    _id: "m1",
    name: "Zinger Burger",
    description: "Crispy chicken",
    category: "Burgers",
    price: 500,
    isAvailable: true,
    restaurant: RID,
  },
  {
    _id: "m2",
    name: "Beef Burger",
    description: "Juicy beef",
    category: "Burgers",
    price: 650,
    isAvailable: true,
    restaurant: RID,
  },
  {
    _id: "m3",
    name: "Cold Drink",
    description: "500ml",
    category: "Drinks",
    price: 120,
    isAvailable: true,
    restaurant: RID,
  },
];

export async function mockRestaurantPage(page, menu = FAKE_MENU) {
  await page.route(new RegExp(`/api/restaurants/${RID}(\\?.*)?$`), (route) =>
    json(route, 200, { success: true, restaurant: FAKE_RESTAURANTS[0] }),
  );
  await page.route(/\/api\/menu-items(\?.*)?$/, (route) =>
    json(route, 200, { success: true, items: menu, total: menu.length }),
  );
}
