import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getPopularMenuItemsApi,
  getBestSellerMenuItemsApi,
} from "../../api/menuItemApi";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";

const PopularDishes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useContext(AuthContext);
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
  } = useContext(CartContext);

  const [popularItems, setPopularItems] = useState([]);
  const [bestSellerItems, setBestSellerItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Jis dish par request chal rahi hai (double click se bachao)
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchHomeDishes();
  }, []);

  const fetchHomeDishes = async () => {
    try {
      setLoading(true);

      const [popularData, bestSellerData] = await Promise.all([
        getPopularMenuItemsApi(4),
        getBestSellerMenuItemsApi(4),
      ]);

      if (popularData?.success) {
        setPopularItems(popularData.items || []);
      }

      if (bestSellerData?.success) {
        setBestSellerItems(bestSellerData.items || []);
      }
    } catch (error) {
      console.error("Error fetching home dishes:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CART (asli cart, server ke saath)
  // =========================

  // Quantity ab local state se nahi, asli cart se aati hai
  const getQty = (dishId) =>
    cartItems.find((c) => c.menuItemId === dishId)?.quantity || 0;

  const getErrorMessage = (err) =>
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again.";

  // Login nahi hai to login page par bhejo (login ke baad wapas yahin)
  const redirectToLogin = () => {
    toast("Please login to add items to your cart");
    navigate("/login", { state: { from: location.pathname } });
  };

  const handleAdd = async (dish) => {
    if (!user) {
      redirectToLogin();
      return;
    }

    try {
      setBusyId(dish._id);
      await addItem({ menuItemId: dish._id, quantity: 1 });
      toast.success(`${dish.name} added to cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeQty = async (dish, newQty) => {
    if (!user) {
      redirectToLogin();
      return;
    }

    try {
      setBusyId(dish._id);

      if (newQty <= 0) {
        await removeItem(dish._id);
      } else {
        await updateQuantity(dish._id, Math.min(99, newQty));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  // "+ Add" button ya quantity stepper (dono sections mein same)
  const renderQuantityControl = (dish) => {
    const qty = getQty(dish._id);
    const busy = busyId === dish._id;

    if (qty === 0) {
      return (
        <button
          onClick={() => handleAdd(dish)}
          disabled={busy}
          aria-label={`Add ${dish.name} to cart`}
          className="inline-flex items-center gap-1 bg-[#ea580c] hover:bg-[#c2410c] text-white font-sans text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          <span>{busy ? "Adding..." : "+ Add"}</span>
        </button>
      );
    }

    return (
      <div className="flex items-center bg-orange-50 rounded-full px-1.5 py-1 shadow-sm border border-orange-200">
        <button
          onClick={() => handleChangeQty(dish, qty - 1)}
          disabled={busy}
          aria-label="Decrease quantity"
          className="w-6 h-6 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-orange-100 transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          -
        </button>

        <span className="font-sans text-xs font-extrabold text-orange-900 px-2.5">
          {qty}
        </span>

        <button
          onClick={() => handleChangeQty(dish, qty + 1)}
          disabled={busy || qty >= 99}
          aria-label="Increase quantity"
          className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center hover:bg-[#c2410c] transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          +
        </button>
      </div>
    );
  };

  // =========================
  // BADGE COLORS
  // =========================
  const getBadgeColorByText = (tagText) => {
    const text = tagText?.toLowerCase() || "";

    if (
      text.includes("hot") ||
      text.includes("deal") ||
      text.includes("trending")
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      text.includes("chef") ||
      text.includes("special") ||
      text.includes("pick")
    ) {
      return "bg-emerald-100 text-emerald-800";
    }

    if (
      text.includes("desi") ||
      text.includes("ghee") ||
      text.includes("classic")
    ) {
      return "bg-amber-100 text-amber-800";
    }

    if (
      text.includes("italian") ||
      text.includes("gourmet") ||
      text.includes("pasta") ||
      text.includes("vegetarian")
    ) {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      {/* ========================================================= */}
      {/* POPULAR DISHES                                           */}
      {/* ========================================================= */}

      <section className="py-14 bg-[#fcfbf9]" id="popular-dishes">
        <div className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <span className="font-sans text-xs text-[#ea580c] uppercase font-extrabold tracking-wider">
                Trending Now
              </span>

              <h2 className="font-sans text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
                Popular Dishes
              </h2>
            </div>

            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-0 font-medium">
              Most loved dishes ordered in your area today
            </p>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100 shadow-sm"
                />
              ))}
            </div>
          ) : popularItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
              <p className="text-gray-500 text-sm">
                No popular dishes available right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularItems.map((dish) => {
                const restaurantName =
                  dish.restaurant?.name || "Spice House Biryani";

                // Actual Popular tag from database
                const popularTag =
                  dish.tags?.find((tag) => tag?.toLowerCase() === "popular") ||
                  "Popular";

                const badgeClasses = getBadgeColorByText(popularTag);

                return (
                  <div
                    key={dish._id}
                    className="dish-card bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80 hover:-translate-y-2.5 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between p-3 group"
                  >
                    {/* IMAGE */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-transform duration-500"
                        src={
                          dish.imageUrl ||
                          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                        }
                      />

                      {/* TAG */}
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full font-sans text-[11px] font-extrabold shadow-sm ${badgeClasses}`}
                      >
                        {popularTag}
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="p-2 pt-3 flex flex-col flex-1 justify-between">
                      <div>
                        {/* RESTAURANT + RATING */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-gray-400 font-semibold truncate max-w-[150px]">
                            {restaurantName}
                          </span>

                          <span className="flex items-center text-[#ea580c] font-bold">
                            ★<span className="text-gray-800 ml-0.5">4.9</span>
                          </span>
                        </div>

                        {/* NAME */}
                        <h3 className="font-sans font-bold text-base text-gray-900 mt-1 truncate">
                          {dish.name}
                        </h3>

                        {/* DESCRIPTION */}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {dish.description ||
                            "Delicious food made fresh for you."}
                        </p>
                      </div>

                      {/* PRICE + QUANTITY */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                        <span className="font-sans text-lg font-extrabold text-gray-900">
                          Rs. {dish.price?.toLocaleString()}
                        </span>

                        <div>{renderQuantityControl(dish)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* BEST SELLERS                                             */}
      {/* ========================================================= */}

      <section
        className="py-14 bg-gray-50/50 border-t border-gray-200/50"
        id="menu-bestsellers"
      >
        <div className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <span className="font-sans text-xs text-[#ea580c] uppercase font-extrabold tracking-wider">
                Kitchen Classics
              </span>

              <h2 className="font-sans text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
                Best sellers
              </h2>
            </div>

            <a
              className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#ea580c] hover:underline mt-2 sm:mt-0"
              href="#popular-restaurants"
            >
              <span>View full menu</span>

              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </a>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100 shadow-sm"
                />
              ))}
            </div>
          ) : bestSellerItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
              <p className="text-gray-500 text-sm">
                No best seller dishes available right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellerItems.map((dish) => {
                const restaurantName =
                  dish.restaurant?.name || "Urban Grill & Smokehouse";

                // Actual Best Seller tag from database
                const bestSellerTag =
                  dish.tags?.find(
                    (tag) => tag?.toLowerCase() === "best seller",
                  ) || "Best Seller";

                const badgeClasses = getBadgeColorByText(bestSellerTag);

                return (
                  <div
                    key={`bestseller-${dish._id}`}
                    className="dish-card bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/80 hover:-translate-y-2.5 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between p-3 group"
                  >
                    {/* IMAGE */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-transform duration-500"
                        src={
                          dish.imageUrl ||
                          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                        }
                      />

                      {/* TAG */}
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full font-sans text-[11px] font-extrabold shadow-sm ${badgeClasses}`}
                      >
                        {bestSellerTag}
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="p-3 pt-4 flex flex-col flex-1 justify-between">
                      <div>
                        {/* RESTAURANT + RATING */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-400 font-semibold truncate max-w-[150px]">
                            {restaurantName}
                          </span>

                          <div className="flex items-center text-[#ea580c] text-xs">
                            ★
                            <span className="font-bold text-gray-800 ml-0.5">
                              4.9
                            </span>
                          </div>
                        </div>

                        {/* NAME */}
                        <h3 className="font-sans font-bold text-base text-gray-900 mt-1 truncate">
                          {dish.name}
                        </h3>

                        {/* DESCRIPTION */}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {dish.description ||
                            "Delicious food made fresh for you."}
                        </p>
                      </div>

                      {/* PRICE + QUANTITY */}
                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                        <span className="font-sans text-lg font-extrabold text-gray-900">
                          Rs. {dish.price?.toLocaleString()}
                        </span>

                        <div>{renderQuantityControl(dish)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PopularDishes;
