# QuickBite — Backend API

A complete Node.js / Express / MongoDB backend for the QuickBite online food
ordering platform, built to match the Stitch-designed frontend screens
exactly (customer app + admin portal).

## Tech stack

- **Runtime:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (access token) + bcrypt password hashing + OTP phone verification
- **Architecture:** MVC — `models/`, `controllers/`, `routes/`, `middleware/`

---

## 1. Setup

```bash
cd quickbite-backend
npm install
cp .env.example .env
# edit .env — at minimum set MONGO_URI and JWT_SECRET
```

You need a running MongoDB instance. Options:

- Local: install MongoDB Community Server, default URI `mongodb://127.0.0.1:27017/quickbite` works out of the box.
- Cloud: create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and paste its connection string into `MONGO_URI`.

```bash
npm run seed     # populates sample restaurants, menu items, vouchers, and 4 test accounts
npm run dev      # starts the API with nodemon (auto-restart on file changes)
# or: npm start  # production start
```

The API boots on `http://localhost:5000` by default. Confirm it's alive:

```bash
curl http://localhost:5000/api/health
```

### Seeded test accounts (after `npm run seed`)

| Role           | Email                    | Password     |
| -------------- | ------------------------ | ------------ |
| Admin          | admin@quickbite.pk       | Admin@12345  |
| Branch Manager | usman.ops@quickbite.pk   | Manager@123  |
| Rider          | tariq.rider@quickbite.pk | Rider@12345  |
| Customer       | sara.tariq@gmail.com     | Customer@123 |

---

## 2. Project structure

```
quickbite-backend/
├── config/db.js              # MongoDB connection
├── models/                   # Mongoose schemas
│   ├── User.js                 (customer / rider / kitchen_staff / branch_manager / admin)
│   ├── Otp.js
│   ├── Restaurant.js
│   ├── MenuItem.js
│   ├── Order.js
│   ├── Voucher.js
│   ├── Review.js
│   └── Settings.js             (singleton — store config)
├── controllers/               # Business logic, one file per resource
├── routes/                    # Express routers, mounted in server.js
├── middleware/
│   ├── authMiddleware.js       (protect + role-based authorize)
│   └── errorMiddleware.js      (404 + centralized error formatting)
├── utils/
│   ├── generateToken.js
│   └── notify.js               (mocked SMS/WhatsApp/email — swap for a real provider)
├── seed/seed.js
└── server.js                  # entry point
```

---

## 3. Authentication model

Every protected route expects:

```
Authorization: Bearer <JWT token>
```

Tokens are returned from `/api/auth/verify-otp` (after registration) and
`/api/auth/login`. The token encodes `{ id, role }`; `middleware/authMiddleware.js`
verifies it and loads the current user onto `req.user`.

Role-based access uses `authorize('admin', 'branch_manager')` on top of `protect`
in the route files — change the allowed-roles list there if you need to adjust
who can hit a given admin endpoint.

**Register → OTP (email) → active account** flow: a new user starts with
`status: 'pending'` and `isEmailVerified: false`; they cannot log in until
`/api/auth/verify-otp` succeeds with the code sent to their email. Admin-created
staff (via `/api/admin/users`) skip this step since the admin is vouching for them.

---

## 4. Full API reference

### Auth — `/api/auth`

| Method | Endpoint           | Access  | Screen                              |
| ------ | ------------------ | ------- | ----------------------------------- |
| POST   | `/register`        | Public  | Register                            |
| POST   | `/verify-otp`      | Public  | Verify Your Email (OTP)             |
| POST   | `/resend-otp`      | Public  | "Resend code"                       |
| POST   | `/login`           | Public  | Sign In                             |
| POST   | `/forgot-password` | Public  | Forgot Your Password?               |
| POST   | `/reset-password`  | Public  | (reset link / SMS code target page) |
| GET    | `/me`              | Private | —                                   |

### Users (customer self-service) — `/api/users`

| Method | Endpoint                   | Access  |
| ------ | -------------------------- | ------- |
| PUT    | `/me`                      | Private |
| POST   | `/me/addresses`            | Private |
| PUT    | `/me/addresses/:addressId` | Private |
| DELETE | `/me/addresses/:addressId` | Private |

### Restaurants (public) — `/api/restaurants`

| Method | Endpoint                                                                                                        | Screen                                |
| ------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| GET    | `/?search=&cuisine=&priceCategory=&maxDeliveryTime=&minRating=&freeDeliveryOnly=&openNow=&sortBy=&page=&limit=` | Restaurants listing + sidebar filters |
| GET    | `/:id`                                                                                                          | Restaurant detail page                |
| GET    | `/:id/reviews`                                                                                                  | "What Our Community Says"             |

### Vouchers/Offers (public + customer) — `/api/vouchers`

| Method | Endpoint           | Screen                   |
| ------ | ------------------ | ------------------------ |
| GET    | `/active`          | Exclusive Offers & Deals |
| POST   | `/apply` (Private) | "Apply" button on Cart   |

### Orders (customer) — `/api/orders`

| Method | Endpoint                                      | Screen                           |
| ------ | --------------------------------------------- | -------------------------------- |
| POST   | `/`                                           | Checkout — "Confirm & Pay"       |
| GET    | `/mine?tab=all\|active\|delivered\|cancelled` | My Orders & History              |
| GET    | `/:id`                                        | Order tracking / detail          |
| PATCH  | `/:id/cancel`                                 | Cancel order                     |
| POST   | `/:id/review`                                 | Star rating on a delivered order |

