const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const Settings = require("../models/Settings");
const Review = require("../models/Review");
const Counter = require("../models/Counter");

const { validateVoucherForOrder } = require("./voucherController");

const { recomputeCustomerStats } = require("./userController");

// ---------------------------------------------------------
// ORDER NUMBER
// ---------------------------------------------------------

const generateOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "order" },
    {
      $inc: {
        seq: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!counter) {
    throw new Error("Unable to generate order number");
  }

  return `QB-${counter.seq}`;
};
// ---------------------------------------------------------
// CUSTOMER ORDER NUMBER
// ---------------------------------------------------------
//
// Generates a separate order number for each customer.
//
// Customer A:
// 1, 2, 3
//
// Customer B:
// 1, 2, 3
//
// The number is calculated only from that customer's orders.
//

const generateCustomerOrderNumber = async (customerId) => {
  const lastOrder = await Order.findOne({
    customer: customerId,
  })
    .sort({
      customerOrderNumber: -1,
    })
    .select("customerOrderNumber")
    .lean();

  return Number(lastOrder?.customerOrderNumber || 0) + 1;
};
// ---------------------------------------------------------
// CHECKOUT GROUP ID
// ---------------------------------------------------------
//
// One customer checkout can create multiple restaurant
// orders.
//
// Example:
//
// Checkout:
// CHK-ABC123
//
// Orders:
// QB-82041 -> Restaurant A
// QB-82042 -> Restaurant B
// QB-82043 -> Restaurant C
//
// Later this same checkoutGroupId should also be used
// by the payment gateway transaction.
//

const generateCheckoutId = () => {
  return `CHK-${new mongoose.Types.ObjectId().toString().toUpperCase()}`;
};

// ---------------------------------------------------------
// VALID PAYMENT METHODS
// ---------------------------------------------------------

const PAYMENT_METHODS = ["cod", "jazzcash", "easypaisa", "card"];

// ---------------------------------------------------------
// PLACE MULTI-RESTAURANT ORDER
// ---------------------------------------------------------

