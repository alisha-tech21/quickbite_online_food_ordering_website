const mongoose = require('mongoose');

// Singleton document — there is only ever one Settings row. Matches
// "Settings & System Preferences" admin screen exactly (General tab and
// Payment Methods tab shown in the design; Delivery & Hours / Notifications
// tabs follow the same pattern and can be extended the same way).
const settingsSchema = new mongoose.Schema(
  {
    storeBrandName: { type: String, default: 'QuickBite Flagship Kitchen' },
    billingCurrency: { type: String, default: 'PKR' },
    supportPhone: String,
    supportEmail: String,

    acceptingOnlineOrders: { type: Boolean, default: true },
    baseDeliveryFee: { type: Number, default: 100 },
    freeDeliveryAbove: { type: Number, default: 1500 },
    deliverySlaMinMinutes: { type: Number, default: 30 },
    deliverySlaMaxMinutes: { type: Number, default: 45 },

    paymentMethods: {
      jazzcash: { type: Boolean, default: true },
      easypaisa: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
      cod: { type: Boolean, default: true },
    },

    taxPercentage: { type: Number, default: 0 }, // GST %, applied at checkout
    packagingFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Enforce a single document via a fixed helper rather than a unique index
// hack — simpler to reason about in controllers.
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