### Settings (public read) — `/api/settings`

| Method | Endpoint                                                            |
| ------ | ------------------------------------------------------------------- |
| GET    | `/` (delivery fee / free-delivery threshold, needed by checkout UI) |

### Admin — `/api/admin` (all require `Authorization` header; role-gated per route)

**Dashboard**
| Method | Endpoint | Screen |
|---|---|---|
| GET | `/dashboard?range=today\|week\|month` | Dashboard Overview |

**Users & Staff**
| Method | Endpoint | Screen |
|---|---|---|
| GET | `/users/stats` | Summary cards |
| GET | `/users?role=&status=&search=&page=&limit=` | Customer & Staff Management table |
| POST | `/users` | Add New Member modal |
| PUT | `/users/:id` | Edit member |
| PATCH | `/users/:id/status` | Suspend/reactivate |
| DELETE | `/users/:id` | Remove member |

**Menu Items**
| Method | Endpoint | Screen |
|---|---|---|
| GET | `/menu-items?search=&category=&status=&restaurant=&page=&limit=` | Menu Items table |
| POST | `/menu-items` | Add Menu Item modal |
| PUT | `/menu-items/:id` | Edit Menu Item modal |
| PATCH | `/menu-items/:id/availability` | In Stock / Out of Stock toggle |
| DELETE | `/menu-items/:id` | Trash icon |

**Orders**
| Method | Endpoint | Screen |
|---|---|---|
| GET | `/orders?status=&search=&page=&limit=` | Orders table + summary cards |
| POST | `/orders/manual` | "+ Manual Order" |
| PATCH | `/orders/:id/status` | Order Details modal — Update Status / assign rider |

**Restaurants**
| Method | Endpoint |
|---|---|
| POST | `/restaurants` |
| PUT | `/restaurants/:id` |
| PATCH | `/restaurants/:id/toggle-active` |
| DELETE | `/restaurants/:id` |

**Settings**
| Method | Endpoint | Screen |
|---|---|---|
| GET / PUT | `/settings` | Settings & System Preferences — "Save Preferences" |

**Vouchers**
| Method | Endpoint |
|---|---|
| GET | `/vouchers` |
| POST | `/vouchers` |
| PUT | `/vouchers/:id` |
| PATCH | `/vouchers/:id/toggle-active` |
| DELETE | `/vouchers/:id` |

**Reviews**
| Method | Endpoint |
|---|---|
| GET | `/reviews` |
| PATCH | `/reviews/:id/moderate` |
| DELETE | `/reviews/:id` |

---

## 5. Sample request bodies

**Register**

```json
POST /api/auth/register
{
  "fullName": "Tariq Mahmood",
  "email": "tariq@example.com",
  "countryCode": "+92",
  "phone": "3001234567",
  "password": "MySecret123",
  "marketingOptIn": true
}
```

**Verify OTP**

```json
POST /api/auth/verify-otp
{ "email": "tariq@example.com", "code": "482913" }
```

(In development, the mocked OTP is printed to the server console — see `utils/notify.js`.)

**Checkout**

```json
POST /api/orders
Authorization: Bearer <token>
{
  "restaurantId": "665f...",
  "items": [
    { "menuItemId": "665f...", "quantity": 1, "notes": "Extra Aged Cheddar, No Pickles" },
    { "menuItemId": "665f...", "quantity": 1 }
  ],
  "deliveryAddress": {
    "label": "Home",
    "line1": "House 42, Block B-3, Gulberg III",
    "city": "Lahore",
    "area": "Gulberg III, Lahore",
    "instructions": "Please ring the bell once, leave at door, no mayo in fries."
  },
  "ecoFriendlyCutlery": true,
  "voucherCode": "QUICK500",
  "paymentMethod": "jazzcash",
  "paymentAccountNumber": "3028472911",
  "tipAmount": 100
}
```

**Admin: update order status**

```json
PATCH /api/admin/orders/:id/status
Authorization: Bearer <admin token>
{ "status": "preparing", "note": "Kitchen started cooking" }
```

---

## 6. Going to production

1. **Swap the mocked notifications** (`utils/notify.js`) for a real SMS/WhatsApp
   provider (Twilio, or a local Pakistani SMS gateway) and a real email
   provider (SendGrid, Postmark, or Nodemailer + SMTP).
2. **Add a real payment gateway integration** — currently `paymentMethod`
   is recorded and `paymentStatus` is set to `'paid'` immediately for
   non-COD orders as a placeholder. Wire this to JazzCash/EasyPaisa's actual
   merchant APIs before going live with real money.
3. **File uploads** (dish photos, avatars) — add `multer` + an object storage
   bucket (S3, Cloudinary) since this backend currently expects `imageUrl`/
   `avatarUrl` as plain strings.
4. **Rate limiting & input validation** — add `express-rate-limit` on auth
   routes and a validation library (`zod` or `express-validator`) on all
   POST/PUT bodies before production traffic.
5. **HTTPS + environment secrets** — never commit `.env`; use your hosting
   provider's secret manager.
6. **Testing** — this project ships without a test DB pre-installed in some
   sandboxed environments; on your own machine, `npm install --save-dev
mongodb-memory-server jest supertest` works normally for integration tests.

---

## 7. Connecting the React (MERN) frontend

Point your frontend's API base URL at this server (e.g. `http://localhost:5000/api`
in development). Store the JWT from login/verify-otp in memory or an httpOnly
cookie (avoid plain `localStorage` for production-grade security), and attach
it as `Authorization: Bearer <token>` on every request to a `Private` route
listed above.
