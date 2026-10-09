const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tagline: String,
    coverImage: String,
    coverImagePublicId: String,

    logoUrl: String,
    logoPublicId: String,

    cuisines: [String],
    badges: [String],

    address: {
      line1: String,
      area: String,
      city: String,
      lat: Number,
      lng: Number,
    },

    rating: { type: Number, default: 0 }, // 4.8
    reviewCount: { type: Number, default: 0 },

    deliveryTimeMin: { type: Number, default: 20 },
    deliveryTimeMax: { type: Number, default: 30 },
    deliveryFee: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },

    priceCategory: {
      type: String,
      enum: ["budget", "moderate", "premium"],
      default: "moderate",
    },

    isOpen: { type: Boolean, default: true },
    openingHours: { type: String, default: "11:00 AM - 11:30 PM" },

    isHalalCertified: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

restaurantSchema.index({ name: "text", tagline: "text", cuisines: "text" });

module.exports = mongoose.model("Restaurant", restaurantSchema);
