import React, { useEffect, useMemo, useState } from "react";
import {
  Star,
  Search,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  X,
  Store,
  UserRound,
  CalendarDays,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Send,
  MessageCircleReply,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/adminLayout/AdminLayout";
import axiosClient from "../../api/axiosClient";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  const [selectedReview, setSelectedReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);

  const loadReviews = async () => {
    try {
      setLoading(true);

      const response = await axiosClient.get("/admin/reviews");

      if (response.data?.success) {
        setReviews(response.data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);

      toast.error(error?.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const getCustomerName = (review) => {
    return review?.customer?.fullName || "Unknown Customer";
  };

  const getRestaurantName = (review) => {
    return review?.restaurant?.name || "Unknown Restaurant";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredReviews = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return reviews.filter((review) => {
      const customerName = getCustomerName(review).toLowerCase();
      const restaurantName = getRestaurantName(review).toLowerCase();
      const comment = (review.comment || "").toLowerCase();
      const adminReply = (review.adminReply || "").toLowerCase();

      const matchesSearch =
        !search ||
        customerName.includes(search) ||
        restaurantName.includes(search) ||
        comment.includes(search) ||
        adminReply.includes(search);

      const matchesRating =
        ratingFilter === "all" ||
        Number(review.rating) === Number(ratingFilter);

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && !review.isHidden) ||
        (visibilityFilter === "hidden" && review.isHidden);

      return matchesSearch && matchesRating && matchesVisibility;
    });
  }, [reviews, searchTerm, ratingFilter, visibilityFilter]);

  const visibleCount = reviews.filter((review) => !review.isHidden).length;

  const hiddenCount = reviews.filter((review) => review.isHidden).length;

  const averageRating = reviews.length
    ? (
        reviews.reduce(
          (total, review) => total + Number(review.rating || 0),
          0,
        ) / reviews.length
      ).toFixed(1)
    : "0.0";

  const handleModerate = async (review) => {
    try {
      setActionLoading(review._id);

      const response = await axiosClient.patch(
        `/admin/reviews/${review._id}/moderate`,
        {
          isHidden: !review.isHidden,
        },
      );

      if (response.data?.success) {
        const updatedReview = {
          ...review,
          isHidden: !review.isHidden,
        };

        setReviews((currentReviews) =>
          currentReviews.map((item) =>
            item._id === review._id ? updatedReview : item,
          ),
        );

        if (selectedReview?._id === review._id) {
          setSelectedReview(updatedReview);
        }

        toast.success(
          review.isHidden ? "Review is now visible" : "Review has been hidden",
        );
      }
    } catch (error) {
      console.error("Error moderating review:", error);

      toast.error(error?.response?.data?.message || "Failed to update review");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async () => {
    if (!selectedReview?._id) return;

    try {
      setActionLoading(selectedReview._id);

      const response = await axiosClient.delete(
        `/admin/reviews/${selectedReview._id}`,
      );

      if (response.data?.success) {
        setReviews((currentReviews) =>
          currentReviews.filter((review) => review._id !== selectedReview._id),
        );

        toast.success("Review deleted successfully");

        setSelectedReview(null);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error deleting review:", error);

      toast.error(error?.response?.data?.message || "Failed to delete review");
    } finally {
      setActionLoading("");
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review?.adminReply || "");
    setShowReplyModal(true);
    setOpenActionId(null);
  };

  const handleReply = async () => {
    if (!selectedReview?._id) return;

    const trimmedReply = replyText.trim();

    if (!trimmedReply) {
      toast.error("Please write a reply first.");
      return;
    }

    try {
      setReplyLoading(true);

      const response = await axiosClient.patch(
        `/admin/reviews/${selectedReview._id}/reply`,
        {
          adminReply: trimmedReply,
        },
      );

      if (response.data?.success) {
        const updatedReview = response.data.review;

        setReviews((currentReviews) =>
          currentReviews.map((review) =>
            review._id === selectedReview._id
              ? {
                  ...review,
                  ...updatedReview,
                }
              : review,
          ),
        );

        setSelectedReview((currentReview) =>
          currentReview
            ? {
                ...currentReview,
                ...updatedReview,
              }
            : currentReview,
        );

        setReplyText(updatedReview?.adminReply || trimmedReply);

        toast.success(
          selectedReview?.adminReply
            ? "Response updated successfully"
            : "Response sent successfully",
        );

        setShowReplyModal(false);
      }
    } catch (error) {
      console.error("Error replying to review:", error);

      toast.error(error?.response?.data?.message || "Failed to send response");
    } finally {
      setReplyLoading(false);
    }
  };

  const renderStars = (rating, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Number(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
      <div className="min-h-[calc(100vh-82px)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          {/* HEADER */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>

                <span className="rounded-full bg-[#fff1ed] px-3 py-1 text-xs font-semibold text-[#ff6247]">
                  {reviews.length} Total
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Review customer feedback across all restaurants and manage
                visibility.
              </p>
            </div>

            <button
              type="button"
              onClick={loadReviews}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* STATS */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* TOTAL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Total Reviews
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reviews.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1ed] text-[#ff6247]">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>

            {/* AVERAGE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Average Rating
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">
                      {averageRating}
                    </p>

                    <Star size={18} className="fill-amber-400 text-amber-400" />
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Star size={20} />
                </div>
              </div>
            </div>

            {/* VISIBLE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Visible
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {visibleCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </div>

            {/* HIDDEN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Hidden
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-600">
                    {hiddenCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <EyeOff size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search customer, restaurant or review..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#ff6247] focus:bg-white focus:ring-2 focus:ring-[#ff6247]/10"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 outline-none focus:border-[#ff6247]"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>

                <select
                  value={visibilityFilter}
                  onChange={(event) => setVisibilityFilter(event.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 outline-none focus:border-[#ff6247]"
                >
                  <option value="all">All Reviews</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* REVIEWS TABLE */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Restaurant
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Rating
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Review
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2
                            size={28}
                            className="animate-spin text-[#ff6247]"
                          />

                          <p className="mt-3 text-sm font-medium text-slate-600">
                            Loading reviews...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                            <MessageSquare
                              size={21}
                              className="text-slate-400"
                            />
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No reviews found
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Try changing your search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr
                        key={review._id}
                        className="transition hover:bg-slate-50/60"
                      >
                        {/* CUSTOMER */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#ff6247]">
                              <UserRound size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {getCustomerName(review)}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Customer
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* RESTAURANT */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Store size={16} />
                            </div>

                            <span className="text-sm font-medium text-slate-700">
                              {getRestaurantName(review)}
                            </span>
                          </div>
                        </td>

                        {/* RATING */}
                        <td className="px-5 py-4">
                          <div>
                            {renderStars(review.rating, 15)}

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {review.rating}/5
                            </p>
                          </div>
                        </td>

                        {/* COMMENT */}
                        <td className="max-w-[330px] px-5 py-4">
                          <p
                            className="line-clamp-2 text-sm leading-5 text-slate-600"
                            title={review.comment || ""}
                          >
                            {review.comment || "No comment provided."}
                          </p>

                          {review.adminReply && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#ff6247]">
                              <MessageCircleReply size={12} />
                              Responded
                            </div>
                          )}
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays size={15} />
                            {formatDate(review.createdAt)}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          {review.isHidden ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                              <EyeOff size={13} />
                              Hidden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 size={13} />
                              Visible
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="relative flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionId(
                                  openActionId === review._id
                                    ? null
                                    : review._id,
                                )
                              }
                              disabled={actionLoading === review._id}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Actions"
                            >
                              {actionLoading === review._id ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <MoreVertical size={18} />
                              )}
                            </button>

                            {openActionId === review._id && (
                              <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl">
                                {/* VIEW */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setOpenActionId(null);
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Eye size={16} />
                                  View Review
                                </button>

                                {/* REPLY */}
                                <button
                                  type="button"
                                  onClick={() => openReplyModal(review)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <MessageCircleReply
                                    size={16}
                                    className="text-[#ff6247]"
                                  />
                                  {review.adminReply
                                    ? "Edit Response"
                                    : "Reply to Review"}
                                </button>

                                {/* HIDE / SHOW */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleModerate(review);
                                  }}
                                  disabled={actionLoading === review._id}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {review.isHidden ? (
                                    <>
                                      <Eye
                                        size={16}
                                        className="text-emerald-600"
                                      />
                                      Show Review
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff
                                        size={16}
                                        className="text-amber-600"
                                      />
                                      Hide Review
                                    </>
                                  )}
                                </button>

                                {/* DELETE */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setShowDeleteModal(true);
                                    setOpenActionId(null);
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                  Delete Review
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredReviews.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredReviews.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {reviews.length}
                  </span>{" "}
                  reviews
                </span>

                <span className="text-xs text-slate-400">
                  Hidden reviews are not shown to customers.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEW REVIEW MODAL */}
      {selectedReview && !showDeleteModal && !showReplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Review Details
                </h2>

                <p className="mt-1 text-xs text-slate-400">Customer feedback</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {/* CUSTOMER */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1ed] text-[#ff6247]">
                  <UserRound size={20} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {getCustomerName(selectedReview)}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(selectedReview.createdAt)}
                  </p>
                </div>
              </div>

              {/* RESTAURANT */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-[#ff6247]" />

                  <span className="text-sm font-semibold text-slate-700">
                    {getRestaurantName(selectedReview)}
                  </span>
                </div>
              </div>

              {/* RATING */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Rating
                </p>

                <div className="flex items-center gap-3">
                  {renderStars(selectedReview.rating, 20)}

                  <span className="text-sm font-bold text-slate-700">
                    {selectedReview.rating}/5
                  </span>
                </div>
              </div>

              {/* FULL COMMENT */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Customer Comment
                </p>

                <div className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600">
                  {selectedReview.comment || "No comment provided."}
                </div>
              </div>

              {/* ADMIN RESPONSE */}
              {selectedReview.adminReply && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      QuickBite Response
                    </p>

                    {selectedReview.adminReplyAt && (
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(selectedReview.adminReplyAt)}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#ff6247]/20 bg-[#fff8f5] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff1ed] text-[#ff6247]">
                        <MessageCircleReply size={17} />
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {selectedReview.adminReply}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* VISIBILITY */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">
                  Review visibility
                </span>

                {selectedReview.isHidden ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Hidden
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Visible
                  </span>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => openReplyModal(selectedReview)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#ff6247] bg-white px-4 py-2.5 text-sm font-semibold text-[#ff6247] transition hover:bg-[#fff8f5]"
              >
                <MessageCircleReply size={15} />
                {selectedReview.adminReply ? "Edit Response" : "Reply"}
              </button>

              <button
                type="button"
                onClick={() => handleModerate(selectedReview)}
                disabled={actionLoading === selectedReview._id}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9533a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === selectedReview._id && (
                  <Loader2 size={15} className="animate-spin" />
                )}

                {selectedReview.isHidden ? "Show Review" : "Hide Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPLY MODAL */}
      {showReplyModal && selectedReview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedReview.adminReply
                    ? "Edit Response"
                    : "Reply to Review"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Send a response to the customer
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyText("");
                  setSelectedReview(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-5 px-6 py-6">
              {/* CUSTOMER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ed] text-[#ff6247]">
                    <UserRound size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {getCustomerName(selectedReview)}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {getRestaurantName(selectedReview)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {renderStars(selectedReview.rating, 15)}

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedReview.rating}/5
                  </p>
                </div>
              </div>

              {/* CUSTOMER REVIEW */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Customer Review
                </p>

                <div className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedReview.comment || "No comment provided."}
                </div>
              </div>

              {/* RESPONSE */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Your Response
                  </label>

                  <span className="text-[11px] text-slate-400">
                    {replyText.length}/1000
                  </span>
                </div>

                <textarea
                  value={replyText}
                  onChange={(event) => {
                    if (event.target.value.length <= 1000) {
                      setReplyText(event.target.value);
                    }
                  }}
                  rows={6}
                  maxLength={1000}
                  placeholder="Write a polite response to the customer..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#ff6247] focus:ring-2 focus:ring-[#ff6247]/10"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Keep your response helpful, professional, and respectful.
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyText("");
                  setSelectedReview(null);
                }}
                disabled={replyLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReply}
                disabled={replyLoading || !replyText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6247] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e9533a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {replyLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {selectedReview.adminReply
                      ? "Update Response"
                      : "Send Response"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={22} />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Delete Review?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This review will be permanently removed from the system. This
                action cannot be undone.
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Review by
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {getCustomerName(selectedReview)}
                </p>

                <div className="mt-2">
                  {renderStars(selectedReview.rating, 15)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedReview(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading === selectedReview._id}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === selectedReview._id && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Reviews;
