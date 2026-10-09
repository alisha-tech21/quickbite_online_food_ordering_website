import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getRestaurantByIdApi } from "../../api/restaurantApi";
import { getMenuItemsApi } from "../../api/menuItemApi";
import { getReviewsByRestaurant } from "../../api/reviewApi";
import CustomizeItemModal from "../../components/common/CustomizeItemModal";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import {
  FiStar,
  FiClock,
  FiShield,
  FiPlus,
  FiCheckCircle,
  FiArrowLeft,
  FiHeart,
  FiShare2,
  FiInfo,
  FiSearch,
  FiZap,
  FiMapPin,
  FiTruck,
  FiDollarSign,
  FiCoffee,
  FiMessageCircle,
} from "react-icons/fi";

const COLORS = {
  bg: "#f9f9ff",
  surface: "#ffffff",
  low: "#f1f3fd",
  high: "#e5e8f2",
  text: "#181c23",
  secondary: "#6b5b52",
  orange: "#ff5a36",
  orangeDark: "#b52603",
  green: "#27a577",
  greenDark: "#006c4a",
};

const CATEGORY_IMAGE_FALLBACKS = {
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700",
  bbq: "https://images.unsplash.com/photo-1544025162-d76694265947?w=700",
  wings: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=700",
  drinks: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700",
  default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700",
};

/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

/*
 * Database category ko safe section ID mein convert karta hai.
 *
 * Example:
 * "Burgers" -> "category-burgers"
 * "BBQ & Karahi" -> "category-bbq-karahi"
 * "Pizza & Pasta" -> "category-pizza-pasta"
 */
const slugifyCategory = (value) => {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "other"
  );
};

/*
 * Sirf existing database category ke basis par layout decide hota hai.
 *
 * IMPORTANT:
 * Unknown category ko kisi doosri category mein move nahi karta.
 */
const getCategoryPresentation = (categoryName) => {
  const category = String(categoryName || "")
    .trim()
    .toLowerCase();

  if (category === "burgers" || category.includes("burger")) {
    return {
      layout: "burgers",
      emoji: "",
      title: categoryName,
      subtitle: "Freshly prepared to order",
    };
  }

  if (category.includes("bbq") || category.includes("karahi")) {
    return {
      layout: "bbq",
      emoji: "",
      title: categoryName,
      subtitle: "Freshly prepared to order",
    };
  }

  if (category.includes("wing")) {
    return {
      layout: "wings",
      emoji: "",
      title: categoryName,
      subtitle: "Freshly prepared to order",
    };
  }

  if (category.includes("drink") || category.includes("dessert")) {
    return {
      layout: "drinks",
      emoji: "",
      title: categoryName,
      subtitle: "Freshly prepared to order",
    };
  }

  return {
    layout: "default",
    emoji: "",
    title: categoryName,
    subtitle: "Freshly prepared to order",
  };
};

/* =========================================================
   IMAGE
   ========================================================= */

const imageForMenuItem = (item) => {
  if (item.imageUrl) {
    return item.imageUrl;
  }

  const category = String(item.category || "").toLowerCase();

  if (category.includes("burger")) {
    return CATEGORY_IMAGE_FALLBACKS.burgers;
  }

  if (category.includes("bbq") || category.includes("karahi")) {
    return CATEGORY_IMAGE_FALLBACKS.bbq;
  }

  if (category.includes("wing")) {
    return CATEGORY_IMAGE_FALLBACKS.wings;
  }

  if (category.includes("drink") || category.includes("dessert")) {
    return CATEGORY_IMAGE_FALLBACKS.drinks;
  }

  return CATEGORY_IMAGE_FALLBACKS.default;
};

/* =========================================================
   NORMALIZE MENU ITEM
   ========================================================= */

