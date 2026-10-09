const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const generateToken = require("../utils/generateToken");
const {
  generateOtp,
  sendOtpEmail,
  sendOtpSms,
  sendResetEmail,
} = require("../utils/notify");

const OTP_EXPIRES_MINUTES = parseInt(
  process.env.OTP_EXPIRES_MINUTES || "5",
  10,
);
// Sirf text (string) qabool karo. Object jaise {"$ne": null} reject ho jata hai.
const mustBeText = (res, ...values) => {
  if (values.some((v) => v !== undefined && typeof v !== "string")) {
    res.status(400);
    throw new Error("Invalid input");
  }
};
// -----------------------------------------------------------------------
// @desc    Register screen — "Create Your QuickBite Account"
// @route   POST /api/auth/register
// @access  Public
// -----------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, countryCode, phone, password, marketingOptIn } =
    req.body;

  if (!fullName || !email || !phone || !password) {
    res.status(400);
    throw new Error("Full name, email, phone and password are required");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email or phone already exists");
  }

  const user = await User.create({
    fullName,
    email,
    countryCode: countryCode || "+92",
    phone,
    password,
    marketingOptIn: !!marketingOptIn,
    status: "pending", // becomes 'active' once email is verified
  });

  // Immediately trigger the OTP step ("Step 2 of 2: Security Check") —
  // sent to email rather than phone.
  const code = generateOtp();
  await Otp.create({
    identifier: user.email,
    code,
    purpose: "email_verification",
    expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
  });
  await sendOtpEmail(user.email, code);

  res.status(201).json({
    success: true,
    message: "Account created. Verification code sent to your email.",
    userId: user._id,
    email: user.email,
  });
});

// -----------------------------------------------------------------------
// @desc    OTP screen — "Verify Your Phone Number"
// @route   POST /api/auth/verify-otp
// @access  Public
// -----------------------------------------------------------------------
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const otpDoc = await Otp.findOne({
    identifier: email,
    purpose: "email_verification",
    consumed: false,
  }).sort({ _id: -1 });

  if (!otpDoc || otpDoc.code !== code || otpDoc.expiresAt < new Date()) {
    res.status(400);
    throw new Error("Invalid or expired verification code");
  }

  otpDoc.consumed = true;
  await otpDoc.save();

  const user = await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true, status: "active" },
    { new: true },
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    success: true,
    message: "Email verified successfully",
    token: generateToken(user._id, user.role),
    user: user.toSafeObject(),
  });
});

// -----------------------------------------------------------------------
// @desc    Resend OTP — "Resend SMS" / "via WhatsApp" links
// @route   POST /api/auth/resend-otp
// @access  Public
// -----------------------------------------------------------------------
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const code = generateOtp();
  await Otp.create({
    identifier: email,
    code,
    purpose: "email_verification",
    expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
  });

  await sendOtpEmail(email, code);

  res.json({
    success: true,
    message: "Verification code resent to your email",
  });
});

// -----------------------------------------------------------------------
// @desc    Sign In screen — Email & Password tab
// @route   POST /api/auth/login
// @access  Public
// -----------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  mustBeText(res, email, phone, password);
  if (!password) {
    res.status(400);
    throw new Error("Password is required");
  }
  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  if (user.status === "suspended") {
    res.status(403);
    throw new Error("This account has been suspended. Contact support.");
  }
  if (!user.isEmailVerified) {
    res.status(403);
    throw new Error("Email not verified. Please complete verification first.");
  }

  res.json({
    success: true,
    token: generateToken(user._id, user.role),
    user: user.toSafeObject(),
  });
});

// -----------------------------------------------------------------------
// @desc    "Forgot Your Password?" — Reset via Email tab
// @route   POST /api/auth/forgot-password
// @access  Public
// -----------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, phone, method } = req.body; // method: 'email' | 'sms'

  const user = await User.findOne(email ? { email } : { phone });
  // Always respond success even if not found, to avoid leaking which
  // emails/phones are registered.
  if (!user) {
    return res.json({
      success: true,
      message: "If an account exists, reset instructions were sent.",
    });
  }

  if (method === "sms") {
    const code = generateOtp();
    await Otp.create({
      identifier: user.phone,
      code,
      purpose: "password_reset",
      expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
    });
    await sendOtpSms(user.phone, code);
  } else {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendResetEmail(user.email, resetUrl);
  }

  res.json({
    success: true,
    message: "If an account exists, reset instructions were sent.",
  });
});

// -----------------------------------------------------------------------
// @desc    Reset password using the emailed token or SMS OTP
// @route   POST /api/auth/reset-password
// @access  Public
// -----------------------------------------------------------------------
const resetPassword = asyncHandler(async (req, res) => {
  const { token, otpCode, phone, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  let user;

  if (token) {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });
  } else if (otpCode && phone) {
    const otpDoc = await Otp.findOne({
      identifier: phone,
      purpose: "password_reset",
      consumed: false,
    }).sort({ _id: -1 });
    if (otpDoc && otpDoc.code === otpCode && otpDoc.expiresAt > new Date()) {
      otpDoc.consumed = true;
      await otpDoc.save();
      user = await User.findOne({ phone });
    }
  }

  if (!user) {
    res.status(400);
    throw new Error("Reset link/code is invalid or has expired");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully. You can now sign in.",
  });
});

// -----------------------------------------------------------------------
// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
// -----------------------------------------------------------------------
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
};
