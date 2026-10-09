// Seeds the database with sample data that mirrors the QuickBite design
// screens exactly, so a fresh clone immediately looks like the mockups.
//
// Usage:
//   npm run seed          — populate
//   npm run seed:destroy  — wipe all collections
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Voucher = require("../models/Voucher");
const Settings = require("../models/Settings");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Otp = require("../models/Otp");

const run = async () => {
  await connectDB();

  if (process.argv.includes("-d")) {
    await Promise.all([
      User.deleteMany(),
      Restaurant.deleteMany(),
      MenuItem.deleteMany(),
      Voucher.deleteMany(),
      Settings.deleteMany(),
      Order.deleteMany(),
      Review.deleteMany(),
      Otp.deleteMany(),
    ]);
    console.log("All collections cleared.");
    return process.exit(0);
  }

  // ---- Settings (matches "Settings & System Preferences" screen) ----
  await Settings.deleteMany();
  await Settings.create({
    storeBrandName: "QuickBite Flagship Kitchen",
    billingCurrency: "PKR",
    supportPhone: "+92 300 8492000",
    supportEmail: "support@quickbite.pk",
    acceptingOnlineOrders: true,
    baseDeliveryFee: 100,
    freeDeliveryAbove: 1500,
    deliverySlaMinMinutes: 30,
    deliverySlaMaxMinutes: 45,
    paymentMethods: { jazzcash: true, easypaisa: true, card: true, cod: true },
  });

  // ---- Users ----
  await User.deleteMany();
  const admin = await User.create({
    fullName: "Alex Morgan",
    email: "admin@quickbite.pk",
    phone: "+923008492000",
    password: "Admin@12345",
    role: "admin",
    isEmailVerified: true,
    status: "active",
  });

  const branchManager = await User.create({
    fullName: "Usman Tariq",
    email: "usman.ops@quickbite.pk",
    phone: "+923334108871",
    password: "Manager@123",
    role: "branch_manager",
    isEmailVerified: true,
    status: "active",
    staffInfo: { title: "Branch Manager", branch: "Mall Road Kitchen Hub" },
  });

  const rider = await User.create({
    fullName: "Tariq Al-Mansoor",
    email: "tariq.rider@quickbite.pk",
    phone: "+923228910433",
    password: "Rider@12345",
    role: "rider",
    isEmailVerified: true,
    status: "active",
    riderInfo: {
      vehicle: "Honda 125",
      licensePlate: "LE-21-9842",
      hubAssignment: "DHA Phase 5 Hub",
      rating: 4.9,
    },
  });

  const customer = await User.create({
    fullName: "Sara Tariq",
    email: "sara.tariq@gmail.com",
    phone: "+923014489210",
    password: "Customer@123",
    role: "customer",
    isEmailVerified: true,
    status: "active",
    addresses: [
      {
        label: "Home",
        isPrimary: true,
        line1: "House 42, Block B-3, Gulberg III",
        city: "Lahore",
        area: "Gulberg III, Lahore",
        instructions:
          "Please ring the bell once, leave at door, no mayo in fries.",
      },
    ],
  });

  console.log("Users seeded. Sample logins:");
  console.log("  Admin:    admin@quickbite.pk / Admin@12345");
  console.log("  Manager:  usman.ops@quickbite.pk / Manager@123");
  console.log("  Rider:    tariq.rider@quickbite.pk / Rider@12345");
  console.log("  Customer: sara.tariq@gmail.com / Customer@123");

  // ---- Restaurants (matches restaurant listing screen) ----
  await Restaurant.deleteMany();
  const urbanGrill = await Restaurant.create({
    name: "Urban Grill & Smokehouse",
    tagline:
      "Artisanal Smash Burgers • 12-Hour Smoked Texas BBQ • Crispy Buttermilk Glazed Wings",
    cuisines: ["Burgers", "American BBQ", "Wings"],
    badges: ["QuickPass Free", "20% OFF up to Rs. 300"],
    address: {
      line1: "Main Boulevard",
      area: "Gulberg III, Lahore",
      city: "Lahore",
    },
    rating: 4.8,
    reviewCount: 1240,
    deliveryTimeMin: 20,
    deliveryTimeMax: 30,
    deliveryFee: 99,
    minOrder: 500,
    distanceKm: 1.8,
    priceCategory: "moderate",
    isFeatured: true,
    manager: branchManager._id,
  });

  const spiceHouse = await Restaurant.create({
    name: "Spice House Biryani & BBQ",
    tagline: "Dum Biryani • Mutton Handi • Seekh Kabab",
    cuisines: ["Pakistani & Desi"],
    badges: ["Staff Pick", "Free Garlic Naan w/ Rs. 1,500"],
    address: { line1: "", area: "Gulberg III, Lahore", city: "Lahore" },
    rating: 4.9,
    deliveryTimeMin: 25,
    deliveryTimeMax: 35,
    deliveryFee: 0,
    distanceKm: 2.4,
    priceCategory: "moderate",
  });

  const bellaNapoli = await Restaurant.create({
    name: "Bella Napoli & Pasta Lab",
    tagline: "Wood-Fired Pizza • Handmade Pasta",
    cuisines: ["Italian & Pizza"],
    badges: ["Chef Special"],
    address: {
      line1: "MM Alam Road",
      area: "Gulberg III, Lahore",
      city: "Lahore",
    },
    rating: 4.7,
    deliveryTimeMin: 15,
    deliveryTimeMax: 25,
    deliveryFee: 60,
    distanceKm: 1.2,
    priceCategory: "moderate",
  });

  // ---- Menu items (matches admin Menu Items table exactly) ----
  await MenuItem.deleteMany();
  await MenuItem.create([
    {
      restaurant: spiceHouse._id,
      name: "Chicken Biryani",
      description:
        "Spiced fragrant basmati rice cooked with tender marinated chicken pieces, infused with saffron, mint, and fried onions.",
      category: "Biryani",
      price: 450,
      isAvailable: true,
      tags: ["Bestseller"],
    },
    {
      restaurant: urbanGrill._id,
      name: "Gourmet Beef Smash Burger",
      description: "Double beef patty with melted cheddar",
      category: "Burgers",
      price: 650,
      isAvailable: true,
    },
    {
      restaurant: spiceHouse._id,
      name: "Mutton Shinwari Karahi",
      description: "Tender wok-fried mutton in ginger & chili",
      category: "BBQ & Karahi",
      price: 1450,
      isAvailable: true,
    },
    {
      restaurant: bellaNapoli._id,
      name: "Wood-Fired Margherita Pizza",
      description: "Fresh mozzarella, san marzano tomato, basil",
      category: "Pizza",
      price: 980,
      isAvailable: true,
    },
    {
      restaurant: bellaNapoli._id,
      name: "Molten Lava Cake",
      description: "Warm chocolate cake with liquid center",
      category: "Drinks & Desserts",
      price: 450,
      isAvailable: false,
    },
    {
      restaurant: urbanGrill._id,
      name: "Fresh Mint Lemonade",
      description: "Freshly squeezed lemons, mint leaves, crushed ice",
      category: "Drinks & Desserts",
      price: 180,
      isAvailable: true,
    },
    {
      restaurant: spiceHouse._id,
      name: "Chicken Malai Tikka",
      description: "Boneless grilled chicken cubes with cream",
      category: "BBQ & Karahi",
      price: 520,
      isAvailable: true,
    },
    {
      restaurant: urbanGrill._id,
      name: "Truffle Smash Double Burger",
      description:
        "Double smashed Angus patties, caramelized balsamic onions, aged Wisconsin cheddar, black truffle aioli on brioche",
      category: "Burgers",
      price: 1250,
      isAvailable: true,
      tags: ["Chef's #1 Pick", "Customizable"],
    },
    {
      restaurant: urbanGrill._id,
      name: "Fiery Peri Peri Wings (8 Pcs)",
      description:
        "Crispy buttermilk-dredged wings tossed in African bird's eye chili glaze, served with cool cucumber herb ranch dip",
      category: "Wings",
      price: 650,
      isAvailable: true,
      tags: ["Spicy"],
    },
  ]);
  // ---- Reviews (Matches "What our community says" section) ----
  await Review.deleteMany();

  const menuItem1 = await MenuItem.findOne({ restaurant: urbanGrill._id });
  const menuItem2 = await MenuItem.findOne({ restaurant: spiceHouse._id });
  const menuItem3 = await MenuItem.findOne({ restaurant: bellaNapoli._id });

  // Sample Orders with all required schema fields
  const sampleOrder1 = await Order.create({
    orderNumber: "QB-1001",
    checkoutId: "CHK-SEED-1001",
    customerOrderNumber: 1,
    customer: customer._id,
    restaurant: urbanGrill._id,
    items: [
      {
        menuItem: menuItem1._id,
        name: menuItem1.name || "Truffle Smash Burger",
        quantity: 1,
        unitPrice: 1250,
        price: 1250,
      },
    ],
    itemsSubtotal: 1250,
    totalAmount: 1250,
    deliveryAddress: { line1: "Gulberg III", city: "Lahore" },
    paymentMethod: "card",
    orderStatus: "delivered",
  });

  const sampleOrder2 = await Order.create({
    orderNumber: "QB-1002",
    checkoutId: "CHK-SEED-1002",
    customerOrderNumber: 2,
    customer: customer._id,
    restaurant: spiceHouse._id,
    items: [
      {
        menuItem: menuItem2._id,
        name: menuItem2.name || "Chicken Biryani",
        quantity: 1,
        unitPrice: 450,
        price: 450,
      },
    ],
    itemsSubtotal: 450,
    totalAmount: 450,
    deliveryAddress: { line1: "Gulberg III", city: "Lahore" },
    paymentMethod: "card",
    orderStatus: "delivered",
  });

  const sampleOrder3 = await Order.create({
    orderNumber: "QB-1003",
    checkoutId: "CHK-SEED-1003",
    customerOrderNumber: 3,
    customer: customer._id,
    restaurant: bellaNapoli._id,
    items: [
      {
        menuItem: menuItem3._id,
        name: menuItem3.name || "Wood-Fired Margherita Pizza",
        quantity: 1,
        unitPrice: 980,
        price: 980,
      },
    ],
    itemsSubtotal: 980,
    totalAmount: 980,
    deliveryAddress: { line1: "F-7/2", city: "Islamabad" },
    paymentMethod: "card",
    orderStatus: "delivered",
  });

  // Reviews creation
  await Review.create([
    {
      customer: customer._id,
      restaurant: urbanGrill._id,
      order: sampleOrder1._id,
      rating: 5,
      comment:
        "QuickBite delivers significantly faster than conventional delivery apps in Lahore. My Truffle Smash double burger arrived steaming hot with super crispy fries. Rider was polite and GPS tracking was accurate to the minute!",
      isHidden: false,
    },
    {
      customer: customer._id,
      restaurant: spiceHouse._id,
      order: sampleOrder2._id,
      rating: 5,
      comment:
        "The food curation here is truly unrivaled. The Butter Chicken Biryani Pot from Spice House has literally become our Friday family tradition. Thermal packaging keeps everything intact and piping hot.",
      isHidden: false,
    },
    {
      customer: customer._id,
      restaurant: bellaNapoli._id,
      order: sampleOrder3._id,
      rating: 5,
      comment:
        "Rider reached my apartment 6 minutes earlier than predicted during peak evening rush hour! Spill-proof packaging for noodle soups and gravies is a genuine game-changer.",
      isHidden: false,
    },
  ]);

  console.log(
    "Seed complete: restaurants, menu items, vouchers, and reviews created.",
  );
  // ---- Vouchers (matches "Exclusive Offers & Deals" screen) ----
  await Voucher.deleteMany();
  await Voucher.create([
    {
      code: "QUICK500",
      title: "Get Rs. 500 OFF on Orders Above Rs. 1,500",
      description:
        "Valid across all verified kitchens in Gulberg & DHA Lahore.",
      discountType: "flat",
      discountValue: 500,
      minOrderAmount: 1500,
      usageLimitPerUser: 1,
    },
    {
      code: "FEAST300",
      title: "Weekend Feast: Biryani & BBQ",
      discountType: "flat",
      discountValue: 300,
      minOrderAmount: 1200,
      usageLimitPerUser: 2,
    },
    {
      code: "FREEDEL",
      title: "Zero Delivery Fee Lahore",
      discountType: "free_delivery",
      minOrderAmount: 999,
      usageLimitPerUser: 5,
    },
    {
      code: "BOGOLARGE",
      title: "Artisan Pizza Club 1+1 Large",
      discountType: "percentage",
      discountValue: 50,
      maxDiscount: 980,
      minOrderAmount: 0,
      applicableRestaurants: [bellaNapoli._id],
      usageLimitPerUser: 1,
    },
    {
      code: "HELLO50",
      title: "50% OFF on your first order",
      discountType: "percentage",
      discountValue: 50,
      maxDiscount: 500,
      minOrderAmount: 0,
      usageLimitPerUser: 1,
    },
  ]);

  console.log("Seed complete: restaurants, menu items, and vouchers created.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
