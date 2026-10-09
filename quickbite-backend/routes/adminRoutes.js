const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const { getDashboardOverview } = require("../controllers/dashboardController");
const {
  getUsers,
  getUserStats,
  createMember,
  updateMember,
  updateMemberStatus,
  deleteMember,
} = require("../controllers/userController");
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} = require("../controllers/menuController");
const {
  getAllOrders,
  updateOrderStatus,
  createManualOrder,
} = require("../controllers/orderController");
const {
  createRestaurant,
  updateRestaurant,
  toggleRestaurantActive,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");
const {
  getAllVouchersAdmin,
  createVoucher,
  updateVoucher,
  toggleVoucherActive,
  deleteVoucher,
} = require("../controllers/voucherController");
const {
  getAllReviewsAdmin,
  moderateReview,
  replyToReview,
  deleteReview,
} = require("../controllers/reviewController");
router.use(protect);

// Staff roles that can operate day-to-day screens; only 'admin' can manage
// users/settings/restaurants (Super Admin / Admin in the design).
const OPS_ROLES = ["admin", "branch_manager", "kitchen_staff"];

// ---- Dashboard ----
router.get(
  "/dashboard",
  authorize("admin", "branch_manager"),
  getDashboardOverview,
);

// ---- Users & Staff Management ----
router.get("/users/stats", authorize("admin"), getUserStats);
router.get("/users", authorize("admin"), getUsers);
router.post("/users", authorize("admin"), createMember);
router.put("/users/:id", authorize("admin"), updateMember);
router.patch("/users/:id/status", authorize("admin"), updateMemberStatus);
router.delete("/users/:id", authorize("admin"), deleteMember);

// ---- Menu Items ----
router.get("/menu-items", authorize(...OPS_ROLES), getMenuItems);
router.post(
  "/menu-items",
  authorize("admin", "branch_manager"),
  createMenuItem,
);
router.put(
  "/menu-items/:id",
  authorize("admin", "branch_manager"),
  updateMenuItem,
);
router.patch(
  "/menu-items/:id/availability",
  authorize(...OPS_ROLES),
  toggleAvailability,
);
router.delete(
  "/menu-items/:id",
  authorize("admin", "branch_manager"),
  deleteMenuItem,
);

// ---- Orders ----
router.get("/orders", authorize(...OPS_ROLES), getAllOrders);
router.post(
  "/orders/manual",
  authorize("admin", "branch_manager"),
  createManualOrder,
);
router.patch("/orders/:id/status", authorize(...OPS_ROLES), updateOrderStatus);

// ---- Restaurants ----
router.post("/restaurants", authorize("admin"), createRestaurant);
router.put(
  "/restaurants/:id",
  authorize("admin", "branch_manager"),
  updateRestaurant,
);
router.patch(
  "/restaurants/:id/toggle-active",
  authorize("admin"),
  toggleRestaurantActive,
);
router.delete("/restaurants/:id", authorize("admin"), deleteRestaurant);

// ---- Settings ----
router.get("/settings", authorize("admin"), getSettings);
router.put("/settings", authorize("admin"), updateSettings);

// ---- Vouchers / Offers ----
router.get("/vouchers", authorize("admin"), getAllVouchersAdmin);
router.post("/vouchers", authorize("admin"), createVoucher);
router.put("/vouchers/:id", authorize("admin"), updateVoucher);
router.patch(
  "/vouchers/:id/toggle-active",
  authorize("admin"),
  toggleVoucherActive,
);
router.delete("/vouchers/:id", authorize("admin"), deleteVoucher);

// ---- Reviews ----
router.get("/reviews", authorize("admin"), getAllReviewsAdmin);

router.patch("/reviews/:id/moderate", authorize("admin"), moderateReview);

router.patch("/reviews/:id/reply", authorize("admin"), replyToReview);

router.delete("/reviews/:id", authorize("admin"), deleteReview);

module.exports = router;
