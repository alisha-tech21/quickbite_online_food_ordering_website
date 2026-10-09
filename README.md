# 🍔 QuickBite — Online Food Ordering Platform

**Discover restaurants. Explore menus. Order your favorite food.**

QuickBite is a full-stack food ordering web application that connects customers with restaurants through an intuitive interface. Customers can explore food options, manage their carts, and place orders, while administrators can manage key operations through a dedicated dashboard.

---

## ✨ Key Features

### 👤 Customer Experience

* **Explore Restaurants** — Browse restaurants, search by name, and use available filters to find food.
* **Browse Menus** — View food items, prices, descriptions, and available customization options.
* **Search Food** — Find restaurants and menu items using search functionality.
* **Manage Cart** — Add items, update quantities, remove products, and review order totals.
* **Place Orders** — Proceed through checkout and place orders using available checkout options.
* **My Orders** — View order history, check order status, and cancel eligible orders.
* **Offers & Vouchers** — Explore promotions and available deals.
* **Account Management** — Register, log in, access protected pages, and use password recovery features.

### 🛠️ Admin Dashboard

* **Dashboard Overview** — View available operational summaries and order statistics.
* **Order Management** — View orders and manage order statuses.
* **User Management** — Access administrative user-management functionality.
* **Restaurant & Menu Management** — Manage restaurant information and food menu items through supported admin features.
* **Voucher Management** — Manage promotional vouchers.
* **Review Management** — Access review-management functionality.
* **System Settings** — Configure supported application and payment-method settings.

### 🔐 Security & User Roles

* JWT-based authentication.
* Protected routes and role-based authorization.
* Backend validation for important operations.
* Server-side order-price calculations.
* Login and OTP rate limiting.

---

## 🔄 How QuickBite Works

1. **Discover:** Customers explore restaurants and food categories.
2. **Select:** They open a restaurant, browse its menu, and select food items.
3. **Add to Cart:** They manage quantities and review their selected items.
4. **Checkout:** They submit their order using an available checkout method.
5. **Manage Orders:** They visit *My Orders* to view and manage eligible orders.
6. **Admin Operations:** Administrators use the dashboard to manage orders and other supported platform operations.

---

## 💳 Payment Integration

QuickBite currently supports **Cash on Delivery (COD)** in the tested checkout workflow.

Live online payment gateway integration is **not implemented yet**. JazzCash, EasyPaisa, and debit/credit card payments are planned as potential future enhancements.

---

## 🧰 Technology Stack

| Frontend       | Backend            |
| -------------- | ------------------ |
| React 19       | Node.js            |
| Vite           | Express.js         |
| Tailwind CSS 4 | MongoDB            |
| React Router 7 | Mongoose           |
| Axios          | JWT Authentication |

**Additional technologies:** Nodemailer, Cloudinary, Playwright, and Chromium.

---

## 🧪 Automated Testing

QuickBite was tested using Playwright across frontend, backend API, security, and end-to-end scenarios.

| Test Suite  |   Tests | Result           |
| ----------- | ------: | ---------------- |
| Frontend    |     161 | ✅ All Passed     |
| Backend API |      78 | ✅ All Passed     |
| Security    |       8 | ✅ All Passed     |
| End-to-End  |      12 | ✅ All Passed     |
| **Total**   | **259** | **✅ 259 Passed** |

Testing covered authentication, role-based access, restaurant search, cart operations, order processing, responsive layouts, and security validation.


---


---

## 🔮 Future Enhancements

* Online payment gateway integration.
* Expanded order tracking and delivery workflows.
* Additional accessibility and security improvements.
* Broader automated testing and production optimization.

---

<p align="center">
  <strong>QuickBite 🍔 — A smarter way to order food.</strong>
</p>
