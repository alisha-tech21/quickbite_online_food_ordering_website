const mongoose = require("mongoose");

const PAYMENT_METHODS = ["jazzcash", "easypaisa", "card"];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const paymentTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    checkoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },

    accountNumber: String,

    gatewayReference: String,

    paidAt: Date,

    failedAt: Date,

    refundedAt: Date,

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
