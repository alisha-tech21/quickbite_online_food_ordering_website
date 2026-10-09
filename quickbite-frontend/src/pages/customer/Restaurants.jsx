import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getRestaurantsApi } from "../../api/restaurantApi";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  FiSearch,
  FiSliders,
  FiClock,
  FiX,
  FiHeart,
  FiCoffee,
  FiStar,
  FiZap,
  FiTag,
} from "react-icons/fi";

const CUISINES_LIST = [
  "Burgers",
  "Biryani & Pulao",
  "Artisan Pizza",
  "BBQ",
  "Pure Desi",
  "Desserts & Cafe",
  "Chinese / Pan-Asian",
];

const ALL_CUISINES_FILTER_LIST = [
  "Pakistani & Desi",
  "Fast Food & Burgers",
  "Italian & Pizza",
  "Asian & Sushi",
  "Middle Eastern",
  "Healthy, Salads & Bowls",
];

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(84);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCuisines, setSelectedCuisines] = useState(
    searchParams.get("cuisine") ? searchParams.get("cuisine").split(",") : [],
  );

  // Min & Max Price States
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const [maxDeliveryTime, setMaxDeliveryTime] = useState(
    searchParams.get("maxDeliveryTime") || "",
  );
  const [minRating, setMinRating] = useState(
    searchParams.get("minRating") || "",
  );
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(
    searchParams.get("freeDeliveryOnly") === "true",
  );
  const [quickPass, setQuickPass] = useState(
    searchParams.get("quickPass") === "true",
  );
  const [dealsDiscounts, setDealsDiscounts] = useState(
    searchParams.get("dealsDiscounts") === "true",
  );
  const [openNow, setOpenNow] = useState(
    searchParams.get("openNow") === "true",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "recommended",
  );
  const latestRequest = useRef(0);

  useEffect(() => {
    fetchRestaurants();
  }, [searchParams]);
  // LIVE SEARCH: type rukne ke 400ms baad URL update hota hai
  const lastPushed = useRef(searchParams.get("search") || "");

  useEffect(() => {
    const next = search.trim();
    if (next === (searchParams.get("search") || "")) return;

    const timer = setTimeout(() => {
      lastPushed.current = next;
      setSearchParams(
        (prev) => {
          const updated = Object.fromEntries([...prev]);
          if (next) updated.search = next;
          else delete updated.search;
          updated.page = 1;
          return updated;
        },
        { replace: true },
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [search, searchParams, setSearchParams]);

  // URL bahar se badle (navbar link, back button, Enter, X button) to input bhi us ke mutabiq ho jaye
  useEffect(() => {
    const fromUrl = searchParams.get("search") || "";
    if (fromUrl !== lastPushed.current) {
      lastPushed.current = fromUrl;
      setSearch(fromUrl);
    }
  }, [searchParams]);
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const fetchRestaurants = async () => {
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const params = Object.fromEntries([...searchParams]);
      const data = await getRestaurantsApi(params);
      if (requestId !== latestRequest.current) return;
      if (data && data.success) {
        setRestaurants(data.restaurants);
        setTotal(data.total || 84);
      } else {
        setRestaurants(data?.restaurants || []);
      }
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  const updateURLParams = (newParams) => {
    const currentParams = Object.fromEntries([...searchParams]);
    const updated = { ...currentParams, ...newParams, page: 1 };
    Object.keys(updated).forEach((k) => !updated[k] && delete updated[k]);
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateURLParams({ search });
  };
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  const toggleCuisineFilter = (cuisineName) => {
    let updated;
    if (selectedCuisines.includes(cuisineName)) {
      updated = selectedCuisines.filter((c) => c !== cuisineName);
    } else {
      updated = [...selectedCuisines, cuisineName];
    }
    setSelectedCuisines(updated);
    updateURLParams({ cuisine: updated.join(",") });
  };

  const resetAllFilters = () => {
    setSearch("");
    setSelectedCuisines([]);
    setMinPrice("");
    setMaxPrice("");
    setMaxDeliveryTime("");
    setMinRating("");
    setFreeDeliveryOnly(false);
    setQuickPass(false);
    setDealsDiscounts(false);
    setOpenNow(false);
    setSortBy("recommended");
    setSearchParams({});
  };

  return (
    <div className="bg-brand-50/40 min-h-screen flex flex-col justify-between text-slate-800 font-sans">
      {" "}
      <Navbar />
      <div className="pt-24 flex-grow">
        {/* Top Header Search & Sorting Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full md:w-96"
            >
              <FiSearch className="absolute left-4 top-3 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Gulberg specialty kitchens..."
                value={search}
                onChange={handleSearchChange}
                className="w-full bg-white border border-slate-200 pl-11 pr-10 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100 text-slate-700"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    updateURLParams({ search: "" });
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-sm" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs">
                <span className="text-gray-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateURLParams({ sortBy: e.target.value });
                  }}
                  className="bg-transparent focus:outline-none text-gray-900 cursor-pointer font-bold"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Rating (High to Low)</option>
                  <option value="deliveryTime">Delivery Time</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3.5 py-1.5 rounded-lg shadow-2xs">
                <FiZap className="text-brand-500 fill-brand-500" />
                Fast Delivery (&lt;30m)
              </div>
            </div>
          </div>

          {/* Horizontal Cuisine Navigation Chips */}
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedCuisines([]);
                updateURLParams({ cuisine: "" });
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCuisines.length === 0
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-brand-50 hover:border-brand-200"
              }`}
            >
              <FiSliders className="text-xs" /> All Cuisines
            </button>
            {CUISINES_LIST.map((c) => {
              const isSelected = selectedCuisines.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCuisineFilter(c)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FiCoffee
                    className={`text-xs ${isSelected ? "text-white" : "text-gray-400"}`}
                  />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-4 mb-16">
          {/* Subheader info & Live status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 pb-2 gap-2 text-xs">
            <p className="text-gray-500 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {total} restaurants
              </span>{" "}
              near Gulberg III, Lahore • Average delivery time: 24 mins
            </p>
            <p className="text-emerald-600 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>{" "}
              95% Kitchens Live & Cooking
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Sidebar Filters */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-5 text-sm shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold flex items-center gap-2 text-gray-900 text-xs uppercase tracking-wider">
                  <FiSliders className="text-brand-500" />
                  Filters
                </h3>
                <button
                  onClick={resetAllFilters}
                  className="text-[11px] text-brand-600 font-bold tracking-wider hover:underline"
                >
                  RESET ALL
                </button>
              </div>

              {/* Instant Perks */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Instant Perks
                </h4>
                <label className="flex items-center justify-between text-xs cursor-pointer text-gray-700 font-medium">
                  <span className="flex items-center gap-2">
                    <FiClock className="text-gray-400" /> Free Delivery Only
                  </span>
                  <input
                    type="checkbox"
                    checked={freeDeliveryOnly}
                    onChange={(e) => {
                      setFreeDeliveryOnly(e.target.checked);
                      updateURLParams({ freeDeliveryOnly: e.target.checked });
                    }}
                    className="accent-brand-500 rounded border-slate-300 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer text-gray-700 font-medium">
                  <span className="flex items-center gap-2">
                    <FiZap className="text-orange-500" /> QuickPass (&lt; 25
                    mins)
                  </span>
                  <input
                    type="checkbox"
                    checked={quickPass}
                    onChange={(e) => {
                      setQuickPass(e.target.checked);
                      const val = e.target.checked ? "25" : "";
                      setMaxDeliveryTime(val);
                      updateURLParams({
                        maxDeliveryTime: val,
                        quickPass: e.target.checked,
                      });
                    }}
                    className="accent-brand-500 rounded border-slate-300 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer text-gray-700 font-medium">
                  <span className="flex items-center gap-2">
                    <FiTag className="text-gray-400" /> Deals & Discounts
                  </span>
                  <input
                    type="checkbox"
                    checked={dealsDiscounts}
                    onChange={(e) => {
                      setDealsDiscounts(e.target.checked);
                      updateURLParams({ dealsDiscounts: e.target.checked });
                    }}
                    className="accent-brand-500 rounded border-slate-300 w-4 h-4 cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer text-gray-700 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>{" "}
                    Open Now
                  </span>
                  <input
                    type="checkbox"
                    checked={openNow}
                    onChange={(e) => {
                      setOpenNow(e.target.checked);
                      updateURLParams({ openNow: e.target.checked });
                    }}
                    className="accent-brand-500 rounded border-slate-300 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Min to Max Price Range Design */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Price Range (Rs.)
                  </h4>
                  {(minPrice || maxPrice) && (
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                        updateURLParams({ minPrice: "", maxPrice: "" });
                      }}
                      className="text-[10px] text-orange-500 font-semibold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-medium">
                      Min
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMinPrice(val);
                        updateURLParams({ minPrice: val });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 pl-8 pr-2 py-2 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <span className="text-gray-400 text-xs font-bold">-</span>
                  <div className="relative w-full">
                    <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-medium">
                      Max
                    </span>
                    <input
                      type="number"
                      placeholder="2000+"
                      value={maxPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMaxPrice(val);
                        updateURLParams({ maxPrice: val });
                      }}
                      className="w-full bg-gray-50 border border-gray-200 pl-8 pr-2 py-2 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>
                {/* Quick select range buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { label: "Under 500", min: "", max: "500" },
                    { label: "500 - 1500", min: "500", max: "1500" },
                    { label: "1500+", min: "1500", max: "" },
                  ].map((preset, idx) => {
                    const isPresetActive =
                      minPrice === preset.min && maxPrice === preset.max;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMinPrice(preset.min);
                          setMaxPrice(preset.max);
                          updateURLParams({
                            minPrice: preset.min,
                            maxPrice: preset.max,
                          });
                        }}
                        className={`py-1 px-1 rounded border text-[10px] font-medium transition ${
                          isPresetActive
                            ? "bg-brand-500 text-white border-brand-500 font-bold"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-brand-50 hover:border-brand-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Max Delivery Time */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Max Delivery Time
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {["Any time", "Under 20m", "Under 30m", "Under 45m"].map(
                    (t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const val =
                            idx === 0
                              ? ""
                              : t.replace("Under ", "").replace("m", "");
                          setMaxDeliveryTime(val);
                          updateURLParams({ maxDeliveryTime: val });
                        }}
                        className={`py-1.5 text-xs font-medium rounded-lg border text-center transition ${
                          (idx === 0 && !maxDeliveryTime) ||
                          maxDeliveryTime ===
                            t.replace("Under ", "").replace("m", "")
                            ? "bg-brand-500 text-white border-brand-500 font-bold"
                            : "border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Cuisine & Flavors */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Cuisine & Flavors
                </h4>
                {ALL_CUISINES_FILTER_LIST.map((c) => (
                  <label
                    key={c}
                    className="flex items-center justify-between text-xs cursor-pointer text-gray-700 py-0.5 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCuisines.includes(c)}
                        onChange={() => toggleCuisineFilter(c)}
                        className="accent-brand-500 rounded border-slate-300 w-3.5 h-3.5 cursor-pointer"
                      />
                      {c}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      {Math.floor(Math.random() * 20) + 5}
                    </span>
                  </label>
                ))}
              </div>

              {/* Kitchen Rating */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Kitchen Rating
                </h4>
                {[
                  { label: "4.5 & above (Top Rated)", val: "4.5" },
                  { label: "4.0 & above", val: "4.0" },
                  { label: "3.5 & above", val: "3.5" },
                ].map((r) => (
                  <label
                    key={r.val}
                    className="flex items-center gap-2 text-xs cursor-pointer text-gray-700 font-medium py-0.5"
                  >
                    <input
                      type="radio"
                      name="minRating"
                      checked={minRating === r.val}
                      onChange={() => {
                        setMinRating(r.val);
                        updateURLParams({ minRating: r.val });
                      }}
                      className="accent-brand-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <FiStar className="text-amber-400 fill-amber-400 text-xs" />{" "}
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Restaurant Cards Grid Area */}
            <div className="lg:col-span-3 space-y-4">
              {/* Applied Filters Row */}
              {(selectedCuisines.length > 0 ||
                freeDeliveryOnly ||
                minRating ||
                minPrice ||
                maxPrice ||
                quickPass ||
                dealsDiscounts ||
                openNow) && (
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex items-center justify-between flex-wrap gap-2 text-xs shadow-2xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 font-medium">
                      Applied Filters:
                    </span>
                    {selectedCuisines.map((c) => (
                      <span
                        key={c}
                        className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-gray-700 font-medium"
                      >
                        {c}{" "}
                        <button
                          onClick={() => toggleCuisineFilter(c)}
                          className="text-gray-400 hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(minPrice || maxPrice) && (
                      <span className="bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-brand-700 font-medium">
                        Price: Rs. {minPrice || "0"} - {maxPrice || "Any"}{" "}
                        <button
                          onClick={() => {
                            setMinPrice("");
                            setMaxPrice("");
                            updateURLParams({ minPrice: "", maxPrice: "" });
                          }}
                          className="text-brand-400 hover:text-brand-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {freeDeliveryOnly && (
                      <span className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-gray-700 font-medium">
                        Free Delivery{" "}
                        <button
                          onClick={() => {
                            setFreeDeliveryOnly(false);
                            updateURLParams({ freeDeliveryOnly: false });
                          }}
                          className="text-gray-400 hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {minRating && (
                      <span className="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-gray-700 font-medium">
                        Rating {minRating}+{" "}
                        <button
                          onClick={() => {
                            setMinRating("");
                            updateURLParams({ minRating: "" });
                          }}
                          className="text-gray-400 hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetAllFilters}
                    className="text-brand-600 font-semibold hover:underline text-xs"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-20 text-gray-400 font-medium text-xs">
                  Loading kitchens...
                </div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    No restaurants found matching your filters.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {restaurants.map((rest) => {
                    // Unique & distinct color logic per badge type name
                    const badgeText =
                      rest.badges && rest.badges[0]
                        ? rest.badges[0]
                        : "QuickPass Free";
                    let badgeBg = "bg-brand-500"; // Default Red

                    if (badgeText.includes("Staff")) {
                      badgeBg = "bg-violet-500"; // Purple color for Staff Pick
                    } else if (badgeText.includes("Chef")) {
                      badgeBg = "bg-amber-500"; // Amber/Gold color for Chef Special
                    } else if (badgeText.includes("QuickPass")) {
                      badgeBg = "bg-brand-600"; // Rose color for QuickPass Free
                    }

                    return (
                      <div
                        key={rest._id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="relative h-44 bg-gray-100 overflow-hidden">
                            <img
                              src={
                                rest.coverImage ||
                                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                              }
                              alt={rest.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <span
                              className={`absolute top-2.5 left-2.5 ${badgeBg} text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-xs tracking-wide`}
                            >
                              {badgeText}
                            </span>
                            <button className="absolute top-2.5 right-2.5 bg-white/90 p-1.5 rounded-full text-gray-500 hover:text-red-500 transition shadow-xs">
                              <FiHeart className="text-sm" />
                            </button>
                          </div>

                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 text-sm truncate w-3/4">
                                {rest.name}
                              </h4>
                              <span className="flex items-center gap-1 text-xs font-bold text-gray-900">
                                <FiStar className="text-amber-400 fill-amber-400 text-xs" />{" "}
                                {rest.rating || "4.8"}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">
                              {rest.cuisines
                                ? rest.cuisines.join(" • ")
                                : "Burgers • American BBQ • Wings"}
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-3.5 pt-3 border-t border-gray-100 font-medium">
                              <span className="flex items-center gap-1">
                                <FiClock className="text-gray-400 text-xs" />
                                {rest.deliveryTimeMin || 20}-
                                {rest.deliveryTimeMax || 30} min
                              </span>
                              <span>{rest.distanceKm || "1.8"} km</span>
                              <span className="font-bold text-emerald-600">
                                {rest.deliveryFee === 0
                                  ? "FREE Delivery"
                                  : `Rs. ${rest.deliveryFee || 99}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <Link
                            to={`/restaurants/${rest._id}`}
                            className="w-full flex items-center justify-center gap-1 bg-brand-50 hover:bg-brand-500 hover:text-white text-brand-700 py-2.5 rounded-lg font-bold text-xs transition border border-brand-200"
                          >
                            + View Menu
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