const placeOrder = async (customerId, payload) => {
  const {
    items,
    deliveryAddress,
    ecoFriendlyCutlery,
    voucherCode,
    paymentMethod,
    paymentAccountNumber,
    tipAmount = 0,
  } = payload;

  const tip = Number(tipAmount);
  if (!Number.isFinite(tip) || tip < 0 || tip > 100000) {
    const error = new Error("Invalid tip amount");
    error.statusCode = 400;
    throw error;
  }
  // -------------------------------------------------------
  // BASIC VALIDATION
  // -------------------------------------------------------

  if (!items || !Array.isArray(items) || !items.length) {
    const error = new Error("Cart is empty");
    error.statusCode = 400;
    throw error;
  }

  if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
    const error = new Error("Invalid payment method");

    error.statusCode = 400;

    throw error;
  }

  if (!deliveryAddress?.line1) {
    const error = new Error("Delivery address is required");

    error.statusCode = 400;

    throw error;
  }

  // -------------------------------------------------------
  // SETTINGS
  // -------------------------------------------------------

  const settings = await Settings.getSingleton();

  if (!settings.acceptingOnlineOrders) {
    const error = new Error(
      "QuickBite is not accepting online orders right now",
    );

    error.statusCode = 400;

    throw error;
  }

  // -------------------------------------------------------
  // PAYMENT METHOD AVAILABILITY
  // -------------------------------------------------------
  //
  // Admin Settings -> Payment Methods
  // controls which methods customers are allowed to use.
  //
  // Frontend sends one of:
  // cod
  // card
  // jazzcash
  // easypaisa
  //
  // Example:
  // admin disables card
  // customer tries to submit card
  // backend rejects the order.
  //

  const paymentMethodsSettings = settings.paymentMethods || {};

  if (paymentMethodsSettings[paymentMethod] !== true) {
    const paymentMethodNames = {
      cod: "Cash on Delivery",
      card: "Credit / Debit Card",
      jazzcash: "JazzCash",
      easypaisa: "EasyPaisa",
    };

    const error = new Error(
      `${paymentMethodNames[paymentMethod] || "This payment method"} is currently unavailable`,
    );

    error.statusCode = 400;

    throw error;
  }

  // -------------------------------------------------------
  // VALIDATE CART ITEMS
  // -------------------------------------------------------
  //
  // We DO NOT trust restaurantId coming from frontend.
  //
  // MenuItem.restaurant is used as the real source.
  //

  const validatedItems = [];

  for (const line of items) {
    if (!line.menuItemId) {
      const error = new Error("A cart item is missing menuItemId");

      error.statusCode = 400;

      throw error;
    }

    const menuItem = await MenuItem.findById(line.menuItemId);

    if (!menuItem || !menuItem.isAvailable) {
      const error = new Error(`"${menuItem?.name || "Item"}" is unavailable`);

      error.statusCode = 400;

      throw error;
    }

    const quantity = Math.max(1, Number(line.quantity) || 1);

    validatedItems.push({
      menuItem,
      quantity,
      notes: line.notes,
      restaurantId: menuItem.restaurant,
    });
  }

  // -------------------------------------------------------
  // GROUP ITEMS BY RESTAURANT
  // -------------------------------------------------------

  const restaurantMap = new Map();

  for (const item of validatedItems) {
    const restaurantId = String(item.restaurantId);

    if (!restaurantMap.has(restaurantId)) {
      restaurantMap.set(restaurantId, []);
    }

    restaurantMap.get(restaurantId).push(item);
  }

  const restaurantGroups = Array.from(restaurantMap.entries());

  if (!restaurantGroups.length) {
    const error = new Error("No valid restaurant items found");

    error.statusCode = 400;

    throw error;
  }

  // -------------------------------------------------------
  // LOAD ALL RESTAURANTS
  // -------------------------------------------------------

  const restaurantDocuments = {};

  for (const [restaurantId] of restaurantGroups) {
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant || !restaurant.isActive || !restaurant.isOpen) {
      const error = new Error(
        `${
          restaurant?.name || "One of the restaurants"
        } is not currently accepting orders`,
      );

      error.statusCode = 400;

      throw error;
    }

    restaurantDocuments[restaurantId] = restaurant;
  }

  // -------------------------------------------------------
  // VOUCHER
  // -------------------------------------------------------
  //
  // Current voucher system validates one restaurant.
  //
  // Therefore a voucher is allowed only when checkout
  // contains one restaurant.
  //

  let voucherDiscount = 0;
  let appliedVoucherCode;
  let voucherRestaurantId = null;
  let voucherFreeDelivery = false;

  if (voucherCode) {
    if (restaurantGroups.length > 1) {
      const error = new Error(
        "This voucher cannot be used with multiple restaurants",
      );

      error.statusCode = 400;

      throw error;
    }

    const [restaurantId, restaurantItems] = restaurantGroups[0];

    const restaurantSubtotal = restaurantItems.reduce(
      (sum, line) => sum + Number(line.menuItem.price || 0) * line.quantity,
      0,
    );

    const result = await validateVoucherForOrder({
      code: voucherCode,
      userId: customerId,
      restaurantId,
      itemsSubtotal: restaurantSubtotal,
    });

    voucherDiscount = Number(result.discountAmount || 0);

    appliedVoucherCode = result.voucher.code;

    voucherRestaurantId = restaurantId;

    voucherFreeDelivery = !!result.freeDelivery;
  }

  // -------------------------------------------------------
  // CHECKOUT GROUP
  // -------------------------------------------------------

  const checkoutId = generateCheckoutId();
  // IMPORTANT PAYMENT STATUS RULE
  // -------------------------------------------------------
  //
  // COD:
  //     pending
  //
  // Online payment:
  //     pending
  //
  // NEVER mark online payment "paid" merely because
  // createOrder API was called.
  //
  // Actual payment gateway webhook/verification must
  // change it to "paid".
  //

  const initialPaymentStatus = paymentMethod === "cod" ? "pending" : "pending";

  // -------------------------------------------------------
  // CREATE ONE ORDER PER RESTAURANT
  // -------------------------------------------------------

  const createdOrders = [];

  let customerOrderNumber = await generateCustomerOrderNumber(customerId);

  try {
    for (const [restaurantId, restaurantItems] of restaurantGroups) {
      const restaurant = restaurantDocuments[restaurantId];

      // ---------------------------------------------------
      // ORDER ITEMS
      // ---------------------------------------------------

      const orderItems = [];

      let itemsSubtotal = 0;

      for (const line of restaurantItems) {
        const menuItem = line.menuItem;

        const quantity = Number(line.quantity) || 1;

        orderItems.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          unitPrice: Number(menuItem.price || 0),
          quantity,
          notes: line.notes,
        });

        itemsSubtotal += Number(menuItem.price || 0) * quantity;
      }

      // ---------------------------------------------------
      // DELIVERY
      // ---------------------------------------------------

      let deliveryFee =
        itemsSubtotal >= Number(settings.freeDeliveryAbove || 0)
          ? 0
          : Number(restaurant.deliveryFee ?? settings.baseDeliveryFee ?? 0);

      // Free delivery voucher
      if (voucherFreeDelivery && voucherRestaurantId === restaurantId) {
        deliveryFee = 0;
      }

      // ---------------------------------------------------
      // VOUCHER DISCOUNT
      // ---------------------------------------------------
      //
      // Voucher discount belongs only to the single
      // restaurant checkout where voucher was validated.
      //

      const orderVoucherDiscount =
        voucherRestaurantId === restaurantId ? voucherDiscount : 0;

      // ---------------------------------------------------
      // FEES
      // ---------------------------------------------------

      const packagingFee = Number(settings.packagingFee || 0);

      const taxPercentage = Number(settings.taxPercentage || 0);

      const restaurantTip =
        restaurantGroups.length === 1 ? Number(tipAmount || 0) : 0;

      const preTaxTotal = Math.max(
        0,
        itemsSubtotal + deliveryFee + packagingFee - orderVoucherDiscount,
      );

      const tax = Math.round((preTaxTotal * taxPercentage) / 100);

      const totalAmount = Math.max(0, preTaxTotal + tax + restaurantTip);

      // ---------------------------------------------------
      // CREATE ORDER
      // ---------------------------------------------------

      const order = await Order.create({
        orderNumber: await generateOrderNumber(),

        checkoutId,
        customerOrderNumber,
        customer: customerId,

        restaurant: restaurant._id,

        items: orderItems,

        itemsSubtotal,

        deliveryFee,

        packagingFee,

        voucherCode:
          voucherRestaurantId === restaurantId ? appliedVoucherCode : undefined,

        voucherDiscount: orderVoucherDiscount,

        tax,

        totalAmount,

        tipAmount: restaurantTip,

        paymentMethod,

        paymentStatus: initialPaymentStatus,

        paymentAccountNumber: paymentAccountNumber || undefined,

        deliveryAddress: {
          label: deliveryAddress.label,
          line1: deliveryAddress.line1,
          area: deliveryAddress.area,
          city: deliveryAddress.city,
          lat: deliveryAddress.lat,
          lng: deliveryAddress.lng,
          instructions: deliveryAddress.instructions,
        },

        ecoFriendlyCutlery: !!ecoFriendlyCutlery,

        status: "confirmed",

        statusHistory: [
          {
            status: "confirmed",
            note: "Order placed from multi-restaurant checkout",
          },
        ],
      });

      createdOrders.push(order);

      customerOrderNumber += 1;
    }
  } catch (error) {
    /*
     * If one restaurant order fails after earlier orders
     * were already created, delete the previously created
     * orders so the customer doesn't end up with a
     * partially-created checkout.
     */

    if (createdOrders.length) {
      await Order.deleteMany({
        _id: {
          $in: createdOrders.map((order) => order._id),
        },
      });
    }

    throw error;
  }

  // -------------------------------------------------------
  // RETURN ALL ORDERS
  // -------------------------------------------------------

  return {
    checkoutId,
    paymentMethod,
    paymentStatus: initialPaymentStatus,
    orders: createdOrders,
  };
};

