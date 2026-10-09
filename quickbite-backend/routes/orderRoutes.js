const express = require("express");

const router = express.Router();

const {
  createOrder,
  createCheckout,
  getMyOrders,
  getOrderById,
  cancelOrder,
  rateOrder,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

// ---------------------------------------------------------
// CUSTOMER ORDERS
// ---------------------------------------------------------

// Multi-restaurant checkout
router.post("/checkout", protect, createCheckout);

// Backward-compatible single/general order endpoint
router.post("/", protect, createOrder);

// Customer orders
router.get("/mine", protect, getMyOrders);

// Single order
router.get("/:id", protect, getOrderById);

// Cancel
router.patch("/:id/cancel", protect, cancelOrder);

// Review
router.post("/:id/review", protect, rateOrder);

module.exports = router;
