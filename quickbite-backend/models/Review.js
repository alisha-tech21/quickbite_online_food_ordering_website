const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
    },

    // Admin moderation
    isHidden: {
      type: Boolean,
      default: false,
    },

    // Admin response to customer review
    adminReply: {
      type: String,
      trim: true,
      default: "",
    },

    // When admin replied
    adminReplyAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// One review per order — prevents a customer from
// rating the same order twice.
reviewSchema.index({ order: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