// -----------------------------------------------------------------------
// CREATE ORDER
// -----------------------------------------------------------------------
// POST /api/orders
// Private / Customer
//
// One request can contain items from:
// Restaurant A
// Restaurant B
// Restaurant C
//
// Backend creates:
// Order A
// Order B
// Order C
//
// Customer still performs checkout once.
// -----------------------------------------------------------------------

const createOrder = asyncHandler(async (req, res) => {
  try {
    const result = await placeOrder(req.user._id, req.body);

    res.status(201).json({
      success: true,

      checkoutId: result.checkoutId,

      paymentMethod: result.paymentMethod,

      paymentStatus: result.paymentStatus,

      orders: result.orders,
    });
  } catch (error) {
    res.status(error.statusCode || 400);

    throw error;
  }
});
// -----------------------------------------------------------------------
// CREATE CHECKOUT
// -----------------------------------------------------------------------
// POST /api/orders/checkout
// Private / Customer
//
// One checkout can contain items from multiple restaurants.
// Backend creates one Order document per restaurant.
// All created orders share the same checkoutGroupId.
// -----------------------------------------------------------------------

const createCheckout = asyncHandler(async (req, res) => {
  try {
    const result = await placeOrder(req.user._id, req.body);

    res.status(201).json({
      success: true,

      checkoutId: result.checkoutId,

      paymentMethod: result.paymentMethod,

      paymentStatus: result.paymentStatus,

      orders: result.orders,
    });
  } catch (error) {
    res.status(error.statusCode || 400);

    throw error;
  }
});
// -----------------------------------------------------------------------
// GET MY ORDERS
// -----------------------------------------------------------------------