const normalizeMenuItem = (item) => {
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const isFeatured =
    tags.some((tag) => /bestseller/i.test(String(tag))) ||
    tags.some((tag) => /chef/i.test(String(tag)));

  return {
    ...item,

    menuItemId: item._id,

    image: imageForMenuItem(item),

    desc: item.description || "Freshly prepared to order.",

    badge: tags[0] || undefined,

    badgeClass: tags.some((tag) => /spicy/i.test(String(tag)))
      ? "red"
      : tags.some((tag) => /bestseller|chef/i.test(String(tag)))
        ? "orange"
        : undefined,

    tag: tags[0] || item.category,

    tag2: tags[1],

    note: tags.includes("Customizable")
      ? "Customizable options available"
      : undefined,

    time: isFeatured ? "20-30 min" : undefined,

    featured: isFeatured,

    /*
     * IMPORTANT:
     * Actual DB category preserve kar rahe hain.
     * Isko kisi hardcoded UI category mein map nahi kar rahe.
     */
    dbCategory: String(item.category || "").trim(),
  };
};

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const { addItem } = useContext(CartContext);

  // ---------------------------------------------------------
  // RESTAURANT / MENU STATE
  // ---------------------------------------------------------

  const [restaurantData, setRestaurantData] = useState(null);

  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);

  // ---------------------------------------------------------
  // REVIEWS STATE
  // ---------------------------------------------------------

  const [reviews, setReviews] = useState([]);

  const [reviewsLoading, setReviewsLoading] = useState(true);

  // ---------------------------------------------------------
  // CUSTOMIZE MODAL STATE
  // ---------------------------------------------------------

  const [customizeItem, setCustomizeItem] = useState(null);

  const [customizeQuantity, setCustomizeQuantity] = useState(1);

  const [customizeMode, setCustomizeMode] = useState("add");

  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);

  // ---------------------------------------------------------
  // UI STATE
  // ---------------------------------------------------------

  /*
   * Initially empty because categories now come from DB.
   */
  const [activeCategory, setActiveCategory] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------------------------------------
  // CART ACTION STATE
  // ---------------------------------------------------------

  const [cartLoading, setCartLoading] = useState(false);

  const [cartMessage, setCartMessage] = useState("");

  const [cartError, setCartError] = useState("");

  // ---------------------------------------------------------
  // FETCH RESTAURANT + MENU
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchRestaurantDetails = async () => {
      try {
        setLoading(true);
        setMenuLoading(true);

        const [restaurantRes, menuRes] = await Promise.all([
          getRestaurantByIdApi(id),
          getMenuItemsApi({
            restaurantId: id,
            limit: 50,
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (restaurantRes.success) {
          setRestaurantData(restaurantRes);
        }

        if (menuRes.success) {
          setMenuItems(Array.isArray(menuRes.items) ? menuRes.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load restaurant detail:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setMenuLoading(false);
        }
      }
    };

    if (id) {
      fetchRestaurantDetails();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---------------------------------------------------------
  // FETCH RESTAURANT REVIEWS
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchRestaurantReviews = async () => {
      if (!id) {
        return;
      }

      try {
        setReviewsLoading(true);

        const data = await getReviewsByRestaurant(id);

        if (!cancelled) {
          if (data?.success) {
            setReviews(Array.isArray(data.reviews) ? data.reviews : []);
          } else {
            setReviews([]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load restaurant reviews:", error);
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    };

    fetchRestaurantReviews();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---------------------------------------------------------
  // RESTAURANT DATA
  // ---------------------------------------------------------

  const restaurant = restaurantData?.restaurant || {};

  const restaurantView = {
    name: restaurant.name || "Restaurant",

    rating: restaurant.rating ?? 0,

    reviewCount: restaurant.reviewCount ?? 0,

    deliveryTimeMin: restaurant.deliveryTimeMin ?? 0,

    deliveryTimeMax: restaurant.deliveryTimeMax ?? 0,

    coverImage:
      restaurant.coverImage ||
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400",

    tagline: restaurant.tagline || "Fresh food, prepared to order.",

    address: restaurant.address || {},

    minOrder: restaurant.minOrder,

    distanceKm: restaurant.distanceKm,

    deliveryFee: restaurant.deliveryFee,

    freeDeliveryAbove: restaurant.freeDeliveryAbove,
  };

  // ---------------------------------------------------------
  // NORMALIZED MENU
  // ---------------------------------------------------------

  const normalizedMenuItems = menuItems.map(normalizeMenuItem);

  // ---------------------------------------------------------
  // DATABASE-DRIVEN CATEGORIES
  // ---------------------------------------------------------

  /*
   * IMPORTANT:
   *
   * Ab categories hardcoded nahi hain.
   *
   * Example DB:
   *
   * Burgers
   * Pizza
   * Pasta
   *
   * To sirf:
   *
   * Burgers
   * Pizza
   * Pasta
   *
   * show hongi.
   *
   * Agar BBQ DB mein nahi hai to BBQ nahi show hoga.
   */

  const visibleCategories = (() => {
    const categoryMap = new Map();

    normalizedMenuItems.forEach((item) => {
      const categoryName = String(item.dbCategory || "").trim();

      /*
       * Jis item ki category missing hai usko category section
       * mein include nahi karte.
       */
      if (!categoryName) {
        return;
      }

      const categoryKey = categoryName.toLowerCase();

      if (!categoryMap.has(categoryKey)) {
        const presentation = getCategoryPresentation(categoryName);

        categoryMap.set(categoryKey, {
          id: `category-${slugifyCategory(categoryName)}`,

          /*
           * Actual database category name
           */
          name: categoryName,

          label: categoryName,

          title: presentation.title,

          subtitle: presentation.subtitle,

          emoji: presentation.emoji,

          layout: presentation.layout,

          items: [],
        });
      }

      categoryMap.get(categoryKey).items.push(item);
    });

    return Array.from(categoryMap.values());
  })();

  // ---------------------------------------------------------
  // SET FIRST CATEGORY AFTER MENU LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    if (visibleCategories.length === 0) {
      setActiveCategory("");
      return;
    }

    const activeStillExists = visibleCategories.some(
      (category) => category.id === activeCategory,
    );

    if (!activeStillExists) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [menuItems, activeCategory, visibleCategories.length]);

  // ---------------------------------------------------------
  // OPEN CUSTOMIZE MODAL
  // ---------------------------------------------------------

  const openCustomizeModal = (item) => {
    if (!item) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setCustomizeItem(item);

    setCustomizeQuantity(1);

    setCustomizeMode("add");

    setCartError("");

    setCartMessage("");

    setCustomizeModalOpen(true);
  };

  // ---------------------------------------------------------
  // CLOSE CUSTOMIZE MODAL
  // ---------------------------------------------------------

  const closeCustomizeModal = () => {
    if (cartLoading) {
      return;
    }

    setCustomizeModalOpen(false);

    setCustomizeItem(null);

    setCustomizeQuantity(1);

    setCustomizeMode("add");
  };

  // ---------------------------------------------------------
  // ADD ITEM TO REAL CART
  // ---------------------------------------------------------

  const handleCustomizeUpdate = async (updatedItem) => {
    if (!updatedItem) {
      return;
    }

    if (!user) {
      closeCustomizeModal();

      navigate("/login");

      return;
    }

    const quantity = Math.max(
      1,
      Math.min(
        99,
        Number(updatedItem.quantity) || Number(customizeQuantity) || 1,
      ),
    );

    try {
      setCartLoading(true);

      setCartError("");

      setCartMessage("");

      await addItem({
        menuItemId: updatedItem.menuItemId || updatedItem._id,

        quantity,
      });

      setCartMessage(
        `${updatedItem.name || "Item"} added to cart successfully.`,
      );

      closeCustomizeModal();
    } catch (err) {
      console.error("Failed to add item to cart:", err);

      setCartError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to add item to cart. Please try again.",
      );
    } finally {
      setCartLoading(false);
    }
  };

  // ---------------------------------------------------------
  // WRITE REVIEW
  // ---------------------------------------------------------

  const handleWriteReview = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    /*
     * Review model requires an order ID.
     * Therefore we send the customer to My Orders where
     * they can select an eligible completed/delivered order
     * and submit the review against that order.
     */
    navigate("/my-orders");
  };

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  const matchesSearch = (item) => {
    if (!searchQuery.trim()) {
      return true;
    }

    return `${item.name} ${item.desc || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  };

  // ---------------------------------------------------------
  // CATEGORY SCROLL
  // ---------------------------------------------------------

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);

    document.getElementById(categoryId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="min-h-[70vh] flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />

            <p className="text-gray-500 font-medium">
              Loading restaurant menu...
            </p>
          </div>
        </div>

        <Footer />
      </>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <>
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />

      {/* =====================================================
          CUSTOMIZE ITEM MODAL
      ===================================================== */}

      <CustomizeItemModal
        isOpen={customizeModalOpen}
        onClose={closeCustomizeModal}
        item={customizeItem}
        quantity={customizeQuantity}
        mode={customizeMode}
        onConfirm={handleCustomizeUpdate}
        onUpdate={handleCustomizeUpdate}
      />

      <div
        className="min-h-screen pt-20 pb-20 text-[#181c23]"
        style={{
          backgroundColor: "#fff7f2",
        }}
      >
        {/* ===================================================
            SUCCESS TOAST
        =================================================== */}

        {cartMessage && (
          <div className="fixed top-5 right-5 z-[70]">
            <div className="bg-white rounded-2xl shadow-xl border border-green-100 px-5 py-4 flex items-center gap-3 max-w-sm">
              <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <FiCheckCircle size={20} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Added to cart</p>

                <p className="text-xs text-gray-500 mt-0.5">{cartMessage}</p>
              </div>

              <button
                type="button"
                onClick={() => setCartMessage("")}
                className="text-gray-400 hover:text-gray-700 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            ERROR TOAST
        =================================================== */}

        {cartError && (
          <div className="fixed top-5 right-5 z-[70]">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 px-5 py-4 flex items-center gap-3 max-w-sm">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">
                !
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  Unable to add item
                </p>

                <p className="text-xs text-red-500 mt-0.5">{cartError}</p>
              </div>

              <button
                type="button"
                onClick={() => setCartError("")}
                className="text-gray-400 hover:text-gray-700 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            BREADCRUMB
        =================================================== */}

        <div
          className="w-full py-2.5"
          style={{
            backgroundColor: "#fff1e8",
          }}
        >
          <div className="max-w-[1360px] mx-auto px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-1.5 hover:underline"
                style={{
                  color: COLORS.orangeDark,
                }}
              >
                <FiArrowLeft size={17} />
                Back to Restaurants
              </Link>

              <span className="text-gray-300">/</span>

              <Link to="/" className="text-gray-500 hover:text-gray-900">
                Home
              </Link>

              <span className="text-gray-300">/</span>

              <Link
                to="/restaurants"
                className="text-gray-500 hover:text-gray-900"
              >
                Restaurants
              </Link>

              <span className="text-gray-300">/</span>

              <span className="text-gray-900">{restaurantView.name}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full text-[#006c4a]">
                <FiCheckCircle size={14} />
                Halal Certified Kitchen
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full text-gray-500">
                <FiShield size={14} />
                Hygiene Grade A+
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            HERO
        =================================================== */}

        <div className="w-full bg-white">
          <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-6">
            <div className="relative rounded-3xl overflow-hidden shadow-md bg-gray-900">
              <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src={restaurantView.coverImage}
                  alt={restaurantView.name}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                {/* HERO ACTIONS */}

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <FiHeart
                      className="text-orange-500"
                      fill="currentColor"
                      size={19}
                    />
                  </button>

                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <FiShare2 size={19} />
                  </button>

                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <FiInfo size={19} />
                  </button>
                </div>

                {/* HERO BADGES */}

                <div className="absolute bottom-4 left-4 sm:left-6 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006c4a] text-white text-xs font-bold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#85f8c4] animate-pulse" />
                    Open Now • Closes 11:30 PM
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/65 backdrop-blur text-white text-xs font-semibold">
                    🔥 Wood-fired Smokehouse
                  </span>
                </div>
              </div>

              {/* RESTAURANT INFO */}

              <div className="p-6 md:p-10 bg-white flex flex-col gap-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      {restaurantView.name}
                    </h1>

                    <p className="text-sm md:text-base text-[#6b5b52] mt-1 max-w-2xl">
                      {restaurantView.tagline}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-[#f1f3fd] p-3 rounded-2xl shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <FiZap size={21} />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-bold">
                        Fast-Track Kitchen
                      </span>

                      <span className="text-xs text-[#006c4a] font-semibold">
                        Priority prep for your area
                      </span>
                    </div>
                  </div>
                </div>

                {/* RESTAURANT STATS */}

                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-sm font-semibold">
                  <div className="inline-flex items-center gap-1.5 bg-[#f1f3fd] px-4 py-2 rounded-full">
                    <FiStar
                      className="text-orange-500"
                      fill="currentColor"
                      size={17}
                    />

                    <span>{restaurantView.rating}</span>

                    <span className="text-gray-500 text-xs font-normal">
                      ({restaurantView.reviewCount} reviews)
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-[#f1f3fd] px-4 py-2 rounded-full">
                    <FiClock className="text-orange-500" size={17} />

                    <span>
                      {restaurantView.deliveryTimeMin}-
                      {restaurantView.deliveryTimeMax} mins
                    </span>

                    <span className="text-gray-500 text-xs font-normal">
                      ETA
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-[#f1f3fd] px-4 py-2 rounded-full">
                    <FiTruck className="text-[#006c4a]" size={17} />

                    <span className="text-[#006c4a]">Free Delivery</span>

                    <span className="text-gray-500 text-xs font-normal">
                      over Rs. {restaurantView.freeDeliveryAbove || 1200}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-[#f1f3fd] px-4 py-2 rounded-full">
                    <FiDollarSign className="text-gray-500" size={17} />

                    <span className="text-gray-500 text-xs font-normal">
                      Min. Order:
                    </span>

                    <span>Rs. {restaurantView.minOrder || 500}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-[#f1f3fd] px-4 py-2 rounded-full">
                    <FiMapPin className="text-orange-500" size={17} />

                    <span>{restaurantView.distanceKm ?? 0} km</span>

                    <span className="text-gray-500 text-xs font-normal">
                      {restaurantView.address?.area ||
                        restaurantView.address?.city ||
                        ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            STICKY MENU NAVIGATION
        =================================================== */}

        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* SEARCH */}

            <div className="relative w-full md:w-72 shrink-0">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={19}
              />

              <input
                type="text"
                placeholder="Search dishes in menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f1f3fd] rounded-full text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>

            {/* CATEGORIES */}

            <div className="flex items-center gap-2 overflow-x-auto py-1 text-nowrap">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeCategory === cat.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-[#f1f3fd] text-gray-700 hover:bg-[#e5e8f2]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===================================================
            MENU CONTENT
        =================================================== */}

        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-8 w-full">
          <div className="w-full">
            <div className="flex flex-col gap-10">
              {visibleCategories.map((cat) => {
                const items = cat.items.filter(matchesSearch);

                return (
                  <section
                    key={cat.id}
                    id={cat.id}
                    className="flex flex-col gap-4 scroll-mt-36"
                  >
                    {/* CATEGORY HEADER */}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cat.emoji && (
                          <span className="text-2xl">{cat.emoji}</span>
                        )}

                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                          {cat.title}
                        </h2>
                      </div>

                      <span className="hidden sm:block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {cat.subtitle}
                      </span>
                    </div>

                    {/* LOADING */}

                    {menuLoading ? (
                      <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400">
                        Loading menu...
                      </div>
                    ) : items.length === 0 ? (
                      <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400">
                        {searchQuery.trim()
                          ? `No dishes found for "${searchQuery}".`
                          : "No dishes available in this category."}
                      </div>
                    ) : cat.layout === "burgers" ? (
                      /* =================================================
                         BURGERS
                      ================================================= */

                      <div className="flex flex-col gap-4">
                        {items.map((item) => (
                          <div
                            key={item.menuItemId}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-4 w-full">
                              {/* IMAGE */}

                              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#f1f3fd] shrink-0">
                                <img
                                  className="w-full h-full object-cover"
                                  src={item.image}
                                  alt={item.name}
                                />
                              </div>

                              {/* DETAILS */}

                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-gray-900 text-base">
                                    {item.name}
                                  </h3>

                                  {item.badge && (
                                    <span
                                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                        item.badgeClass === "red"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-[#f5ded2] text-gray-700"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-gray-500 mt-1 max-w-md">
                                  {item.desc}
                                </p>

                                {item.note && (
                                  <span className="text-xs text-orange-600 mt-2 font-medium">
                                    {item.note}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* PRICE + ADD */}

                            <div className="flex items-center justify-between w-full sm:w-auto gap-5 shrink-0">
                              <span className="text-base font-extrabold">
                                Rs. {Number(item.price || 0).toLocaleString()}
                              </span>

                              <button
                                type="button"
                                disabled={cartLoading}
                                onClick={() => openCustomizeModal(item)}
                                className="px-4 py-2 text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: COLORS.orange,
                                }}
                              >
                                <FiPlus size={17} />
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : cat.layout === "bbq" ? (
                      /* =================================================
                         BBQ
                      ================================================= */

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.menuItemId}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[360px]"
                          >
                            <div>
                              {item.image && (
                                <div className="h-44 w-full rounded-xl overflow-hidden bg-[#f1f3fd] mb-3">
                                  <img
                                    className="w-full h-full object-cover"
                                    src={item.image}
                                    alt={item.name}
                                  />
                                </div>
                              )}

                              <h3 className="font-bold text-gray-900 text-base">
                                {item.name}
                              </h3>

                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {item.desc}
                              </p>

                              {item.note && (
                                <span className="block text-xs text-[#006c4a] font-medium mt-2">
                                  {item.note}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 mt-3">
                              <span className="text-sm md:text-base font-extrabold">
                                Rs. {Number(item.price || 0).toLocaleString()}
                              </span>

                              <button
                                type="button"
                                disabled={cartLoading}
                                onClick={() => openCustomizeModal(item)}
                                className="px-4 py-2 text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: COLORS.orange,
                                }}
                              >
                                <FiPlus size={17} />
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* =================================================
                         WINGS / DRINKS / OTHER DATABASE CATEGORIES
                      ================================================= */

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.menuItemId}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[360px]"
                          >
                            <div>
                              {/* IMAGE */}

                              {item.image && (
                                <div className="h-44 w-full rounded-xl overflow-hidden bg-[#f1f3fd] mb-3">
                                  <img
                                    className="w-full h-full object-cover"
                                    src={item.image}
                                    alt={item.name}
                                  />
                                </div>
                              )}

                              {/* NAME */}

                              <h3 className="font-bold text-gray-900 text-base">
                                {item.name}
                              </h3>

                              {/* DESCRIPTION */}

                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {item.desc}
                              </p>

                              {item.note && (
                                <span className="block text-xs text-[#006c4a] font-medium mt-2">
                                  {item.note}
                                </span>
                              )}
                            </div>

                            {/* PRICE + ADD */}

                            <div className="flex items-center justify-between pt-4 mt-3">
                              <span className="text-sm md:text-base font-extrabold">
                                Rs. {Number(item.price || 0).toLocaleString()}
                              </span>

                              <button
                                type="button"
                                disabled={cartLoading}
                                onClick={() => openCustomizeModal(item)}
                                className="px-4 py-2 text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  backgroundColor: COLORS.orange,
                                }}
                              >
                                <FiPlus size={17} />
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* =================================================
                NO MENU CATEGORIES
            ================================================= */}

            {!menuLoading && visibleCategories.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">
                  Menu not available
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  This restaurant has no menu items available right now.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            RESTAURANT REVIEWS
        =================================================== */}

        <section className="max-w-[1360px] mx-auto px-6 lg:px-8 mt-12">
          <div className="bg-white rounded-[28px] border border-slate-200/80 overflow-hidden shadow-sm">
            {/* =================================================
                SECTION HEADER
            ================================================= */}

            <div className="px-6 sm:px-8 lg:px-10 py-7 border-b border-slate-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 rounded-full bg-[#ff5a36]" />

                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                      Customer Reviews
                    </h2>
                  </div>

                  <p className="text-sm text-slate-500 ml-3.5">
                    Real experiences from customers who ordered from this
                    restaurant
                  </p>
                </div>

                {/* =================================================
                    RATING + WRITE REVIEW
                ================================================= */}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                  {/* Rating Summary */}

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {restaurantView.rating || "0.0"}
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5">
                        {restaurantView.reviewCount || reviews.length || 0}{" "}
                        reviews
                      </div>
                    </div>

                    <div className="h-12 w-px bg-slate-200" />

                    <div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={17}
                            className={
                              star <=
                              Math.round(Number(restaurantView.rating || 0))
                                ? "text-[#ffb020]"
                                : "text-slate-200"
                            }
                            fill={
                              star <=
                              Math.round(Number(restaurantView.rating || 0))
                                ? "currentColor"
                                : "none"
                            }
                          />
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        Overall rating
                      </p>
                    </div>
                  </div>

                  {/* Write Review Button */}

                  <button
                    type="button"
                    onClick={handleWriteReview}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff5a36] text-white text-sm font-bold shadow-sm hover:bg-[#e84b2a] hover:shadow-md transition-all active:scale-[0.98] whitespace-nowrap"
                  >
                    <FiMessageCircle size={17} />
                    Write a Review
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                REVIEWS CONTENT
            ================================================= */}

            <div>
              {reviewsLoading ? (
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="px-6 sm:px-8 lg:px-10 py-8 animate-pulse"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] gap-6 lg:gap-10">
                        <div className="flex gap-3">
                          <div className="w-11 h-11 rounded-full bg-slate-100 shrink-0" />

                          <div className="space-y-2">
                            <div className="h-4 w-28 bg-slate-100 rounded" />
                            <div className="h-3 w-20 bg-slate-100 rounded" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="h-4 w-28 bg-slate-100 rounded" />
                          <div className="h-4 w-full bg-slate-100 rounded" />
                          <div className="h-4 w-4/5 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                /* =================================================
                   EMPTY REVIEWS
                ================================================= */

                <div className="py-16 px-6 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#fff3ef] flex items-center justify-center">
                    <FiStar size={26} className="text-[#ff5a36]" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    No reviews yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                    Customers haven't shared their experience yet. Be the first
                    one to leave a review.
                  </p>

                  <button
                    type="button"
                    onClick={handleWriteReview}
                    className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5a36] text-white text-sm font-bold shadow-sm hover:bg-[#e84b2a] hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <FiMessageCircle size={17} />
                    Write a Review
                  </button>
                </div>
              ) : (
                /* =================================================
                   REVIEW LIST
                ================================================= */

                <div className="divide-y divide-slate-100">
                  {reviews.map((review) => {
                    const customerName =
                      review?.customer?.fullName || "QuickBite Customer";

                    const reviewDate = review?.createdAt
                      ? new Date(review.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "";

                    const rating = Number(review?.rating || 0);

                    return (
                      <article
                        key={review._id}
                        className="px-6 sm:px-8 lg:px-10 py-8"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] gap-6 lg:gap-10 min-h-[185px]">
                          {/* =================================================
                              CUSTOMER INFORMATION
                          ================================================= */}

                          <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}

                              <div className="w-11 h-11 rounded-full bg-[#fff1ec] flex items-center justify-center text-[#ff5a36] font-bold text-sm shrink-0 border border-[#ffe1d8]">
                                {customerName.charAt(0).toUpperCase()}
                              </div>

                              {/* Name */}

                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 truncate">
                                  {customerName}
                                </h3>

                                <div className="flex items-center gap-1.5 mt-1">
                                  <FiCheckCircle
                                    size={12}
                                    className="text-[#27a577]"
                                  />

                                  <p className="text-xs text-slate-400">
                                    Verified customer
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Date */}

                            <div className="text-xs text-slate-400 mt-5 ml-14">
                              {reviewDate}
                            </div>
                          </div>

                          {/* =================================================
                              REVIEW CONTENT
                          ================================================= */}

                          <div className="min-w-0">
                            {/* Rating */}

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FiStar
                                    key={star}
                                    size={16}
                                    className={
                                      star <= rating
                                        ? "text-[#ffb020]"
                                        : "text-slate-200"
                                    }
                                    fill={
                                      star <= rating ? "currentColor" : "none"
                                    }
                                  />
                                ))}
                              </div>

                              <span className="text-sm font-bold text-slate-700">
                                {rating}.0
                              </span>
                            </div>

                            {/* Customer Comment */}

                            <div className="mt-4 rounded-2xl bg-[#f8f9fc] border border-slate-100 px-5 py-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  Customer Review
                                </span>
                              </div>

                              <p className="text-[15px] leading-7 text-slate-600 whitespace-pre-wrap break-words">
                                {review.comment || "No comment provided."}
                              </p>
                            </div>

                            {/* =================================================
                                QUICKBITE RESPONSE
                            ================================================= */}

                            {review.adminReply && (
                              <div className="mt-4 rounded-2xl bg-[#ecfdf5] border border-[#bbf7d0] px-5 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-7 h-7 rounded-full bg-[#006c4a] flex items-center justify-center shrink-0">
                                    <FiMessageCircle
                                      size={14}
                                      className="text-white"
                                    />
                                  </div>

                                  <span className="text-sm font-bold text-[#006c4a]">
                                    QuickBite Response
                                  </span>

                                  {review.adminReplyAt && (
                                    <span className="text-xs text-[#5f8f7d]">
                                      ·{" "}
                                      {new Date(
                                        review.adminReplyAt,
                                      ).toLocaleDateString("en-PK", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm leading-6 text-[#315b4d] ml-9 whitespace-pre-wrap break-words">
                                  {review.adminReply}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* =================================================
                REVIEW FOOTER CTA
            ================================================= */}

            {reviews.length > 0 && !reviewsLoading && (
              <div className="border-t border-slate-100 bg-[#fcfcff] px-6 sm:px-8 lg:px-10 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Ordered from {restaurantView.name}?
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Share your experience and help other customers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleWriteReview}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5a36] text-white text-sm font-bold shadow-sm hover:bg-[#e84b2a] hover:shadow-md transition-all active:scale-[0.98] whitespace-nowrap"
                  >
                    <FiMessageCircle size={17} />
                    Write a Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            VIEW CART FLOATING BUTTON
        =================================================== */}

        <Link
          to="/cart"
          className="fixed bottom-5 right-5 z-40 bg-gray-900 text-white rounded-full px-5 py-3 shadow-xl hover:bg-black transition-all flex items-center gap-2 text-sm font-bold"
        >
          <FiCoffee size={18} />
          View Cart
        </Link>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </>
  );
}
