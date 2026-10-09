const asyncHandler = require("express-async-handler");
const MenuItem = require("../models/MenuItem");

const getMenuCategories = asyncHandler(async (req, res) => {
  const categories = await MenuItem.aggregate([
    {
      $match: {
        isAvailable: true,
        category: {
          $exists: true,
          $ne: "",
        },
      },
    },
    {
      $group: {
        _id: "$category",
        restaurants: {
          $addToSet: "$restaurant",
        },
      },
    },
    {
      $project: {
        _id: 0,
        name: "$_id",
        count: {
          $size: "$restaurants",
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ]);

  res.json({
    success: true,
    categories,
  });
});

const getPublicMenuItems = asyncHandler(async (req, res) => {
  const { limit = 50, category, restaurantId } = req.query;

  const filter = { isAvailable: true };

  if (restaurantId) {
    filter.restaurant = restaurantId;
  }

  if (category && category !== "All") {
    filter.category = category;
  }

  const items = await MenuItem.find(filter)
    .populate("restaurant", "name")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json({ success: true, items });
});

// =====================================================
// PUBLIC POPULAR MENU ITEMS
// GET /api/menu-items/popular?limit=4
// =====================================================
const getPopularMenuItems = asyncHandler(async (req, res) => {
  const { limit = 4 } = req.query;

  const items = await MenuItem.find({
    isAvailable: true,
    tags: {
      $regex: /^Popular$/i,
    },
  })
    .populate("restaurant", "name")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json({
    success: true,
    items,
  });
});

// =====================================================
// PUBLIC BEST SELLER MENU ITEMS
// GET /api/menu-items/best-sellers?limit=4
// =====================================================
const getBestSellerMenuItems = asyncHandler(async (req, res) => {
  const { limit = 4 } = req.query;

  const items = await MenuItem.find({
    isAvailable: true,
    tags: {
      $regex: /^Best Seller$/i,
    },
  })
    .populate("restaurant", "name")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json({
    success: true,
    items,
  });
});

// -----------------------------------------------------------------------
// @desc    Admin "Menu Items" screen — search + category chips + status
//          filter + pagination
// @route   GET /api/admin/menu-items?search=&category=&status=&page=&limit=
// @access  Private/Admin
// -----------------------------------------------------------------------
const getMenuItems = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    status,
    restaurant,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};
  if (restaurant) filter.restaurant = restaurant;
  if (category && category !== "All") filter.category = category;
  if (status && status !== "all") filter.isAvailable = status === "in_stock";
  if (search) filter.name = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate("restaurant", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    MenuItem.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    items,
  });
});

// -----------------------------------------------------------------------
// @desc    "Add Menu Item" / "Edit Menu Item" modal submit
// @route   POST /api/admin/menu-items
// @access  Private/Admin, Branch Manager
// -----------------------------------------------------------------------
const createMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(req.body);
  res.status(201).json({ success: true, item });
});

// @route   PUT /api/admin/menu-items/:id
const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }
  res.json({ success: true, item });
});

// -----------------------------------------------------------------------
// @desc    "In Stock" / "Out of Stock" quick toggle
// @route   PATCH /api/admin/menu-items/:id/availability
// -----------------------------------------------------------------------
const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }
  item.isAvailable = !item.isAvailable;
  await item.save();
  res.json({ success: true, item });
});

// @route   DELETE /api/admin/menu-items/:id (trash icon)
const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Menu item not found");
  }
  res.json({ success: true, message: "Menu item deleted" });
});

module.exports = {
  getPublicMenuItems,
  getPopularMenuItems,
  getBestSellerMenuItems,
  getMenuCategories,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
};