const getMyOrders = asyncHandler(async (req, res) => {
  const { tab = "all" } = req.query;

  const filter = {
    customer: req.user._id,
  };

  if (tab === "active") {
    filter.status = {
      $in: ["confirmed", "preparing", "out_for_delivery"],
    };
  }

  if (tab === "delivered") {
    filter.status = "delivered";
  }

  if (tab === "cancelled") {
    filter.status = "cancelled";
  }

  const orders = await Order.find(filter)
    .populate("restaurant", "name coverImage")
    .sort({
      createdAt: -1,
    });

  const counts = await Promise.all([
    Order.countDocuments({
      customer: req.user._id,
    }),

    Order.countDocuments({
      customer: req.user._id,
      status: {
        $in: ["confirmed", "preparing", "out_for_delivery"],
      },
    }),

    Order.countDocuments({
      customer: req.user._id,
      status: "delivered",
    }),

    Order.countDocuments({
      customer: req.user._id,
      status: "cancelled",
    }),
  ]);

  res.json({
    success: true,

    counts: {
      all: counts[0],
      active: counts[1],
      delivered: counts[2],
      cancelled: counts[3],
    },

    orders,
  });
});

// -----------------------------------------------------------------------
// GET SINGLE ORDER
// -----------------------------------------------------------------------

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "fullName phone")
    .populate("restaurant", "name")
    .populate("assignedRider", "fullName phone riderInfo");

  if (!order) {
    res.status(404);

    throw new Error("Order not found");
  }

  const isOwner = String(order.customer._id) === String(req.user._id);

  const isStaff = [
    "admin",
    "branch_manager",
    "kitchen_staff",
    "rider",
  ].includes(req.user.role);

  if (!isOwner && !isStaff) {
    res.status(403);

    throw new Error("Not authorized to view this order");
  }

  res.json({
    success: true,
    order,
  });
});

// -----------------------------------------------------------------------
// CANCEL ORDER
// -----------------------------------------------------------------------

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);

    throw new Error("Order not found");
  }

  if (String(order.customer) !== String(req.user._id)) {
    res.status(403);

    throw new Error("Not authorized to cancel this order");
  }

  if (order.status !== "confirmed") {
    res.status(400);

    throw new Error(
      "This order can no longer be cancelled — kitchen has already started preparing it",
    );
  }

  order.status = "cancelled";

  order.cancelledAt = new Date();

  order.cancellationReason = req.body.reason || "Cancelled by customer";

  order.statusHistory.push({
    status: "cancelled",

    note: order.cancellationReason,
  });

  /*
   * If payment was actually captured,
   * a real gateway refund operation should
   * happen here.
   */

  if (order.paymentStatus === "paid") {
    order.paymentStatus = "refunded";
  }

  await order.save();

  res.json({
    success: true,
    order,
  });
});

// -----------------------------------------------------------------------
// REVIEW
// -----------------------------------------------------------------------

