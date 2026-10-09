import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Gift,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";

import PageShell from "../../components/common/PageShell";
import { getActiveVouchersApi } from "../../api/voucherApi";

// =========================================================
// HELPERS
// =========================================================

const formatAmount = (amount) => {
  return Number(amount || 0).toLocaleString();
};

// ---------------------------------------------------------
// Check whether a voucher is BOGO
// Current backend does not have a dedicated BOGO type,
// so this is detected from admin-entered title/description.
// ---------------------------------------------------------

const isBogoVoucher = (voucher) => {
  const text = `
    ${voucher?.title || ""}
    ${voucher?.description || ""}
    ${voucher?.code || ""}
  `.toLowerCase();

  return (
    text.includes("bogo") ||
    text.includes("buy one get one") ||
    text.includes("buy 1 get 1") ||
    text.includes("1+1")
  );
};

// ---------------------------------------------------------
// Create human-readable timing from backend fields
// ---------------------------------------------------------

const getVoucherTiming = (voucher) => {
  const validDays = Array.isArray(voucher?.validDays) ? voucher.validDays : [];

  let timing = "All days";

  if (validDays.length > 0) {
    timing = validDays.join(" • ");
  }

  if (voucher?.validUntil) {
    const date = new Date(voucher.validUntil);

    if (!Number.isNaN(date.getTime())) {
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      timing =
        validDays.length > 0
          ? `${validDays.join(" • ")} • Until ${formattedDate}`
          : `Until ${formattedDate}`;
    }
  }

  return timing;
};

// ---------------------------------------------------------
// Discount text
// ---------------------------------------------------------

const getDiscountText = (voucher) => {
  if (voucher?.discountType === "free_delivery") {
    return "FREE DELIVERY";
  }

  if (voucher?.discountType === "percentage") {
    return `${formatAmount(voucher.discountValue)}% OFF`;
  }

  if (voucher?.discountType === "flat") {
    return `Rs. ${formatAmount(voucher.discountValue)} OFF`;
  }

  return "SPECIAL OFFER";
};

// ---------------------------------------------------------
// Badge
// ---------------------------------------------------------

const getVoucherBadge = (voucher) => {
  if (voucher?.discountType === "free_delivery") {
    return "Delivery Special";
  }

  if (isBogoVoucher(voucher)) {
    return "BOGO Special";
  }

  if (voucher?.discountType === "percentage") {
    return "Percentage Discount";
  }

  if (voucher?.discountType === "flat") {
    return "Flat Discount";
  }

  return "QuickBite Special";
};

// ---------------------------------------------------------
// Normalize backend voucher for UI
// ---------------------------------------------------------

const normalizeVoucher = (voucher) => {
  const bogo = isBogoVoucher(voucher);

  let type = "flat";

  if (voucher?.discountType === "free_delivery") {
    type = "free";
  } else if (bogo) {
    type = "bogo";
  }

  return {
    id: voucher?._id,
    code: voucher?.code || "",
    title: voucher?.title || "QuickBite Special Offer",
    description:
      voucher?.description ||
      "Enjoy exclusive savings on your QuickBite order.",
    discount: getDiscountText(voucher),
    minOrder: `Rs. ${formatAmount(voucher?.minOrderAmount)}`,
    timing: getVoucherTiming(voucher),
    badge: getVoucherBadge(voucher),
    type,
    discountType: voucher?.discountType,
    originalVoucher: voucher,
  };
};

// =========================================================
// THEME
// =========================================================

const getOfferTheme = (type) => {
  if (type === "free") {
    return {
      badge: "bg-emerald-50 text-emerald-600",
      accent: "text-emerald-600",
    };
  }

  if (type === "bogo") {
    return {
      badge: "bg-amber-50 text-amber-700",
      accent: "text-amber-600",
    };
  }

  return {
    badge: "bg-orange-50 text-orange-600",
    accent: "text-orange-600",
  };
};

