const asyncHandler = require("express-async-handler");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");

// -----------------------------------------------------------------------
// @desc    Restaurant listing screen — search, cuisine chips, sidebar
//          filters (price, delivery time, rating, free delivery, open now)
// @route   GET /api/restaurants
// @access  Public
// -----------------------------------------------------------------------
const getRestaurants = asyncHandler(async (req, res) => {
  const {
    search,
    cuisine, // comma-separated list, e.g. "Pakistani & Desi,Fast Food & Burgers"
    priceCategory, // budget | moderate | premium
    maxDeliveryTime, // 20 | 30 | 45
    minRating, // 3.5 | 4.0 | 4.5
    freeDeliveryOnly,
    openNow,
    halalOnly,
    sortBy = "recommended", // recommended | rating | deliveryTime
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { isActive: true };

  if (search && search.trim()) {
    const searchTerm = search.trim();

    filter.$or = [
      {
        name: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        cuisines: {
          $regex: searchTerm,
          $options: "i",
        },
      },
    ];
  }
  if (cuisine) {
    filter.cuisines = { $in: cuisine.split(",") };
  }
  if (priceCategory) {
    filter.priceCategory = priceCategory;
  }
  if (maxDeliveryTime) {
    filter.deliveryTimeMax = { $lte: Number(maxDeliveryTime) };
  }
  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }
  if (freeDeliveryOnly === "true") {
    filter.deliveryFee = 0;
  }
  if (openNow === "true") {
    filter.isOpen = true;
  }
  if (halalOnly === "true") {
    filter.isHalalCertified = true;
  }

  const sortMap = {
    recommended: { isFeatured: -1, rating: -1 },
    rating: { rating: -1 },
    deliveryTime: { deliveryTimeMin: 1 },
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .sort(sortMap[sortBy] || sortMap.recommended)
      .skip(skip)
      .limit(Number(limit)),
    Restaurant.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    restaurants,
  });
});

// -----------------------------------------------------------------------
// @desc    Restaurant detail page — banner info + menu grouped by category
// @route   GET /api/restaurants/:id
// @access  Public
// -----------------------------------------------------------------------
const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }

  const menuItems = await MenuItem.find({
    restaurant: restaurant._id,
    isAvailable: true,
  });

  // Group by category the way the "Popular & Bestsellers / Signature
  // Smash Burgers / Smokehouse BBQ Platters" sections are laid out
  const menuByCategory = menuItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  res.json({ success: true, restaurant, menuByCategory });
});

// -----------------------------------------------------------------------
// Admin CRUD
// -----------------------------------------------------------------------

// @route   POST /api/admin/restaurants
const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create(req.body);
  res.status(201).json({ success: true, restaurant });
});

// @route   PUT /api/admin/restaurants/:id
const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }
  res.json({ success: true, restaurant });
});

// @route   PATCH /api/admin/restaurants/:id/toggle-active
const toggleRestaurantActive = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }
  restaurant.isActive = !restaurant.isActive;
  await restaurant.save();
  res.json({ success: true, restaurant });
});

// @route   DELETE /api/admin/restaurants/:id
const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error("Restaurant not found");
  }
  await MenuItem.deleteMany({ restaurant: restaurant._id });
  res.json({ success: true, message: "Restaurant and its menu removed" });
});

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantActive,
  deleteRestaurant,
};
