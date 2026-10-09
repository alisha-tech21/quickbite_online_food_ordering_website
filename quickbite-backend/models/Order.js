const mongoose = require("mongoose");

// ---------------------------------------------------------
// ORDER STATUS
// ---------------------------------------------------------

const ORDER_STATUSES = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// ---------------------------------------------------------
// PAYMENT METHODS
// ---------------------------------------------------------

const PAYMENT_METHODS = ["cod", "jazzcash", "easypaisa", "card"];

// ---------------------------------------------------------
// PAYMENT STATUS
// ---------------------------------------------------------

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

// ---------------------------------------------------------
// ORDER ITEM
// ---------------------------------------------------------

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    // Snapshot fields
    // These protect old orders if menu item changes later.

    name: {
      type: String,
      required: true,
    },

    unitPrice: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    notes: String,
  },
  {
    _id: false,
  },
);

// ---------------------------------------------------------
// STATUS HISTORY
// ---------------------------------------------------------

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },

    at: {
      type: Date,
      default: Date.now,
    },

    note: String,
  },
  {
    _id: false,
  },
);

// ---------------------------------------------------------
// ORDER
// ---------------------------------------------------------

const orderSchema = new mongoose.Schema(
  {
    // Example:
    // QB-82041
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerOrderNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // -----------------------------------------------------
    // CHECKOUT GROUP
    // -----------------------------------------------------

    // Multiple restaurant orders created from one checkout
    // will have the same checkoutId.

    checkoutId: {
      type: String,
      required: true,
      index: true,
    },

    // -----------------------------------------------------
    // CUSTOMER
    // -----------------------------------------------------

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // -----------------------------------------------------
    // RESTAURANT
    // -----------------------------------------------------

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    // -----------------------------------------------------
    // ITEMS
    // -----------------------------------------------------

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (value) => value.length > 0,
        message: "Order must contain at least one item",
      },
    },

    // -----------------------------------------------------
    // PRICING
    // -----------------------------------------------------

    itemsSubtotal: {
      type: Number,
      required: true,
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    packagingFee: {
      type: Number,
      default: 0,
    },

    voucherCode: String,

    voucherDiscount: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    tipAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    // -----------------------------------------------------
    // PAYMENT
    // -----------------------------------------------------

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },

    // Same payment transaction can belong to
    // multiple restaurant orders.

    paymentTransactionId: {
      type: String,
      index: true,
    },

    paymentAccountNumber: String,

    // -----------------------------------------------------
    // DELIVERY
    // -----------------------------------------------------

    deliveryAddress: {
      label: String,
      line1: String,
      area: String,
      city: String,
      lat: Number,
      lng: Number,
      instructions: String,
    },

    ecoFriendlyCutlery: {
      type: Boolean,
      default: false,
    },

    // -----------------------------------------------------
    // ORDER STATUS
    // -----------------------------------------------------

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "confirmed",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // -----------------------------------------------------
    // RIDER
    // -----------------------------------------------------

    assignedRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    riderEtaMinutes: Number,

    // -----------------------------------------------------
    // DELIVERY
    // -----------------------------------------------------

    deliveredAt: Date,

    // -----------------------------------------------------
    // CANCELLATION
    // -----------------------------------------------------

    cancellationReason: String,

    cancelledAt: Date,

    // -----------------------------------------------------
    // REVIEW
    // -----------------------------------------------------

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    reviewSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// ---------------------------------------------------------
// INDEXES
// ---------------------------------------------------------

orderSchema.index({
  customer: 1,
  createdAt: -1,
});

orderSchema.index({
  customer: 1,
  customerOrderNumber: 1,
});
orderSchema.index({
  restaurant: 1,
  status: 1,
});

orderSchema.index({
  checkoutId: 1,
  customer: 1,
});

orderSchema.index({
  paymentTransactionId: 1,
});

// ---------------------------------------------------------
// MODEL
// ---------------------------------------------------------

module.exports = mongoose.model("Order", orderSchema);

module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
