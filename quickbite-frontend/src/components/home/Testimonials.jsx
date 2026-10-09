import React, { useState, useEffect } from "react";
// Import both API functions
import { getReviewsByRestaurant, getAllReviews } from "../../api/reviewApi";

const Testimonials = ({ restaurantId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        let data;

        // Check if restaurantId is provided
        if (restaurantId) {
          data = await getReviewsByRestaurant(restaurantId);
        } else {
          data = await getAllReviews();
        }

        if (data && data.success) {
          setReviews(data.reviews);
        } else {
          setError(data?.error || "Failed to fetch reviews.");
          setReviews([]);
        }
      } catch (err) {
        console.error("Testimonials fetch error:", err);
        setError("Could not connect to server to load reviews.");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [restaurantId]);

  // Helper to get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "QB";

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <section className="py-16 bg-[#f8f9fa] overflow-hidden" id="testimonials">
      {/* Slider animation */}
      <style>
        {`
          @keyframes testimonialsScroll {
            0% {
              transform: translateX(0);
            }

            100% {
              transform: translateX(calc(-33.333333% - 8px));
            }
          }

          .testimonials-track {
            animation: testimonialsScroll 28s linear infinite;
            width: max-content;
          }

          .testimonials-track:hover {
            animation-play-state: paused;
          }

          @media (prefers-reduced-motion: reduce) {
            .testimonials-track {
              animation: none;
            }
          }
        `}
      </style>

      <div className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="font-sans text-xs text-[#e33412] uppercase font-extrabold tracking-wider">
              Happy Foodies
            </span>

            <h2 className="font-sans text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
              What our community says
            </h2>
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0 font-sans text-xs text-gray-600">
            <span className="font-bold text-gray-900 text-sm">4.9 / 5</span>{" "}
            rating across 85,000+ happy diners
          </div>
        </div>

        {/* Reviews */}
        <div className="overflow-hidden">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-10">
              Loading community reviews...
            </p>
          ) : error ? (
            <p className="text-sm text-red-600 text-center py-10">
              Error: {error}
            </p>
          ) : reviews.length > 0 ? (
            <div className="relative">
              {/* =====================================================
                  CONTINUOUS HORIZONTAL REVIEW TRACK
              ====================================================== */}
              <div className="testimonials-track flex gap-6">
                {/* First set */}
                {reviews.map((review) => (
                  <div
                    key={`first-${review._id}`}
                    className="
                      w-[calc((100vw-32px)/1)]
                      sm:w-[calc((100vw-64px)/2)]
                      lg:w-[calc((100vw-144px)/3)]
                      max-w-[430px]
                      shrink-0
                      bg-white
                      p-6
                      rounded-3xl
                      shadow-sm
                      border
                      border-gray-100
                      flex
                      flex-col
                      justify-between
                      hover:shadow-xl
                      transition-shadow
                    "
                  >
                    <div>
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-[#e33412] mb-3">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <span
                            key={i}
                            className="material-symbols-outlined text-[18px]"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-900 font-medium leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-[#e33412] flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(review.customer?.fullName)}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-sans text-xs font-bold text-gray-900 truncate">
                            {review.customer?.fullName || "Anonymous User"}
                          </span>

                          <span
                            className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0"
                            title="Verified Foodie"
                          >
                            check_circle
                          </span>
                        </div>

                        <span className="text-[11px] text-gray-500 truncate">
                          {review.restaurant?.name
                            ? `Ordered from ${review.restaurant.name}`
                            : "Verified QuickBite Customer"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* =====================================================
                    DUPLICATE SET
                    Makes the continuous loop seamless
                ====================================================== */}
                {reviews.map((review) => (
                  <div
                    key={`second-${review._id}`}
                    className="
                      w-[calc((100vw-32px)/1)]
                      sm:w-[calc((100vw-64px)/2)]
                      lg:w-[calc((100vw-144px)/3)]
                      max-w-[430px]
                      shrink-0
                      bg-white
                      p-6
                      rounded-3xl
                      shadow-sm
                      border
                      border-gray-100
                      flex
                      flex-col
                      justify-between
                      hover:shadow-xl
                      transition-shadow
                    "
                  >
                    <div>
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-[#e33412] mb-3">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <span
                            key={i}
                            className="material-symbols-outlined text-[18px]"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-900 font-medium leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-[#e33412] flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(review.customer?.fullName)}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-sans text-xs font-bold text-gray-900 truncate">
                            {review.customer?.fullName || "Anonymous User"}
                          </span>

                          <span
                            className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0"
                            title="Verified Foodie"
                          >
                            check_circle
                          </span>
                        </div>

                        <span className="text-[11px] text-gray-500 truncate">
                          {review.restaurant?.name
                            ? `Ordered from ${review.restaurant.name}`
                            : "Verified QuickBite Customer"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-10 bg-white rounded-2xl shadow-inner">
              No reviews available right now.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
