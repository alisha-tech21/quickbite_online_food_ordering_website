const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Matches "Add New Member" modal roles: Customer, Delivery Rider,
// Kitchen Staff, Branch Manager — plus Super Admin from the top nav.
const ROLES = ["customer", "rider", "kitchen_staff", "branch_manager", "admin"];

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" }, // Home, Work, etc.
    isPrimary: { type: Boolean, default: false },
    line1: String,
    city: String,
    area: String, // e.g. "Gulberg III"
    lat: Number,
    lng: Number,
    instructions: String, // "Please ring the bell once..."
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true },
    countryCode: { type: String, default: "+92" },
    password: { type: String, required: true, minlength: 8, select: false },

    role: { type: String, enum: ROLES, default: "customer" },

    // Screen: OTP verification (now sent to email, not phone)
    isEmailVerified: { type: Boolean, default: false },

    // Screen: Forgot password
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    addresses: [addressSchema],

    // "Customer & Staff Management" table fields
    status: {
      type: String,
      enum: ["active", "pending", "on_delivery", "offline", "suspended"],
      default: "pending",
    },
    avatarUrl: String,

    // Rider-only fields ("Vehicle & License Plate", branch/hub assignment)
    riderInfo: {
      vehicle: String,
      licensePlate: String,
      hubAssignment: String,
      rating: { type: Number, default: 5 },
      totalDeliveries: { type: Number, default: 0 },
    },

    // Kitchen staff / branch manager fields
    staffInfo: {
      station: String, // e.g. "KDS Station #2"
      title: String, // e.g. "Lead Cook", "Branch Manager"
      branch: String, // e.g. "Mall Road Kitchen Hub"
    },

    // Marketing opt-in checkbox from Register screen
    marketingOptIn: { type: Boolean, default: false },

    // Aggregate stats shown in admin tables (denormalized for fast reads,
    // recalculated whenever an order completes — see orderController)
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
