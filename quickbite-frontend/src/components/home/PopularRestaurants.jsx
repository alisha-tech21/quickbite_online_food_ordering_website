import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getRestaurantsApi } from "../../api/restaurantApi";

const PopularRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [favorites, setFavorites] = useState({});
  const restaurantScrollRef = useRef(null);

  useEffect(() => {
    fetchRestaurants();
  }, [filterType]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filterType === "free_delivery") {
        params.freeDeliveryOnly = "true";
      } else if (filterType === "top_rated") {
        params.minRating = "4.5";
      }

      const data = await getRestaurantsApi(params);
      if (data && data.success) {
        setRestaurants(data.restaurants);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="py-14" id="popular-restaurants">
      <div className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-sans text-xs font-extrabold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">
                stars
              </span>
              <span>Featured Restaurants</span>
            </div>
            <h2 className="font-sans text-2xl md:text-3xl lg:text-4xl font-extrabold text-zinc-900">
              Top Restaurants Near You
            </h2>
            <p className="text-zinc-500 text-sm sm:text-base mt-1.5 font-medium">
              Order from Lahore’s most celebrated kitchens and cafes
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-1.5 rounded-full font-sans text-xs font-bold shadow-sm transition-all shrink-0 ${
                  filterType === "all"
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-800 border border-zinc-200 hover:border-orange-500 hover:text-orange-600"
                }`}
                type="button"
              >
                All
              </button>
              <button
                onClick={() => setFilterType("free_delivery")}
                className={`px-4 py-1.5 rounded-full font-sans text-xs font-semibold shadow-sm transition-all shrink-0 ${
                  filterType === "free_delivery"
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-800 border border-zinc-200 hover:border-orange-500 hover:text-orange-600"
                }`}
                type="button"
              >
                Free Delivery
              </button>
              <button
                onClick={() => setFilterType("top_rated")}
                className={`px-4 py-1.5 rounded-full font-sans text-xs font-semibold shadow-sm transition-all shrink-0 ${
                  filterType === "top_rated"
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-800 border border-zinc-200 hover:border-orange-500 hover:text-orange-600"
                }`}
                type="button"
              >
                Top Rated 4.5+
              </button>
            </div>

            <Link
              className="group inline-flex items-center gap-1.5 font-sans text-sm font-bold text-zinc-800 transition-all duration-300 hover:text-orange-600"
              to="/restaurants"
            >
              <span className="relative">
                View all restaurants
                {/* Animated underline */}
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 rounded-full bg-orange-600 transition-all duration-300 group-hover:w-full"></span>
              </span>

              <span className="material-symbols-outlined text-[18px] transition-all duration-300 group-hover:translate-x-1 group-hover:text-orange-600">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Loading / Content Grid */}
        {loading ? (
          <div
            ref={restaurantScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {" "}
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl h-80 animate-pulse border border-zinc-100 shrink-0 w-[320px] sm:w-[360px] lg:w-[400px]"
              ></div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium">
            No restaurants found matching your criteria.
          </div>
        ) : (
          <div
            ref={restaurantScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {" "}
            {restaurants.map((restaurant) => {
              const isFav = favorites[restaurant._id];
              const badgeText =
                restaurant.badges?.[0] || "20% OFF • Rs. 300 Max";

              return (
                <Link
                  key={restaurant._id}
                  to={`/restaurant/${restaurant._id}`}
                  className="group w-[320px] shrink-0 snap-start bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/60 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer sm:w-[360px] lg:w-[400px]"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-zinc-100">
                    <img
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={
                        restaurant.coverImage ||
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                      }
                    />

                    {/* Top Badge */}
                    <div className="absolute top-3 left-3 bg-orange-600 text-white font-sans text-[11px] px-2.5 py-1 rounded-full shadow-md font-extrabold tracking-wide">
                      {badgeText}
                    </div>

                    {/* Favorite Button */}
                    <button
                      aria-label={`Favorite ${restaurant.name}`}
                      onClick={(e) => toggleFavorite(restaurant._id, e)}
                      className={`fav-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center transition-colors shadow-sm ${
                        isFav
                          ? "text-red-500"
                          : "text-zinc-600 hover:text-orange-600"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        favorite
                      </span>
                    </button>

                    {/* Schedule Badge */}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-sans text-zinc-900 font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-orange-600">
                        schedule
                      </span>
                      <span>
                        {restaurant.deliveryTimeMin}-
                        {restaurant.deliveryTimeMax} min
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-sans font-bold text-lg text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                          {restaurant.name}
                        </h3>
                        <div className="flex items-center gap-0.5 shrink-0 bg-orange-50 px-2 py-0.5 rounded-lg text-orange-600">
                          <span className="material-symbols-outlined text-[14px]">
                            star
                          </span>
                          <span className="font-sans text-xs font-extrabold">
                            {restaurant.rating || "4.8"}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            ({restaurant.reviewCount || "1.2k"})
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-500 mt-1 font-medium truncate">
                        {restaurant.cuisines?.join(" • ") ||
                          "Burgers & BBQ • American Comfort"}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-orange-600">
                            location_on
                          </span>
                          {restaurant.address?.area || "Gulberg III"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                        <span>{restaurant.distanceKm || "1.8"} km away</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px] text-orange-600">
                          delivery_dining
                        </span>
                        <span>
                          {restaurant.deliveryFee === 0
                            ? "Free delivery"
                            : `Rs. ${restaurant.deliveryFee || 99} delivery`}
                        </span>
                      </div>
                      <span className="text-[11px] font-sans text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        {restaurant.minOrder > 0
                          ? `Min Rs. ${restaurant.minOrder}`
                          : "Fast Prep"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularRestaurants;
