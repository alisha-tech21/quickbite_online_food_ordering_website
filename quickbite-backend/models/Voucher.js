const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // "QUICK500"
    title: String, // "Get Rs. 500 OFF on Orders Above Rs. 1,500"
    description: String,

    discountType: { type: String, enum: ['flat', 'percentage', 'free_delivery'], required: true },
    discountValue: { type: Number, default: 0 }, // 500 (PKR) or 20 (%)
    maxDiscount: Number, // caps a percentage discount

    minOrderAmount: { type: Number, default: 0 },

    // Optional restrictions
    applicableRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }], // empty = all
    validDays: [String], // ["Fri", "Sat"] for weekend-only deals
    validFrom: Date,
    validUntil: Date,

    usageLimitPerUser: { type: Number, default: 1 },
    totalUsageLimit: Number,
    timesUsed: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Voucher', voucherSchema);
