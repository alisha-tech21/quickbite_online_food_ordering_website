const asyncHandler = require("express-async-handler");

const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

const populateCart = (query) =>
  query
    .populate({
      path: "items.menuItem",
      select:
        "name description price imageUrl category tags isAvailable restaurant",
    })
    .populate({
      path: "items.restaurant",
      select: "name deliveryFee deliveryTimeMin deliveryTimeMax",
    });

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  return cart;
};

// ---------------------------------------------------------
// GET CART
// GET /api/cart
// ---------------------------------------------------------

const getCart = asyncHandler(async (req, res) => {
  const cart = await populateCart(
    Cart.findOne({
      user: req.user._id,
    }),
  );

  if (!cart) {
    return res.json({
      success: true,
      cart: {
        _id: null,
        user: req.user._id,
        items: [],
      },
    });
  }

  res.json({
    success: true,
    cart,
  });
});

// ---------------------------------------------------------
// ADD TO CART
// POST /api/cart/items
//
// IMPORTANT:
// One user can have items from MULTIPLE restaurants.
// ---------------------------------------------------------

const addToCart = asyncHandler(async (req, res) => {
  const { menuItemId, quantity = 1 } = req.body;

  if (!menuItemId) {
    res.status(400);
    throw new Error("menuItemId is required");
  }

  const menuItem = await MenuItem.findById(menuItemId);

  if (!menuItem) {
    res.status(404);
    throw new Error("Menu item not found");
  }

  if (!menuItem.isAvailable) {
    res.status(400);
    throw new Error("This item is currently unavailable");
  }

  const qty = Math.min(99, Math.max(1, Number(quantity) || 1));

  const cart = await getOrCreateCart(req.user._id);

  // -------------------------------------------------------
  // MULTI-RESTAURANT CART
  //
  // DO NOT restrict restaurant here.
  //
  // Restaurant A + Restaurant B + Restaurant C
  // can all exist in the same cart.
  // -------------------------------------------------------

  const existingItem = cart.items.find(
    (item) => String(item.menuItem) === String(menuItem._id),
  );

  if (existingItem) {
    existingItem.quantity = Math.min(99, existingItem.quantity + qty);
  } else {
    cart.items.push({
      menuItem: menuItem._id,
      restaurant: menuItem.restaurant,
      quantity: qty,
    });
  }

  await cart.save();

  const updatedCart = await populateCart(Cart.findById(cart._id));

  res.status(201).json({
    success: true,
    message: "Item added to cart",
    cart: updatedCart,
  });
});

// ---------------------------------------------------------
// UPDATE QUANTITY
// PATCH /api/cart/items/:menuItemId
// ---------------------------------------------------------

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const qty = Number(quantity);

  if (!Number.isFinite(qty)) {
    res.status(400);
    throw new Error("Valid quantity is required");
  }

  const cart = await getOrCreateCart(req.user._id);

  const item = cart.items.find(
    (cartItem) => String(cartItem.menuItem) === String(req.params.menuItemId),
  );

  if (!item) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  // Quantity 0 = remove item
  if (qty <= 0) {
    cart.items = cart.items.filter(
      (cartItem) => String(cartItem.menuItem) !== String(req.params.menuItemId),
    );
  } else {
    item.quantity = Math.min(99, qty);
  }

  await cart.save();

  const updatedCart = await populateCart(Cart.findById(cart._id));

  res.json({
    success: true,
    cart: updatedCart,
  });
});

// ---------------------------------------------------------
// REMOVE ITEM
// DELETE /api/cart/items/:menuItemId
// ---------------------------------------------------------

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  const oldLength = cart.items.length;

  cart.items = cart.items.filter(
    (item) => String(item.menuItem) !== String(req.params.menuItemId),
  );

  if (cart.items.length === oldLength) {
    res.status(404);
    throw new Error("Cart item not found");
  }

  await cart.save();

  const updatedCart = await populateCart(Cart.findById(cart._id));

  res.json({
    success: true,
    cart: updatedCart,
  });
});

// ---------------------------------------------------------
// CLEAR CART
// DELETE /api/cart
// ---------------------------------------------------------

const clearCart = asyncHandler(async (req, res) => {
  await Cart.deleteOne({
    user: req.user._id,
  });

  res.json({
    success: true,
    message: "Cart cleared",
    cart: {
      items: [],
    },
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
