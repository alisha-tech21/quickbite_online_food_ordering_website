const mongoose = require("mongoose");

// Short-lived OTP documents. TTL index auto-deletes expired codes so the
// collection never needs manual cleanup.
const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // phone or email
  code: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["email_verification", "password_reset"],
    required: true,
  },
  expiresAt: { type: Date, required: true },
  consumed: { type: Boolean, default: false },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