// =========================================================
// COPY CODE
// =========================================================

const VoucherCode = ({ code, copiedCode, onCopy }) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f8fc] px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <Tag size={14} className="shrink-0 text-slate-400" />

        <span className="truncate text-[12px] font-extrabold tracking-[0.08em] text-slate-700">
          {code || "NO CODE"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => code && onCopy(code)}
        disabled={!code}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#ff6247] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#f45138] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copiedCode === code ? (
          <>
            <Check size={13} />
            Copied
          </>
        ) : (
          <>
            <Copy size={13} />
            Copy
          </>
        )}
      </button>
    </div>
  );
};

// =========================================================
// FOOD OFFER CARD
// =========================================================

const OfferCard = ({ offer, copiedCode, onCopy }) => {
  const theme = getOfferTheme(offer.type);

  return (
    <article className="group rounded-2xl border border-[#ececf2] bg-white p-3.5 shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,23,42,0.07)]">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${theme.badge}`}
        >
          {offer.badge}
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      {/* Discount */}
      <div className={`mt-2.5 text-[14px] font-black ${theme.accent}`}>
        {offer.discount}
      </div>

      {/* Title */}
      <h3 className="mt-1 min-h-[36px] text-[16px] font-extrabold leading-6 text-slate-900">
        {offer.title}
      </h3>

      {/* Description */}
      <p className="mt-1 min-h-[36px] text-[11px] leading-[1.55] text-slate-400">
        {offer.description}
      </p>

      {/* Conditions */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
          Min. {offer.minOrder}
        </span>

        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
          {offer.timing}
        </span>
      </div>

      {/* Code */}
      <div className="mt-3">
        <VoucherCode
          code={offer.code}
          copiedCode={copiedCode}
          onCopy={onCopy}
        />
      </div>
    </article>
  );
};

// =========================================================
// MAIN COMPONENT
// =========================================================

const Offers = () => {
  const [activeCategory, setActiveCategory] = useState("All Deals");
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [offersError, setOffersError] = useState("");

  // =======================================================
  // LOAD BACKEND VOUCHERS
  // =======================================================

  useEffect(() => {
    let mounted = true;

    const fetchVouchers = async () => {
      try {
        setLoadingOffers(true);
        setOffersError("");

        const data = await getActiveVouchersApi();

        if (!mounted) return;

        if (data?.success && Array.isArray(data.vouchers)) {
          const normalized = data.vouchers.map(normalizeVoucher);

          setOffers(normalized);
        } else {
          setOffers([]);

          setOffersError(
            data?.message || data?.error || "Failed to load active vouchers.",
          );
        }
      } catch (error) {
        console.error("Failed to load vouchers:", error);

        if (!mounted) return;

        setOffers([]);

        setOffersError(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Could not connect to server to load offers.",
        );
      } finally {
        if (mounted) {
          setLoadingOffers(false);
        }
      }
    };

    fetchVouchers();

    return () => {
      mounted = false;
    };
  }, []);

  // =======================================================
  // DYNAMIC CATEGORIES
  // =======================================================

  const categories = useMemo(() => {
    const result = ["All Deals"];

    const hasFlat = offers.some(
      (offer) =>
        offer.discountType === "flat" || offer.discountType === "percentage",
    );

    const hasFreeDelivery = offers.some(
      (offer) => offer.discountType === "free_delivery",
    );

    const hasBogo = offers.some((offer) => offer.type === "bogo");

    if (hasFlat) {
      result.push("Flat Off");
    }

    if (hasFreeDelivery) {
      result.push("Free Delivery");
    }

    if (hasBogo) {
      result.push("BOGO");
    }

    return result;
  }, [offers]);

  // =======================================================
  // KEEP CATEGORY VALID AFTER DATA LOAD
  // =======================================================

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("All Deals");
    }
  }, [categories, activeCategory]);

  // =======================================================
  // FEATURED VOUCHER
  // =======================================================

  const featuredVoucher = useMemo(() => {
    if (!offers.length) {
      return null;
    }

    // Prefer highest-value flat discount.
    // No voucher code is hardcoded here.
    const flatOffers = offers.filter((offer) => offer.discountType === "flat");

    if (flatOffers.length) {
      return [...flatOffers].sort(
        (a, b) =>
          Number(b.originalVoucher?.discountValue || 0) -
          Number(a.originalVoucher?.discountValue || 0),
      )[0];
    }

    // Otherwise percentage
    const percentageOffers = offers.filter(
      (offer) => offer.discountType === "percentage",
    );

    if (percentageOffers.length) {
      return [...percentageOffers].sort(
        (a, b) =>
          Number(b.originalVoucher?.discountValue || 0) -
          Number(a.originalVoucher?.discountValue || 0),
      )[0];
    }

    // Otherwise first backend voucher
    return offers[0];
  }, [offers]);

  // =======================================================
  // DYNAMIC POPULAR TAGS
  // =======================================================

  const popularTags = useMemo(() => {
    const words = [];

    offers.forEach((offer) => {
      const text = `${offer.title} ${offer.description}`;

      const matches = text.match(
        /\b(pizza|burger|biryani|dessert|shake|chicken|bbq|pasta|deal|feast)\b/gi,
      );

      if (matches) {
        matches.forEach((word) => {
          const normalized = word.toLowerCase();

          if (!words.includes(normalized)) {
            words.push(normalized);
          }
        });
      }
    });

    return words.slice(0, 6).map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
  }, [offers]);

  // =======================================================
  // FILTER
  // =======================================================

  const filteredOffers = useMemo(() => {
    let result = [...offers];

    if (activeCategory === "Flat Off") {
      result = result.filter(
        (offer) =>
          offer.discountType === "flat" || offer.discountType === "percentage",
      );
    }

    if (activeCategory === "Free Delivery") {
      result = result.filter((offer) => offer.discountType === "free_delivery");
    }

    if (activeCategory === "BOGO") {
      result = result.filter((offer) => offer.type === "bogo");
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((offer) => {
        const searchableText = `
          ${offer.title}
          ${offer.description}
          ${offer.code}
          ${offer.badge}
          ${offer.discount}
          ${offer.timing}
        `.toLowerCase();

        return searchableText.includes(query);
      });
    }

    return result;
  }, [activeCategory, search, offers]);

  // =======================================================
  // COPY
  // =======================================================

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);

      setCopiedCode(code);

      window.setTimeout(() => {
        setCopiedCode("");
      }, 1600);
    } catch (error) {
      console.error("Could not copy voucher code:", error);
    }
  };

  // =======================================================
  // TOTAL ACTIVE OFFERS
  // =======================================================

  const activeOfferCount = offers.length;

  return (
    <PageShell>
      <main className="min-h-screen bg-[#faf9ff] text-slate-800">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="border-b border-[#eeeef4] bg-gradient-to-r from-[#fff4ec] via-[#fff8f3] to-[#fff0e9]">
          <div className="mx-auto max-w-[1300px] px-4 pb-7 pt-10 sm:px-8 lg:px-10">
            {/* Label */}

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-100 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-orange-600">
              <Sparkles size={12} />

              {loadingOffers
                ? "Loading verified deals..."
                : `${activeOfferCount} verified deal${
                    activeOfferCount === 1 ? "" : "s"
                  } active`}
            </div>

            {/* Heading */}

            <h1 className="max-w-3xl text-[34px] font-black tracking-tight text-slate-950 sm:text-[42px] lg:text-[46px] lg:leading-[1.08]">
              Savory Bites &{" "}
              <span className="text-[#ff6247]">Super Savings</span>
            </h1>

            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-slate-400">
              Discover verified vouchers, exclusive discounts, and delivery
              perks available on QuickBite.
            </p>

            {/* Search + filters */}

            <div className="mt-7 flex flex-col gap-3.5 lg:flex-row lg:items-center">
              {/* Search */}

              <div className="relative w-full lg:w-[300px]">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search offers, vouchers..."
                  className="h-12 w-full rounded-full border border-[#e8e8ef] bg-white pl-11 pr-4 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-orange-200 focus:ring-4 focus:ring-orange-50"
                />
              </div>

              {/* Categories */}

              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`shrink-0 rounded-full border px-5 py-3 text-[11px] font-bold transition ${
                      activeCategory === category
                        ? "border-[#ff6247] bg-[#ff6247] text-white shadow-sm"
                        : "border-[#e8e8ef] bg-white text-slate-600 hover:border-orange-200 hover:text-orange-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic popular tags */}

            {popularTags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Popular
                </span>

                {popularTags.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSearch(item)}
                    className="rounded-full border border-[#ececf2] bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:border-orange-200 hover:text-orange-600"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            MAIN
        ================================================= */}

        <div className="mx-auto max-w-[1300px] bg-[#f8f9fa] px-5 py-7 sm:px-8 lg:px-10">
          {/* =================================================
              FEATURED PROMOTION
          ================================================= */}

          <section>
            <div className="relative overflow-hidden rounded-[26px] border border-orange-200 bg-gradient-to-r from-[#ffe5d8] via-[#ffede4] to-[#ffe1d7] p-6 shadow-[0_6px_26px_rgba(255,98,71,0.07)] sm:p-7">
              <div className="grid items-center gap-6 lg:grid-cols-[110px_1fr_220px]">
                {/* Dynamic food image removed.
                    No image field exists in current Voucher model. */}

                <div className="hidden h-[104px] w-[104px] items-center justify-center rounded-[20px] bg-orange-100 text-orange-500 shadow-sm lg:flex">
                  <Gift size={42} />
                </div>

                {/* Content */}

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-[#ff6247] px-3 py-1.5 text-[9px] font-black uppercase text-white">
                      Featured Deal
                    </span>

                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      <Clock3 size={12} />

                      {featuredVoucher
                        ? featuredVoucher.timing
                        : "No active voucher"}
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-[23px] font-black leading-tight text-slate-950 sm:text-[25px]">
                    {loadingOffers
                      ? "Loading featured deal..."
                      : featuredVoucher
                        ? featuredVoucher.title
                        : "No active offers available"}
                  </h2>

                  <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500 sm:text-[12px]">
                    {featuredVoucher
                      ? featuredVoucher.description
                      : "Create an active voucher from the admin panel to display it here."}
                  </p>
                </div>

                {/* Voucher */}

                <div className="rounded-[18px] bg-white/80 p-3.5 shadow-sm ring-1 ring-orange-100">
                  <div className="rounded-xl border border-orange-100 bg-gradient-to-r from-[#fff4ec] via-[#fff8f3] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Voucher Code
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          featuredVoucher && copyCode(featuredVoucher.code)
                        }
                        disabled={!featuredVoucher?.code}
                        className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {featuredVoucher &&
                        copiedCode === featuredVoucher.code ? (
                          <Check size={11} />
                        ) : (
                          <Copy size={11} />
                        )}

                        {featuredVoucher && copiedCode === featuredVoucher.code
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>

                    <p className="mt-1.5 text-[17px] font-black tracking-widest text-orange-600">
                      {loadingOffers
                        ? "..."
                        : featuredVoucher?.code || "NO CODE"}
                    </p>

                    <Link
                      to="/restaurants"
                      className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6247] px-3 py-3 text-[11px] font-bold text-white transition hover:bg-[#f45138]"
                    >
                      Apply & Order Now
                      <ArrowRight size={13} />
                    </Link>

                    <p className="mt-2.5 text-center text-[9px] text-slate-400">
                      {featuredVoucher
                        ? `Min. ${featuredVoucher.minOrder}`
                        : "Minimum order applies"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              ACTIVE VOUCHERS
          ================================================= */}

          <section className="mt-9">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                    <Tag size={16} />
                  </div>

                  <h2 className="text-[22px] font-black text-slate-950">
                    Active Voucher Codes
                  </h2>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Live offers managed directly from the QuickBite admin panel.
                </p>
              </div>

              <span className="hidden items-center gap-1.5 text-[10px] font-semibold text-slate-400 sm:flex">
                <Clock3 size={12} />
                Live updates
              </span>
            </div>

            {/* Loading */}

            {loadingOffers ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-[260px] animate-pulse rounded-2xl border border-[#ececf2] bg-white p-3.5"
                  >
                    <div className="h-6 w-28 rounded-full bg-slate-100" />

                    <div className="mt-5 h-5 w-24 rounded bg-slate-100" />

                    <div className="mt-3 h-10 w-4/5 rounded bg-slate-100" />

                    <div className="mt-3 h-10 w-full rounded bg-slate-100" />

                    <div className="mt-5 h-12 w-full rounded-xl bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : offersError ? (
              <div className="rounded-[20px] border border-dashed border-red-200 bg-white px-6 py-14 text-center">
                <Tag className="mx-auto text-red-200" size={36} />

                <h3 className="mt-3 text-[15px] font-bold text-slate-700">
                  Unable to load offers
                </h3>

                <p className="mt-1 text-[12px] text-slate-400">{offersError}</p>
              </div>
            ) : filteredOffers.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    copiedCode={copiedCode}
                    onCopy={copyCode}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                <Gift className="mx-auto text-slate-300" size={36} />

                <h3 className="mt-3 text-[15px] font-bold text-slate-700">
                  No matching offers
                </h3>

                <p className="mt-1 text-[12px] text-slate-400">
                  {search
                    ? "Try another search term."
                    : "There are currently no active vouchers."}
                </p>
              </div>
            )}
          </section>

          {/* =================================================
              HOW TO CLAIM
          ================================================= */}

          <section className="mt-9">
            <div className="rounded-[26px] border border-[#e8e9f1] bg-white p-7 shadow-[0_5px_22px_rgba(15,23,42,0.03)] sm:p-9">
              <div className="text-center">
                <span className="rounded-full bg-orange-100 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-orange-600">
                  Quick & Easy
                </span>

                <h2 className="mt-3.5 text-[22px] font-black text-slate-950">
                  How to Claim Offers on QuickBite
                </h2>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Enjoy instant savings on your cart in just three easy steps.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {[
                  {
                    number: "1",
                    title: "Choose & Copy",
                    text: "Browse an active voucher and copy its code.",
                  },
                  {
                    number: "2",
                    title: "Pick Your Favorites",
                    text: "Select dishes from participating restaurants and add them to your cart.",
                  },
                  {
                    number: "3",
                    title: "Paste & Feast",
                    text: "Apply the voucher code during checkout and enjoy your savings.",
                  },
                ].map((step) => (
                  <div
                    key={step.number}
                    className="rounded-[20px] border border-orange-100 bg-[#fffaf6] p-6 text-center"
                  >
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6247] text-[13px] font-black text-white shadow-sm">
                      {step.number}
                    </div>

                    <h3 className="mt-3.5 text-[15px] font-extrabold text-slate-800">
                      {step.title}
                    </h3>

                    <p className="mx-auto mt-2.5 max-w-xs text-[11px] leading-5 text-slate-400">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================
              TERMS
          ================================================= */}

          <section className="mt-6 rounded-[20px] border border-orange-100 bg-[#fffaf7] px-6 py-5 text-center">
            <p className="text-[10px] leading-5 text-slate-400">
              <span className="font-bold text-slate-600">
                Terms & Fair Use:
              </span>{" "}
              Offers are subject to their configured minimum order, validity
              dates, usage limits, restaurant restrictions and availability.
            </p>
          </section>
        </div>
      </main>
    </PageShell>
  );
};

export default Offers;
