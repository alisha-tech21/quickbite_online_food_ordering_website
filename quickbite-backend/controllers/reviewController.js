const asyncHandler = require("express-async-handler");

const Review = require("../models/Review");

// -----------------------------------------------------------------------
// Public: Home page reviews
// -----------------------------------------------------------------------

const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isHidden: false })
    .populate("customer", "fullName")
    .populate("restaurant", "name")
    .sort({ createdAt: -1 })
    .limit(6);

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

// -----------------------------------------------------------------------
// Public: Reviews shown on restaurant page
// GET /api/restaurants/:id/reviews
// -----------------------------------------------------------------------

const getRestaurantReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    restaurant: req.params.id,
    isHidden: false,
  })
    .populate("customer", "fullName avatarUrl")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    reviews,
  });
});

// -----------------------------------------------------------------------
// Admin: Get all reviews
// -----------------------------------------------------------------------

const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("customer", "fullName")
    .populate("restaurant", "name")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    reviews,
  });
});

// -----------------------------------------------------------------------
// Admin: Hide / Show review
// -----------------------------------------------------------------------

const moderateReview = asyncHandler(async (req, res) => {
  const { isHidden } = req.body;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isHidden },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  res.json({
    success: true,
    review,
  });
});

// -----------------------------------------------------------------------
// Admin: Reply to review
// PATCH /api/admin/reviews/:id/reply
// -----------------------------------------------------------------------

const replyToReview = asyncHandler(async (req, res) => {
  const { adminReply } = req.body;

  if (!adminReply || !adminReply.trim()) {
    res.status(400);
    throw new Error("Reply cannot be empty");
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      adminReply: adminReply.trim(),
      adminReplyAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("customer", "fullName")
    .populate("restaurant", "name");

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  res.json({
    success: true,
    review,
  });
});

// -----------------------------------------------------------------------
// Admin: Delete review
// -----------------------------------------------------------------------

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  res.json({
    success: true,
    message: "Review deleted",
  });
});

// -----------------------------------------------------------------------

module.exports = {
  getAllReviews,
  getRestaurantReviews,
  getAllReviewsAdmin,
  moderateReview,
  replyToReview,
  deleteReview,
};
