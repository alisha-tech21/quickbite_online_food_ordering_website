const asyncHandler = require("express-async-handler");
const Voucher = require("../models/Voucher");
const Order = require("../models/Order");

// -----------------------------------------------------------------------
// Shared logic: validates a voucher code against a cart/order context.
// Used by both the standalone "Apply" button (cart page) and the final
// createOrder step (checkout), so the rules can never drift apart.
// Returns { voucher, discountAmount, freeDelivery } or throws.
// -----------------------------------------------------------------------
const validateVoucherForOrder = async ({
  code,
  userId,
  restaurantId,
  itemsSubtotal,
}) => {
  const voucher = await Voucher.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!voucher) throw new Error("Voucher code is invalid or no longer active");

  const now = new Date();
  if (voucher.validFrom && now < voucher.validFrom)
    throw new Error("This voucher is not active yet");
  if (voucher.validUntil && now > voucher.validUntil)
    throw new Error("This voucher has expired");

  if (voucher.validDays && voucher.validDays.length) {
    const dayName = now.toLocaleDateString("en-US", { weekday: "short" });
    if (!voucher.validDays.includes(dayName)) {
      throw new Error(
        `This voucher is only valid on: ${voucher.validDays.join(", ")}`,
      );
    }
  }

  if (
    voucher.applicableRestaurants &&
    voucher.applicableRestaurants.length &&
    !voucher.applicableRestaurants.some(
      (r) => String(r) === String(restaurantId),
    )
  ) {
    throw new Error("This voucher is not valid at this restaurant");
  }

  if (itemsSubtotal < voucher.minOrderAmount) {
    throw new Error(
      `Minimum order of Rs. ${voucher.minOrderAmount} required for this voucher`,
    );
  }

  if (voucher.totalUsageLimit && voucher.timesUsed >= voucher.totalUsageLimit) {
    throw new Error("This voucher has reached its usage limit");
  }

  const previousUses = await Order.countDocuments({
    customer: userId,
    voucherCode: voucher.code,
    status: { $ne: "cancelled" },
  });
  if (previousUses >= voucher.usageLimitPerUser) {
    throw new Error(
      "You have already used this voucher the maximum number of times",
    );
  }

  let discountAmount = 0;
  let freeDelivery = false;

  if (voucher.discountType === "flat") {
    discountAmount = voucher.discountValue;
  } else if (voucher.discountType === "percentage") {
    discountAmount = (itemsSubtotal * voucher.discountValue) / 100;
    if (voucher.maxDiscount)
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
  } else if (voucher.discountType === "free_delivery") {
    freeDelivery = true;
  }

  discountAmount = Math.min(discountAmount, itemsSubtotal);

  return { voucher, discountAmount: Math.round(discountAmount), freeDelivery };
};

// -----------------------------------------------------------------------
// @desc    "Apply" button on Cart page — validate without placing an order
// @route   POST /api/vouchers/apply
// @access  Private
// -----------------------------------------------------------------------
const applyVoucher = asyncHandler(async (req, res) => {
  const { code, restaurantId, itemsSubtotal } = req.body;
  const result = await validateVoucherForOrder({
    code,
    userId: req.user._id,
    restaurantId,
    itemsSubtotal,
  });
  res.json({
    success: true,
    code: result.voucher.code,
    discountAmount: result.discountAmount,
    freeDelivery: result.freeDelivery,
    message: `${result.voucher.title || result.voucher.code} applied successfully`,
  });
});

// -----------------------------------------------------------------------
// @desc    "Exclusive Offers & Deals" public page
// @route   GET /api/vouchers/active
// @access  Public
// -----------------------------------------------------------------------
const getActiveVouchers = asyncHandler(async (req, res) => {
  const now = new Date();

  const vouchers = await Voucher.find({
    isActive: true,

    $and: [
      {
        $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
      },
      {
        $or: [{ validUntil: null }, { validUntil: { $gte: now } }],
      },
    ],
  }).sort({ createdAt: -1 });

  const currentDay = now.toLocaleDateString("en-US", {
    weekday: "short",
  });

  const activeVouchers = vouchers.filter((voucher) => {
    if (
      voucher.validDays &&
      voucher.validDays.length > 0 &&
      !voucher.validDays.includes(currentDay)
    ) {
      return false;
    }

    if (
      voucher.totalUsageLimit &&
      voucher.timesUsed >= voucher.totalUsageLimit
    ) {
      return false;
    }

    return true;
  });

  res.json({
    success: true,
    vouchers: activeVouchers,
  });
});

// -----------------------------------------------------------------------
// Admin CRUD — "manage offers" from the original spec
// -----------------------------------------------------------------------
const createVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.create(req.body);
  res.status(201).json({ success: true, voucher });
});

const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  res.json({ success: true, voucher });
});

const toggleVoucherActive = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  voucher.isActive = !voucher.isActive;
  await voucher.save();
  res.json({ success: true, voucher });
});

const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  res.json({ success: true, message: "Voucher deleted" });
});

const getAllVouchersAdmin = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find().sort({ createdAt: -1 });
  res.json({ success: true, vouchers });
});

module.exports = {
  validateVoucherForOrder,
  applyVoucher,
  getActiveVouchers,
  createVoucher,
  updateVoucher,
  toggleVoucherActive,
  deleteVoucher,
  getAllVouchersAdmin,
};