const rateOrder = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);

    throw new Error("Order not found");
  }

  if (String(order.customer) !== String(req.user._id)) {
    res.status(403);

    throw new Error("Not authorized");
  }

  if (order.status !== "delivered") {
    res.status(400);

    throw new Error("You can only review delivered orders");
  }

  if (order.reviewSubmitted) {
    res.status(400);

    throw new Error("You already reviewed this order");
  }

  await Review.create({
    customer: req.user._id,

    restaurant: order.restaurant,

    order: order._id,

    rating,

    comment,
  });

  order.rating = rating;

  order.reviewSubmitted = true;

  await order.save();

  const agg = await Review.aggregate([
    {
      $match: {
        restaurant: order.restaurant,
        isHidden: false,
      },
    },

    {
      $group: {
        _id: null,

        avgRating: {
          $avg: "$rating",
        },

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  if (agg[0]) {
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      rating: Math.round(agg[0].avgRating * 10) / 10,

      reviewCount: agg[0].count,
    });
  }

  res.json({
    success: true,

    message: "Thanks for your review!",
  });
});

// -----------------------------------------------------------------------
// ADMIN — ALL ORDERS
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// ADMIN — ALL ORDERS
// -----------------------------------------------------------------------

const getAllOrders = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    page = 1,
    limit = 20,
    range = "all",
    startDate,
    endDate,
  } = req.query;

  const filter = {};

  // -------------------------------------------------------
  // STATUS FILTER
  // -------------------------------------------------------

  if (status && status !== "All") {
    filter.status = status.toLowerCase().replace(/ /g, "_");
  }

  // -------------------------------------------------------
  // SEARCH FILTER
  // -------------------------------------------------------

  if (search) {
    filter.$or = [
      {
        orderNumber: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // -------------------------------------------------------
  // DATE FILTER
  // -------------------------------------------------------

  let rangeStart = null;
  let rangeEnd = null;

  const now = new Date();

  if (startDate && endDate) {
    rangeStart = new Date(startDate);
    rangeEnd = new Date(endDate);

    rangeEnd.setHours(23, 59, 59, 999);

    filter.createdAt = {
      $gte: rangeStart,
      $lte: rangeEnd,
    };
  } else if (range === "today") {
    rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);

    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);

    filter.createdAt = {
      $gte: rangeStart,
      $lte: rangeEnd,
    };
  } else if (range === "week") {
    rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);

    const day = rangeStart.getDay();
    const diff = day === 0 ? 6 : day - 1;

    rangeStart.setDate(rangeStart.getDate() - diff);

    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);

    filter.createdAt = {
      $gte: rangeStart,
      $lte: rangeEnd,
    };
  } else if (range === "month") {
    // This Month = previous 30 days including today
    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);

    rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);

    filter.createdAt = {
      $gte: rangeStart,
      $lte: rangeEnd,
    };
  }
  // range === "all"
  // No createdAt filter is added.

  // -------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 20);

  const skip = (pageNumber - 1) * pageSize;

  // -------------------------------------------------------
  // ORDERS + TOTAL
  // -------------------------------------------------------

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("customer", "fullName phone email")
      .populate("restaurant", "name")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageSize),

    Order.countDocuments(filter),
  ]);

  // -------------------------------------------------------
  // RANGE STATS
  // -------------------------------------------------------

  // -------------------------------------------------------
  // STATS FILTER
  // -------------------------------------------------------

  const statsFilter = {};

  if (rangeStart && rangeEnd) {
    statsFilter.createdAt = {
      $gte: rangeStart,
      $lte: rangeEnd,
    };
  }

  const [totalOrders, inKitchen, outForDelivery, delivered, cancelled] =
    await Promise.all([
      Order.countDocuments(statsFilter),

      Order.countDocuments({
        ...statsFilter,
        status: "preparing",
      }),

      Order.countDocuments({
        ...statsFilter,
        status: "out_for_delivery",
      }),

      Order.countDocuments({
        ...statsFilter,
        status: "delivered",
      }),

      Order.countDocuments({
        ...statsFilter,
        status: "cancelled",
      }),
    ]);

  // -------------------------------------------------------
  // REVENUE
  // -------------------------------------------------------

  const revenueResult = await Order.aggregate([
    {
      $match: {
        ...statsFilter,

        status: {
          $ne: "cancelled",
        },
      },
    },

    {
      $group: {
        _id: null,

        revenue: {
          $sum: "$totalAmount",
        },

        averageOrderValue: {
          $avg: "$totalAmount",
        },
      },
    },
  ]);

  const revenue = Number(revenueResult[0]?.revenue || 0);

  const averageOrderValue = Number(revenueResult[0]?.averageOrderValue || 0);

  // -------------------------------------------------------
  // PAYMENT CHANNEL STATS
  // -------------------------------------------------------

  const paymentStats = await Order.aggregate([
    {
      $match: {
        ...statsFilter,

        status: {
          $ne: "cancelled",
        },
      },
    },

    {
      $group: {
        _id: "$paymentMethod",

        count: {
          $sum: 1,
        },

        amount: {
          $sum: "$totalAmount",
        },
      },
    },

    {
      $sort: {
        count: -1,
      },
    },
  ]);

  // -------------------------------------------------------
  // HOURLY / DAILY CHART DATA
  // -------------------------------------------------------
  // -------------------------------------------------------
  // HOURLY / DAILY / MONTHLY CHART DATA
  // -------------------------------------------------------

  let chart = [];

  if (range === "today") {
    chart = await Order.aggregate([
      {
        $match: {
          ...statsFilter,
          status: {
            $ne: "cancelled",
          },
        },
      },
      {
        $group: {
          _id: {
            $hour: "$createdAt",
          },
          orders: {
            $sum: 1,
          },
          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  } else if (range === "week") {
    chart = await Order.aggregate([
      {
        $match: {
          ...statsFilter,
          status: {
            $ne: "cancelled",
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          orders: {
            $sum: 1,
          },
          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  } else if (range === "month") {
    chart = await Order.aggregate([
      {
        $match: {
          ...statsFilter,
          status: {
            $ne: "cancelled",
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          orders: {
            $sum: 1,
          },
          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  } else {
    // ALL ORDERS — group by month
    chart = await Order.aggregate([
      {
        $match: {
          ...statsFilter,
          status: {
            $ne: "cancelled",
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          orders: {
            $sum: 1,
          },
          revenue: {
            $sum: "$totalAmount",
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);
  }

  // -------------------------------------------------------
  // RESPONSE
  // -------------------------------------------------------

  res.json({
    success: true,

    stats: {
      totalOrders,
      inKitchen,
      outForDelivery,

      deliveredToday: delivered,

      delivered,

      cancelled,

      revenue,

      averageOrderValue,

      paymentStats,

      chart,
    },

    total,

    page: pageNumber,

    pages: Math.ceil(total / pageSize),

    orders,
  });
});

// -----------------------------------------------------------------------
// ADMIN — UPDATE ORDER STATUS
// -----------------------------------------------------------------------

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, assignedRider, riderEtaMinutes, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);

    throw new Error("Order not found");
  }

  const validTransitions = {
    confirmed: ["preparing", "out_for_delivery", "cancelled"],

    preparing: ["out_for_delivery", "cancelled"],

    out_for_delivery: ["delivered"],

    delivered: [],

    cancelled: [],
  };

  if (status && status !== order.status) {
    if (!validTransitions[order.status].includes(status)) {
      res.status(400);

      throw new Error(
        `Cannot move order from '${order.status}' to '${status}'`,
      );
    }

    order.status = status;

    order.statusHistory.push({
      status,
      note,
    });

    if (status === "delivered") {
      order.deliveredAt = new Date();

      await recomputeCustomerStats(order.customer);
    }
  }

  if (assignedRider) {
    order.assignedRider = assignedRider;
  }

  if (riderEtaMinutes !== undefined) {
    order.riderEtaMinutes = riderEtaMinutes;
  }

  await order.save();

  res.json({
    success: true,
    order,
  });
});

// -----------------------------------------------------------------------
// ADMIN — MANUAL ORDER
// -----------------------------------------------------------------------

const createManualOrder = asyncHandler(async (req, res) => {
  const { customerId, ...orderPayload } = req.body;

  if (!customerId) {
    res.status(400);

    throw new Error("customerId is required for a manual order");
  }

  try {
    const result = await placeOrder(customerId, orderPayload);

    res.status(201).json({
      success: true,

      checkoutId: result.checkoutId,
      orders: result.orders,
    });
  } catch (error) {
    res.status(error.statusCode || 400);

    throw error;
  }
});

// -----------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------

module.exports = {
  createOrder,
  createCheckout,
  getMyOrders,
  getOrderById,
  cancelOrder,
  rateOrder,
  getAllOrders,
  updateOrderStatus,
  createManualOrder,
};
