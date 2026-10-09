const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

// -----------------------------------------------------------------------
// @desc    Dashboard Overview
// @route   GET /api/admin/dashboard?range=today|week|month|all
// @access  Private/Admin
// -----------------------------------------------------------------------
const getDashboardOverview = asyncHandler(async (req, res) => {
  const range = req.query.range || "today";

  const now = new Date();

  // -------------------------------------------------------------
  // DATE RANGE
  // -------------------------------------------------------------
  let rangeStart = null;
  let rangeEnd = null;

  if (range === "today") {
    rangeStart = startOfDay(now);
    rangeEnd = endOfDay(now);
  }

  if (range === "week") {
    // Current calendar week: Monday -> today
    rangeStart = new Date(now);

    const day = rangeStart.getDay();
    const diff = day === 0 ? 6 : day - 1;

    rangeStart.setDate(rangeStart.getDate() - diff);
    rangeStart.setHours(0, 0, 0, 0);

    rangeEnd = endOfDay(now);
  }

  if (range === "month") {
    // Last 30 days including today
    rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);

    rangeEnd = endOfDay(now);
  }

  // "all" means no createdAt restriction
  if (range === "all") {
    rangeStart = null;
    rangeEnd = null;
  }

  // -------------------------------------------------------------
  // BASE FILTER
  // -------------------------------------------------------------
  const baseFilter = {
    status: { $ne: "cancelled" },
  };

  if (rangeStart && rangeEnd) {
    baseFilter.createdAt = {
      $gte: rangeStart,
      $lte: rangeEnd,
    };
  }

  // -------------------------------------------------------------
  // YESTERDAY
  // -------------------------------------------------------------
  const yesterdayStart = startOfDay(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
  );

  const yesterdayEnd = endOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  // -------------------------------------------------------------
  // SUMMARY CARDS
  // -------------------------------------------------------------
  const [rangeAgg, yesterdayAgg, totalOrders, completedDeliveries, avgPrepAgg] =
    await Promise.all([
      // Revenue for selected period
      Order.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),

      // Yesterday revenue
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: yesterdayStart,
              $lte: yesterdayEnd,
            },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),

      // Total orders for selected period
      Order.countDocuments(baseFilter),

      // Delivered orders for selected period
      Order.countDocuments({
        ...baseFilter,
        status: "delivered",
      }),

      // Average preparation/delivery time
      Order.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "delivered",
            deliveredAt: { $ne: null },
          },
        },
        {
          $project: {
            prepMinutes: {
              $divide: [
                {
                  $subtract: ["$deliveredAt", "$createdAt"],
                },
                60000,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgMinutes: { $avg: "$prepMinutes" },
          },
        },
      ]),
    ]);

  const selectedPeriodRevenue = rangeAgg[0]?.revenue || 0;
  const yesterdayRevenue = yesterdayAgg[0]?.revenue || 0;

  const revenueChangePct = yesterdayRevenue
    ? Math.round(
        ((selectedPeriodRevenue - yesterdayRevenue) / yesterdayRevenue) * 1000,
      ) / 10
    : 0;

  // -------------------------------------------------------------
  // ACTIVE KITCHEN
  // -------------------------------------------------------------
  const activeInKitchenCount = await Order.countDocuments({
    status: {
      $in: ["confirmed", "preparing"],
    },
  });

  // -------------------------------------------------------------
  // ON-TIME DELIVERY RATE
  // -------------------------------------------------------------
  const onTimeRate = totalOrders
    ? Math.round((completedDeliveries / totalOrders) * 100)
    : 0;

  // -------------------------------------------------------------
  // ORDER TREND
  //
  // Today:
  //   hourly trend
  //
  // Week / Month / All:
  //   daily trend
  // -------------------------------------------------------------
  let dailyTrend = [];
  let hourlyTrend = [];

  if (range === "today") {
    hourlyTrend = await Order.aggregate([
      {
        $match: baseFilter,
      },
      {
        $group: {
          _id: {
            $hour: "$createdAt",
          },
          orders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const trendByHour = Array.from({ length: 24 }, (_, hour) => {
      const found = hourlyTrend.find((item) => item._id === hour);

      return {
        hour,
        orders: found ? found.orders : 0,
      };
    });

    const lunchWindow = trendByHour
      .filter((item) => item.hour >= 12 && item.hour < 15)
      .reduce((sum, item) => sum + item.orders, 0);

    const dinnerRush = trendByHour
      .filter((item) => item.hour >= 19 && item.hour < 22)
      .reduce((sum, item) => sum + item.orders, 0);

    const lateNight = trendByHour
      .filter((item) => item.hour >= 22 || item.hour < 2)
      .reduce((sum, item) => sum + item.orders, 0);

    const peakHourEntry = trendByHour.reduce(
      (max, item) => (item.orders > max.orders ? item : max),
      trendByHour[0],
    );

    dailyTrend = {
      type: "hourly",
      hourly: trendByHour,
      peak: peakHourEntry,
      lunchWindow,
      dinnerRush,
      lateNight,
    };
  } else {
    // -----------------------------------------------------------
    // DAILY TREND FOR WEEK / MONTH / ALL
    // -----------------------------------------------------------
    const trendMatch = {
      status: { $ne: "cancelled" },
    };

    if (rangeStart && rangeEnd) {
      trendMatch.createdAt = {
        $gte: rangeStart,
        $lte: rangeEnd,
      };
    }

    const dailyAgg = await Order.aggregate([
      {
        $match: trendMatch,
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
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
          "_id.day": 1,
        },
      },
    ]);

    dailyTrend = {
      type: "daily",
      daily: dailyAgg.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(
          2,
          "0",
        )}-${String(item._id.day).padStart(2, "0")}`,
        orders: item.orders,
        revenue: item.revenue,
      })),
    };
  }

  // -------------------------------------------------------------
  // PAYMENT CHANNELS
  // -------------------------------------------------------------
  const paymentBreakdown = await Order.aggregate([
    {
      $match: baseFilter,
    },
    {
      $group: {
        _id: "$paymentMethod",
        revenue: {
          $sum: "$totalAmount",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const totalPaymentRevenue =
    paymentBreakdown.reduce(
      (sum, payment) => sum + (payment.revenue || 0),
      0,
    ) || 1;

  const paymentChannels = paymentBreakdown.map((payment) => ({
    method: payment._id,
    revenue: payment.revenue || 0,
    count: payment.count || 0,
    percentage: Math.round(
      ((payment.revenue || 0) / totalPaymentRevenue) * 100,
    ),
  }));

  // -------------------------------------------------------------
  // KITCHEN OPERATIONS
  // -------------------------------------------------------------
  const [preparingCount, outForDeliveryCount, completedCount] =
    await Promise.all([
      Order.countDocuments({
        status: "preparing",
      }),

      Order.countDocuments({
        status: "out_for_delivery",
      }),

      Order.countDocuments({
        ...baseFilter,
        status: "delivered",
      }),
    ]);

  // -------------------------------------------------------------
  // RECENT ORDERS
  // -------------------------------------------------------------
  const recentOrders = await Order.find({})
    .populate("customer", "fullName")
    .sort({
      createdAt: -1,
    })
    .limit(5);

  // -------------------------------------------------------------
  // RESPONSE
  // -------------------------------------------------------------
  res.json({
    success: true,

    range,

    summary: {
      totalRevenue: selectedPeriodRevenue,
      revenueChangePct,
      totalOrders,
      activeInKitchen: activeInKitchenCount,
      completedDeliveries,
      onTimeDeliveryRate: onTimeRate,
      avgOrderPreparationMinutes: Math.round(avgPrepAgg[0]?.avgMinutes || 0),
    },

    dailyTrend,

    paymentChannels,

    kitchenOps: {
      preparing: preparingCount,
      onTheRoad: outForDeliveryCount,
      completed: completedCount,
    },

    recentOrders,
  });
});

module.exports = {
  getDashboardOverview,
};
