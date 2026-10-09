const express = require("express");

const router = express.Router();

const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantActive,
  deleteRestaurant,
} = require("../controllers/restaurantController");

const {
  getRestaurantReviews,
  getAllReviews,
} = require("../controllers/reviewController");

const { protect, authorize } = require("../middleware/authMiddleware");

// =====================================================
// PUBLIC ROUTES
// =====================================================

// All restaurants
router.get("/", getRestaurants);

// All reviews for homepage testimonials
// IMPORTANT: this must come before /:id
router.get("/reviews", getAllReviews);

// Specific restaurant reviews
// IMPORTANT: this must come before /:id
router.get("/:id/reviews", getRestaurantReviews);

// Specific restaurant
router.get("/:id", getRestaurantById);

// =====================================================
// ADMIN RESTAURANT ROUTES
// =====================================================

// Create restaurant
// POST /api/restaurants/admin
router.post("/admin", protect, authorize("admin"), createRestaurant);

// Update restaurant
// PUT /api/restaurants/admin/:id
router.put("/admin/:id", protect, authorize("admin"), updateRestaurant);

// Activate / deactivate restaurant
// PATCH /api/restaurants/admin/:id/toggle-active
router.patch(
  "/admin/:id/toggle-active",
  protect,
  authorize("admin"),
  toggleRestaurantActive,
);

// Delete restaurant
// DELETE /api/restaurants/admin/:id
router.delete("/admin/:id", protect, authorize("admin"), deleteRestaurant);

module.exports = router;
