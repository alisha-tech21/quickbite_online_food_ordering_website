import { expect } from "@playwright/test";

// Seed data (npm run seed) ke users
export const USERS = {
  admin: {
    email: "admin@quickbite.pk",
    password: "Admin@12345",
    role: "admin",
  },
  manager: {
    email: "usman.ops@quickbite.pk",
    password: "Manager@123",
    role: "branch_manager",
  },
  rider: {
    email: "tariq.rider@quickbite.pk",
    password: "Rider@12345",
    role: "rider",
  },
  customer: {
    email: "sara.tariq@gmail.com",
    password: "Customer@123",
    role: "customer",
  },
};

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// Login karke token wapas deta hai
export async function login(request, user) {
  const res = await request.post("auth/login", {
    data: { email: user.email, password: user.password },
  });
  expect(
    res.status(),
    `${user.email} login fail hua. Kya seed chala tha?`,
  ).toBe(200);
  return (await res.json()).token;
}

export const ADDRESS = {
  label: "Home",
  line1: "House 1, Street 2",
  area: "Gulberg",
  city: "Lahore",
};

// Ek aisa menu item dhoondhta hai jis par order ho sake (restaurant khula aur item available)
export async function findOrderableItem(request) {
  const rest = await (await request.get("restaurants")).json();
  const list = (rest.restaurants || []).filter(
    (r) => r.isOpen !== false && r.isActive !== false,
  );
  for (const r of list.slice(0, 8)) {
    const res = await request.get(`menu-items?restaurantId=${r._id}`);
    const body = await res.json();
    const item = (body.items || []).find((i) => i.isAvailable !== false);
    if (item) return { restaurantId: r._id, item };
  }
  throw new Error(
    "Koi order-able menu item nahi mila. Kya test database me seed chala hai?",
  );
}
