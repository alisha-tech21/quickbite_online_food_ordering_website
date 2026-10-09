const asyncHandler = require("express-async-handler");
const Settings = require("../models/Settings");

// Public settings for customer side
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  res.json({
    success: true,
    settings: {
      storeBrandName: settings.storeBrandName,
      billingCurrency: settings.billingCurrency,

      acceptingOnlineOrders: settings.acceptingOnlineOrders,

      baseDeliveryFee: settings.baseDeliveryFee,
      freeDeliveryAbove: settings.freeDeliveryAbove,

      deliverySlaMinMinutes: settings.deliverySlaMinMinutes,
      deliverySlaMaxMinutes: settings.deliverySlaMaxMinutes,

      taxPercentage: settings.taxPercentage,
      packagingFee: settings.packagingFee,

      paymentMethods: {
        jazzcash: settings.paymentMethods?.jazzcash ?? true,
        easypaisa: settings.paymentMethods?.easypaisa ?? true,
        card: settings.paymentMethods?.card ?? true,
        cod: settings.paymentMethods?.cod ?? true,
      },
    },
  });
});

// Admin: get complete settings
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  res.json({
    success: true,
    settings,
  });
});

// Admin: update complete settings
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  Object.assign(settings, req.body);

  await settings.save();

  res.json({
    success: true,
    settings,
  });
});

module.exports = {
  getPublicSettings,
  getSettings,
  updateSettings,
};
