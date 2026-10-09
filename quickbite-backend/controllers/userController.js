const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");
const Order = require("../models/Order");
const { sendWelcomeEmail } = require("../utils/notify");

// -----------------------------------------------------------------------
// @desc    "Customer & Staff Management" table — list + filter + search
// @route   GET /api/admin/users?role=&status=&search=&page=&limit=
// @access  Private/Admin
// -----------------------------------------------------------------------
const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role && role !== "all") filter.role = role;
  if (status && status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    users: users.map((u) => u.toSafeObject()),
  });
});

// -----------------------------------------------------------------------
// @desc    Summary cards on Users & Staff screen (Total Registered, Active
//          Customers, Delivery Riders, Kitchen & Ops Staff)
// @route   GET /api/admin/users/stats
// @access  Private/Admin
// -----------------------------------------------------------------------
const getUserStats = asyncHandler(async (req, res) => {
  const [
    totalRegistered,
    activeCustomers,
    deliveryRiders,
    onRoadRiders,
    kitchenOpsStaff,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "customer", status: "active" }),
    User.countDocuments({ role: "rider" }),
    User.countDocuments({ role: "rider", status: "on_delivery" }),
    User.countDocuments({ role: { $in: ["kitchen_staff", "branch_manager"] } }),
  ]);

  res.json({
    success: true,
    totalRegistered,
    activeCustomers,
    deliveryRiders,
    ridersCurrentlyOnRoad: onRoadRiders,
    kitchenOpsStaff,
  });
});

// -----------------------------------------------------------------------
// @desc    "Add New Member" modal — admin creates customer/rider/kitchen
//          staff/branch manager
// @route   POST /api/admin/users
// @access  Private/Admin
// -----------------------------------------------------------------------
const createMember = asyncHandler(async (req, res) => {
  const {
    role,
    fullName,
    email,
    phone,
    countryCode,
    branch,
    vehicle,
    licensePlate,
    initialStatus,
    sendWelcome,
  } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    res.status(400);
    throw new Error("A member with this email or phone already exists");
  }

  // Temp password — the "Send welcome email with temporary password" flow
  const tempPassword = crypto.randomBytes(6).toString("hex");

  const user = await User.create({
    fullName,
    email,
    phone,
    countryCode: countryCode || "+92",
    password: tempPassword,
    role,
    isEmailVerified: true, // admin-created accounts skip self-service OTP
    status: initialStatus === "pending" ? "pending" : "active",
    riderInfo:
      role === "rider"
        ? { vehicle, licensePlate, hubAssignment: branch }
        : undefined,
    staffInfo: ["kitchen_staff", "branch_manager"].includes(role)
      ? { branch }
      : undefined,
  });

  if (sendWelcome) {
    await sendWelcomeEmail(user.email, tempPassword);
  }

  res.status(201).json({ success: true, user: user.toSafeObject() });
});

// -----------------------------------------------------------------------
// @desc    Edit a user/member (pencil icon in the table)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
// -----------------------------------------------------------------------
const updateMember = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Member not found");
  }

  const editable = [
    "fullName",
    "email",
    "phone",
    "status",
    "role",
    "riderInfo",
    "staffInfo",
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// -----------------------------------------------------------------------
// @desc    Suspend / reactivate a member (the "..." actions menu)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
// -----------------------------------------------------------------------
const updateMemberStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // active | suspended | offline | pending
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );
  if (!user) {
    res.status(404);
    throw new Error("Member not found");
  }
  res.json({ success: true, user: user.toSafeObject() });
});

// -----------------------------------------------------------------------
// @desc    Delete a member
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
// -----------------------------------------------------------------------
const deleteMember = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Member not found");
  }
  res.json({ success: true, message: "Member removed" });
});

// -----------------------------------------------------------------------
// Customer-facing profile & address book
// -----------------------------------------------------------------------

// @route   PUT /api/users/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const editable = ["fullName", "email"];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @route   POST /api/users/me/addresses
const addAddress = asyncHandler(async (req, res) => {
  const { label, line1, city, area, lat, lng, instructions, isPrimary } =
    req.body;

  if (isPrimary) {
    req.user.addresses.forEach((a) => (a.isPrimary = false));
  }
  req.user.addresses.push({
    label,
    line1,
    city,
    area,
    lat,
    lng,
    instructions,
    isPrimary,
  });
  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses });
});

// @route   PUT /api/users/me/addresses/:addressId
const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }
  Object.assign(address, req.body);
  if (req.body.isPrimary) {
    req.user.addresses.forEach((a) => {
      if (String(a._id) !== req.params.addressId) a.isPrimary = false;
    });
  }
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// @route   DELETE /api/users/me/addresses/:addressId
const deleteAddress = asyncHandler(async (req, res) => {
  req.user.addresses.id(req.params.addressId)?.deleteOne();
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// @route   GET /api/users/me/order-history-summary (used to recompute stats)
const recomputeCustomerStats = async (userId) => {
  const stats = await Order.aggregate([
    { $match: { customer: userId, status: "delivered" } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
      },
    },
  ]);
  const { totalOrders = 0, totalSpent = 0 } = stats[0] || {};
  await User.findByIdAndUpdate(userId, { totalOrders, totalSpent });
};

module.exports = {
  getUsers,
  getUserStats,
  createMember,
  updateMember,
  updateMemberStatus,
  deleteMember,
  updateMyProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  recomputeCustomerStats,
};
