import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ChevronLeft,
  ShieldCheck,
  Bike,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Leaf,
  Tag,
  Banknote,
  Smartphone,
  CreditCard,
  ArrowRight,
  MessageCircle,
  Loader2,
  Store,
  X,
  CheckCircle2,
  Lock,
} from "lucide-react";

import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

import { getRestaurantByIdApi } from "../../api/restaurantApi";
import { getPublicSettingsApi } from "../../api/settingsApi";
import { applyVoucherApi } from "../../api/voucherApi";
import { addAddressApi } from "../../api/userApi";
import { createCheckoutApi } from "../../api/orderApi";

// ---------------------------------------------------------
// PAYMENT METHODS
// ---------------------------------------------------------

const PAYMENT_METHODS = [
  {
    id: "wallet",
    settingKeys: ["jazzcash", "easypaisa"],
    label: "Mobile Wallets",
    description: "Instant mobile wallet checkout",
    icon: Smartphone,
  },
  {
    id: "card",
    settingKeys: ["card"],
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, PayPak",
    icon: CreditCard,
  },
  {
    id: "cod",
    settingKeys: ["cod"],
    label: "Cash on Delivery (COD)",
    description: "Pay with cash or QR scan on arrival",
    icon: Banknote,
  },
];

// ---------------------------------------------------------
// CART
// ---------------------------------------------------------

const Cart = () => {
  const { user, setUser } = useAuth();

  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const navigate = useNavigate();

  // -------------------------------------------------------
  // CONTEXT
  // -------------------------------------------------------

  const [restaurants, setRestaurants] = useState({});
  const [settings, setSettings] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  const paymentSettings = settings?.paymentMethods || {};

  const isPaymentMethodEnabled = (method) => {
    const keys = method.settingKeys || [];

    return keys.some((key) => paymentSettings[key] === true);
  };

  const enabledPaymentMethods = useMemo(() => {
    return PAYMENT_METHODS.filter(isPaymentMethodEnabled);
  }, [settings]);

  // -------------------------------------------------------
  // DELIVERY
  // -------------------------------------------------------

  const [instructions, setInstructions] = useState("");
  const [ecoCutlery, setEcoCutlery] = useState(true);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // -------------------------------------------------------
  // VOUCHER
  // -------------------------------------------------------

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // -------------------------------------------------------
  // PAYMENT
  // -------------------------------------------------------

  const [paymentMethod, setPaymentMethod] = useState(null);
  // Mobile wallet provider is selected inside the single wallet option.
  const [walletProvider, setWalletProvider] = useState("jazzcash");

  const [placingOrder, setPlacingOrder] = useState(false);

  /*
   * IMPORTANT:
   *
   * Payment information is intentionally kept inside the
   * payment modal instead of showing it on Cart.
   */

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [createdOrders, setCreatedOrders] = useState([]);

  // Wallet payment fields
  const [walletNumber, setWalletNumber] = useState("");

  // Card payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // -------------------------------------------------------
  // NEW ADDRESS
  // -------------------------------------------------------

  const [newAddress, setNewAddress] = useState({
    line1: "",
    area: "",
    city: "",
  });

  const [savingAddress, setSavingAddress] = useState(false);

  // -------------------------------------------------------
  // GROUP CART ITEMS BY RESTAURANT
  // -------------------------------------------------------

  const restaurantGroups = useMemo(() => {
    const groups = {};

    items.forEach((item) => {
      const restaurantId = item.restaurantId;

      if (!restaurantId) return;

      if (!groups[restaurantId]) {
        groups[restaurantId] = {
          restaurantId,
          restaurantName: item.restaurantName || "Restaurant",
          items: [],
          subtotal: 0,
        };
      }

      groups[restaurantId].items.push(item);

      groups[restaurantId].subtotal +=
        Number(item.price || 0) * Number(item.quantity || 0);
    });

    return Object.values(groups);
  }, [items]);

  const restaurantIds = useMemo(
    () => restaurantGroups.map((group) => group.restaurantId),
    [restaurantGroups],
  );

  // -------------------------------------------------------
  // LOAD RESTAURANTS + SETTINGS
  // -------------------------------------------------------

  useEffect(() => {
    const loadContext = async () => {
      if (!items.length) {
        setRestaurants({});
        setSettings(null);
        setLoadingContext(false);
        return;
      }

      setLoadingContext(true);

      try {
        const [settingsResult, ...restaurantResults] = await Promise.all([
          getPublicSettingsApi(),
          ...restaurantIds.map((id) => getRestaurantByIdApi(id)),
        ]);

        setSettings(settingsResult?.settings || null);

        const restaurantMap = {};

        restaurantResults.forEach((result) => {
          const restaurant = result?.restaurant;

          if (restaurant?._id) {
            restaurantMap[String(restaurant._id)] = restaurant;
          }
        });

        setRestaurants(restaurantMap);
      } catch (error) {
        console.error("Failed to load cart context:", error);

        toast.error(error?.message || "Unable to load restaurant information");
      } finally {
        setLoadingContext(false);
      }
    };

    loadContext();
  }, [restaurantIds, items.length]);

  useEffect(() => {
    if (!enabledPaymentMethods.length) {
      setPaymentMethod(null);
      return;
    }

    const currentMethodStillEnabled = enabledPaymentMethods.some(
      (method) => method.id === paymentMethod,
    );

    if (!currentMethodStillEnabled) {
      const firstMethod = enabledPaymentMethods[0];

      setPaymentMethod(firstMethod.id);

      if (firstMethod.id === "wallet") {
        if (walletProvider === "jazzcash" && !paymentSettings.jazzcash) {
          setWalletProvider(
            paymentSettings.easypaisa ? "easypaisa" : "jazzcash",
          );
        }

        if (walletProvider === "easypaisa" && !paymentSettings.easypaisa) {
          setWalletProvider(
            paymentSettings.jazzcash ? "jazzcash" : "easypaisa",
          );
        }
      }
    }
  }, [enabledPaymentMethods, paymentMethod, walletProvider, paymentSettings]);
  // -------------------------------------------------------
  // SELECT PRIMARY ADDRESS
  // -------------------------------------------------------

  useEffect(() => {
    if (!user?.addresses?.length) {
      setSelectedAddressId(null);
      return;
    }

    const primary =
      user.addresses.find((address) => address.isPrimary) || user.addresses[0];

    setSelectedAddressId(primary._id);
    setInstructions(primary.instructions || "");
  }, [user]);

  const selectedAddress = user?.addresses?.find(
    (address) => address._id === selectedAddressId,
  );

  // -------------------------------------------------------
  // CART SUBTOTAL
  // -------------------------------------------------------

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [items]);

  // -------------------------------------------------------
  // RESTAURANT TOTALS
  // -------------------------------------------------------

  const restaurantTotals = useMemo(() => {
    if (!settings) return [];

    const freeDeliveryAbove = Number(settings.freeDeliveryAbove || 0);

    const packagingFee = Number(settings.packagingFee || 0);

    const taxPercentage = Number(settings.taxPercentage || 0);

    return restaurantGroups.map((group) => {
      const restaurant = restaurants[String(group.restaurantId)];

      const baseDeliveryFee = Number(
        restaurant?.deliveryFee ?? settings.baseDeliveryFee ?? 0,
      );

      let deliveryFee =
        group.subtotal >= freeDeliveryAbove ? 0 : baseDeliveryFee;

      if (
        appliedVoucher?.freeDelivery &&
        appliedVoucher?.restaurantId &&
        String(appliedVoucher.restaurantId) === String(group.restaurantId)
      ) {
        deliveryFee = 0;
      }

      return {
        ...group,
        restaurant,
        baseDeliveryFee,
        deliveryFee,
        packagingFee,
        taxPercentage,
      };
    });
  }, [settings, restaurantGroups, restaurants, appliedVoucher]);

  // -------------------------------------------------------
  // TOTALS
  // -------------------------------------------------------

  const totals = useMemo(() => {
    if (!settings) return null;

    const deliveryFee = restaurantTotals.reduce(
      (sum, group) => sum + Number(group.deliveryFee || 0),
      0,
    );

    const packagingFee = restaurantTotals.reduce(
      (sum, group) => sum + Number(group.packagingFee || 0),
      0,
    );

    const discount = Number(appliedVoucher?.discountAmount || 0);

    const taxPercentage = Number(settings.taxPercentage || 0);

    const preTax = itemsSubtotal + deliveryFee + packagingFee - discount;

    const tax = Math.round((Math.max(0, preTax) * taxPercentage) / 100);

    const total = Math.max(0, preTax + tax);

    return {
      itemsSubtotal,
      deliveryFee,
      packagingFee,
      discount,
      tax,
      total,
    };
  }, [settings, restaurantTotals, itemsSubtotal, appliedVoucher]);

  // -------------------------------------------------------
  // APPLY VOUCHER
  // -------------------------------------------------------

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Enter a voucher code");
      return;
    }

    if (restaurantGroups.length > 1) {
      toast.error(
        "Voucher checkout for multiple restaurants needs a multi-restaurant voucher.",
      );
      return;
    }

    const restaurantId = restaurantGroups[0]?.restaurantId;

    if (!restaurantId) {
      toast.error("Restaurant information is missing");
      return;
    }

    setApplyingVoucher(true);

    try {
      const result = await applyVoucherApi({
        code: voucherCode.trim(),
        restaurantId,
        itemsSubtotal,
      });

      setAppliedVoucher({
        ...result,
        restaurantId,
      });

      toast.success(result?.message || "Voucher applied");
    } catch (error) {
      toast.error(error?.message || "Unable to apply voucher");
    } finally {
      setApplyingVoucher(false);
    }
  };

  // -------------------------------------------------------
  // REMOVE VOUCHER
  // -------------------------------------------------------

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
  };

  // -------------------------------------------------------
  // ADD ADDRESS
  // -------------------------------------------------------

  const handleAddAddress = async (event) => {
    event.preventDefault();

    setSavingAddress(true);

    try {
      const result = await addAddressApi({
        ...newAddress,
        label: "Home",
        isPrimary: true,
      });

      setUser((currentUser) => ({
        ...currentUser,
        addresses: result.addresses,
      }));

      const updatedAddresses = result?.addresses || [];

      setUser((currentUser) => ({
        ...currentUser,
        addresses: updatedAddresses,
      }));

      const created =
        updatedAddresses.find((address) => address.isPrimary) ||
        updatedAddresses[updatedAddresses.length - 1];

      if (created?._id) {
        setSelectedAddressId(created._id);
        setInstructions(created.instructions || "");
      }

      setShowAddressPicker(false);

      toast.success("Address saved");

      setNewAddress({
        line1: "",
        area: "",
        city: "",
      });
    } catch (error) {
      toast.error(error?.message || "Unable to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  // -------------------------------------------------------
  // CLEAR CART
  // -------------------------------------------------------

  const handleClearCart = async () => {
    try {
      await clearCart();

      setAppliedVoucher(null);
      setVoucherCode("");

      toast.success("Cart cleared");
    } catch (error) {
      toast.error(error?.message || "Unable to clear cart");
    }
  };

  // -------------------------------------------------------
  // QUANTITY
  // -------------------------------------------------------

  const handleIncreaseQuantity = async (item) => {
    try {
      await updateQuantity(item.menuItemId, Number(item.quantity || 0) + 1);
    } catch (error) {
      toast.error(error?.message || "Unable to update quantity");
    }
  };

  const handleDecreaseQuantity = async (item) => {
    const currentQuantity = Number(item.quantity || 0);

    if (currentQuantity <= 1) {
      await handleRemoveItem(item);
      return;
    }

    try {
      await updateQuantity(item.menuItemId, currentQuantity - 1);
    } catch (error) {
      toast.error(error?.message || "Unable to update quantity");
    }
  };

  // -------------------------------------------------------
  // REMOVE ITEM
  // -------------------------------------------------------

  const handleRemoveItem = async (item) => {
    try {
      await removeItem(item.menuItemId);

      toast.success(`${item.name} removed from cart`);
    } catch (error) {
      toast.error(error?.message || "Unable to remove item");
    }
  };

  // -------------------------------------------------------
  // RESET PAYMENT FIELDS
  // -------------------------------------------------------

  const resetPaymentFields = () => {
    setWalletNumber("");

    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
  };

  // -------------------------------------------------------
  // OPEN PAYMENT MODAL
  // -------------------------------------------------------

  const handleProceedToPayment = () => {
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please add a delivery address first");
      return;
    }

    if (!restaurantGroups.length) {
      toast.error("Restaurant information is missing");
      return;
    }

    if (!totals) {
      toast.error("Order total is still loading");
      return;
    }
    if (!enabledPaymentMethods.length) {
      toast.error("No payment method is currently available");
      return;
    }

    resetPaymentFields();

    setShowPaymentModal(true);
  };

  // -------------------------------------------------------
  // CLOSE PAYMENT MODAL
  // -------------------------------------------------------

  const handleClosePaymentModal = () => {
    if (placingOrder) return;

    setShowPaymentModal(false);
  };

  // -------------------------------------------------------
  // CARD NUMBER FORMAT
  // -------------------------------------------------------

  const handleCardNumberChange = (event) => {
    let value = event.target.value.replace(/\D/g, "");

    value = value.slice(0, 16);

    value = value.replace(/(.{4})/g, "$1 ").trim();

    setCardNumber(value);
  };

  // -------------------------------------------------------
  // EXPIRY FORMAT
  // -------------------------------------------------------

  const handleExpiryChange = (event) => {
    let value = event.target.value.replace(/\D/g, "");

    value = value.slice(0, 4);

    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    setCardExpiry(value);
  };

  // -------------------------------------------------------
  // PLACE ORDER
  // -------------------------------------------------------

  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please add a delivery address first");
      return;
    }

    // -----------------------------------------------------
    // WALLET VALIDATION
    // -----------------------------------------------------

    if (paymentMethod === "wallet") {
      const cleanWallet = walletNumber.replace(/\D/g, "");

      if (!cleanWallet) {
        toast.error("Enter your mobile wallet number");
        return;
      }

      if (cleanWallet.length < 10 || cleanWallet.length > 15) {
        toast.error("Enter a valid mobile wallet number");
        return;
      }
    }

    // -----------------------------------------------------
    // CARD VALIDATION
    // -----------------------------------------------------

    if (paymentMethod === "card") {
      const cleanCard = cardNumber.replace(/\s/g, "");

      if (cleanCard.length !== 16) {
        toast.error("Enter a valid 16-digit card number");
        return;
      }

      if (!cardName.trim()) {
        toast.error("Enter the card holder name");
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        toast.error("Enter card expiry as MM/YY");
        return;
      }

      if (!/^\d{3,4}$/.test(cardCvv)) {
        toast.error("Enter a valid CVV");
        return;
      }
    }

    setPlacingOrder(true);

    try {
      // ---------------------------------------------------
      // BUILD PAYMENT ACCOUNT NUMBER
      // ---------------------------------------------------

      let paymentAccountNumber;

      if (paymentMethod === "wallet") {
        paymentAccountNumber = walletNumber.replace(/\D/g, "");
      }

      // ---------------------------------------------------
      // BACKEND PAYMENT METHOD
      // ---------------------------------------------------
      // The UI uses "wallet" for the single Mobile Wallets
      // radio option. Backend still receives the actual
      // provider: "jazzcash" or "easypaisa".
      const backendPaymentMethod =
        paymentMethod === "wallet" ? walletProvider : paymentMethod;

      // ---------------------------------------------------
      // PAYLOAD
      // ---------------------------------------------------

      const payload = {
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: Number(item.quantity || 1),
          notes: item.notes || undefined,
        })),

        deliveryAddress: {
          label: selectedAddress.label,
          line1: selectedAddress.line1,
          area: selectedAddress.area,
          city: selectedAddress.city,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
          instructions,
        },

        ecoFriendlyCutlery: ecoCutlery,

        voucherCode: appliedVoucher?.code || undefined,

        paymentMethod: backendPaymentMethod,

        paymentAccountNumber,
      };

      // ---------------------------------------------------
      // CREATE CHECKOUT
      // ---------------------------------------------------

      const result = await createCheckoutApi(payload);

      console.log("Checkout created successfully:", result);

      // ---------------------------------------------------
      // SAVE CREATED ORDERS
      // ---------------------------------------------------

      setCreatedOrders(result?.orders || []);

      // ---------------------------------------------------
      // CLOSE PAYMENT MODAL
      // ---------------------------------------------------

      setShowPaymentModal(false);

      // ---------------------------------------------------
      // CLEAR CART
      // ---------------------------------------------------

      await clearCart();

      // ---------------------------------------------------
      // SHOW SUCCESS MODAL
      // ---------------------------------------------------

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to place checkout:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to complete checkout",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // -------------------------------------------------------
  // SUCCESS MODAL OK
  // -------------------------------------------------------

  const handleSuccessOk = () => {
    setShowSuccessModal(false);

    setCreatedOrders([]);

    resetPaymentFields();

    navigate("/my-orders");
  };

  // -------------------------------------------------------
  // EMPTY CART
  // -------------------------------------------------------

  // Keep the success modal mounted even after clearCart() empties the cart.
  // Without this condition, the empty-cart early return unmounts the success modal.
  if (items.length === 0 && !showSuccessModal) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Bike size={28} />
          </span>

          <h1 className="mb-2 text-2xl font-extrabold text-ink">
            Your cart is empty
          </h1>

          <p className="mb-6 text-sm text-slate-500">
            Browse restaurants and add a few dishes to get started.
          </p>

          <Link to="/restaurants" className="qb-btn-primary w-auto px-6">
            Browse Restaurants
          </Link>
        </div>
      </PageShell>
    );
  }

  // -------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* BREADCRUMBS */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Link
              to="/restaurants"
              className="flex items-center gap-1 font-semibold text-brand-500 hover:underline"
            >
              <ChevronLeft size={14} />
              Back to Restaurants
            </Link>

            <span>/</span>

            <Link to="/" className="hover:text-ink">
              Home
            </Link>

            <span>/</span>

            <Link to="/restaurants" className="hover:text-ink">
              Restaurants
            </Link>

            <span>/</span>

            <span className="font-bold text-ink">CART</span>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            <ShieldCheck size={13} />
            256-bit Encrypted
          </span>
        </div>

        {/* HEADING */}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-ink">
                Your Shopping Cart
              </h1>

              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-600">
                Live Order
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {restaurantGroups.length}{" "}
              {restaurantGroups.length === 1 ? "restaurant" : "restaurants"} •{" "}
              {items.length} {items.length === 1 ? "item" : "items"} selected
            </p>
          </div>

          <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <Bike size={14} className="text-brand-500" />
            Multiple restaurant delivery
          </span>
        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT */}

          <div className="space-y-6 lg:col-span-2">
            {/* CART ITEMS */}

            <div className="qb-card p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-bold text-ink">Items in Basket</h2>

                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500"
                >
                  Clear All
                </button>
              </div>

              {loadingContext ? (
                <div className="flex justify-center py-10 text-slate-400">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {restaurantGroups.map((group) => {
                    const restaurant = restaurants[String(group.restaurantId)];

                    return (
                      <div
                        key={group.restaurantId}
                        className="overflow-hidden rounded-xl border border-slate-200"
                      >
                        {/* RESTAURANT HEADER */}

                        <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                              <Store size={15} />
                            </span>

                            <div>
                              <p className="text-sm font-bold text-ink">
                                {restaurant?.name || group.restaurantName}
                              </p>

                              <p className="text-[11px] text-slate-400">
                                {group.items.length}{" "}
                                {group.items.length === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>

                          {restaurant && (
                            <Link
                              to={`/restaurants/${restaurant._id}`}
                              className="text-xs font-semibold text-brand-500 hover:underline"
                            >
                              View Menu
                            </Link>
                          )}
                        </div>

                        {/* ITEMS */}

                        <div className="divide-y divide-slate-100 px-4">
                          {group.items.map((item) => {
                            const price = Number(item.price || 0);

                            const quantity = Number(item.quantity || 0);

                            const itemTotal = price * quantity;

                            return (
                              <div
                                key={item.cartItemId || item.menuItemId}
                                className="flex items-center gap-4 py-4"
                              >
                                {/* IMAGE */}

                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                    🍽️
                                  </div>
                                )}

                                {/* DETAILS */}

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-ink">
                                    {item.name}
                                  </p>

                                  {item.description && (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                                      {item.description}
                                    </p>
                                  )}

                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDecreaseQuantity(item)
                                      }
                                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
                                    >
                                      <Minus size={12} />
                                    </button>

                                    <span className="w-5 text-center text-sm font-bold">
                                      {quantity}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleIncreaseQuantity(item)
                                      }
                                      className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* PRICE */}

                                <div className="text-right">
                                  <p className="text-[11px] text-slate-400">
                                    Unit: Rs. {price.toLocaleString()}
                                  </p>

                                  <p className="text-sm font-bold text-ink">
                                    Rs. {itemTotal.toLocaleString()}
                                  </p>
                                </div>

                                {/* DELETE */}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                                  className="text-slate-300 hover:text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* RESTAURANT SUBTOTAL */}

                        <div className="flex justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs">
                          <span className="font-semibold text-slate-500">
                            Restaurant subtotal
                          </span>

                          <span className="font-bold text-ink">
                            Rs. {Number(group.subtotal || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ADD MORE */}

              <Link
                to="/restaurants"
                className="mt-5 block rounded-md border border-dashed border-slate-200 py-2.5 text-center text-xs font-semibold text-brand-500 hover:bg-brand-50"
              >
                + Add More Items
              </Link>
            </div>

            {/* DELIVERY */}

            <div className="qb-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-ink">
                  Delivery & Courier Preferences
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  One Delivery Address
                </span>
              </div>

              {selectedAddress ? (
                <div className="rounded-md bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 text-brand-500" />

                      <div>
                        <p className="text-sm font-bold text-ink">
                          {selectedAddress.label}{" "}
                          {selectedAddress.isPrimary && (
                            <span className="text-xs font-medium text-slate-400">
                              Primary
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {selectedAddress.line1}, {selectedAddress.area},{" "}
                          {selectedAddress.city}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddressPicker((value) => !value)}
                      className="shrink-0 rounded-md border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-500 transition hover:bg-brand-50"
                    >
                      {showAddressPicker ? "Close" : "Change"}
                    </button>
                  </div>

                  {showAddressPicker && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="mb-2 text-xs font-bold text-ink">
                        Select Delivery Address
                      </p>

                      <div className="space-y-2">
                        {user?.addresses?.map((address) => (
                          <button
                            type="button"
                            key={address._id}
                            onClick={() => {
                              setSelectedAddressId(address._id);
                              setInstructions(address.instructions || "");
                              setShowAddressPicker(false);
                            }}
                            className={`w-full rounded-lg border p-3 text-left transition ${
                              address._id === selectedAddressId
                                ? "border-brand-500 bg-brand-50"
                                : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin
                                size={15}
                                className={`mt-0.5 shrink-0 ${
                                  address._id === selectedAddressId
                                    ? "text-brand-500"
                                    : "text-slate-400"
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-ink">
                                    {address.label || "Address"}
                                  </p>

                                  {address._id === selectedAddressId && (
                                    <span className="text-[10px] font-bold text-brand-500">
                                      Selected
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                  {address.line1}
                                  {address.area ? `, ${address.area}` : ""}
                                  {address.city ? `, ${address.city}` : ""}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressPicker(false);

                          setNewAddress({
                            line1: "",
                            area: "",
                            city: "",
                          });

                          setSelectedAddressId(null);
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300 bg-white py-2.5 text-xs font-semibold text-brand-500 hover:bg-brand-50"
                      >
                        <Plus size={14} />
                        Add New Address
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleAddAddress}
                  className="space-y-2 rounded-md bg-slate-50 p-4"
                >
                  <p className="mb-1 text-xs font-semibold text-ink">
                    No saved address yet — add one to continue:
                  </p>

                  <input
                    required
                    placeholder="House / Street address"
                    value={newAddress.line1}
                    onChange={(event) =>
                      setNewAddress((address) => ({
                        ...address,
                        line1: event.target.value,
                      }))
                    }
                    className="qb-input pl-4"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      placeholder="Area"
                      value={newAddress.area}
                      onChange={(event) =>
                        setNewAddress((address) => ({
                          ...address,
                          area: event.target.value,
                        }))
                      }
                      className="qb-input pl-4"
                    />

                    <input
                      required
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(event) =>
                        setNewAddress((address) => ({
                          ...address,
                          city: event.target.value,
                        }))
                      }
                      className="qb-input pl-4"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="qb-btn-primary"
                  >
                    {savingAddress ? "Saving…" : "Save Address"}
                  </button>
                </form>
              )}

              {/* INSTRUCTIONS */}

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Special Cooking or Rider Instructions
                </label>

                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  rows={2}
                  placeholder="e.g. Please ring the bell once, leave at door..."
                  className="w-full rounded-md border border-slate-200 bg-slate-50/80 p-3 text-xs text-ink outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {/* ECO CUTLERY */}

              <label className="mt-4 flex items-center justify-between rounded-md bg-emerald-50 p-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Leaf size={15} />
                  Request Eco-Friendly Cutlery
                </span>

                <input
                  type="checkbox"
                  checked={ecoCutlery}
                  onChange={(event) => setEcoCutlery(event.target.checked)}
                  className="relative h-4 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors checked:bg-emerald-500 before:absolute before:left-0.5 before:top-0.5 before:h-3 before:w-3 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5"
                />
              </label>
            </div>

            {/* VOUCHER */}

            <div className="qb-card p-5">
              <h2 className="mb-2 font-bold text-ink">
                Promos & QuickBite Vouchers
              </h2>

              {restaurantGroups.length > 1 && (
                <p className="mb-3 text-xs text-slate-400">
                  Current vouchers are restaurant-specific. Multi-restaurant
                  voucher support can be added later.
                </p>
              )}

              {appliedVoucher ? (
                <div className="flex items-center justify-between rounded-md bg-emerald-50 p-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-emerald-700">
                    <Tag size={15} />
                    {appliedVoucher.code} applied — Rs.{" "}
                    {Number(
                      appliedVoucher.discountAmount || 0,
                    ).toLocaleString()}{" "}
                    off
                  </span>

                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={voucherCode}
                    disabled={restaurantGroups.length > 1}
                    onChange={(event) =>
                      setVoucherCode(event.target.value.toUpperCase())
                    }
                    placeholder={
                      restaurantGroups.length > 1
                        ? "Available for single-restaurant checkout"
                        : "Enter voucher code"
                    }
                    className="qb-input pl-4"
                  />

                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={applyingVoucher || restaurantGroups.length > 1}
                    className="shrink-0 rounded-md bg-ink px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {applyingVoucher ? "Applying…" : "Apply"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="lg:col-span-1">
            <div className="qb-card sticky top-24 p-5">
              <h2 className="mb-4 font-bold text-ink">Order Summary</h2>

              {loadingContext || !totals ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (
                <>
                  {/* RESTAURANT BREAKDOWN */}

                  <div className="mb-4 space-y-3">
                    {restaurantTotals.map((group) => (
                      <div
                        key={group.restaurantId}
                        className="rounded-lg bg-slate-50 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Store size={14} className="text-brand-500" />

                          <span className="text-xs font-bold text-ink">
                            {group.restaurant?.name || group.restaurantName}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Items</span>

                            <span>
                              Rs. {Number(group.subtotal || 0).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between text-slate-500">
                            <span>Delivery</span>

                            <span>
                              {group.deliveryFee === 0
                                ? "FREE"
                                : `Rs. ${Number(
                                    group.deliveryFee || 0,
                                  ).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL BREAKDOWN */}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Items Subtotal</span>

                      <span>
                        Rs. {Number(totals.itemsSubtotal || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Delivery</span>

                      <span>
                        {totals.deliveryFee === 0
                          ? "FREE"
                          : `Rs. ${Number(
                              totals.deliveryFee || 0,
                            ).toLocaleString()}`}
                      </span>
                    </div>

                    {totals.packagingFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Packaging & Service Fee</span>

                        <span>
                          Rs.{" "}
                          {Number(totals.packagingFee || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {totals.discount > 0 && (
                      <div className="flex justify-between font-semibold text-emerald-600">
                        <span>Voucher Discount</span>

                        <span>
                          -Rs. {Number(totals.discount || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* TOTAL */}

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-ink">Total Payable</span>

                      <span className="text-2xl font-extrabold text-brand-500">
                        Rs. {Number(totals.total || 0).toLocaleString()}
                      </span>
                    </div>

                    {totals.tax > 0 && (
                      <p className="text-right text-[11px] text-slate-400">
                        Includes Rs. {Number(totals.tax || 0).toLocaleString()}{" "}
                        GST
                      </p>
                    )}
                  </div>

                  {/* CHECKOUT */}

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={placingOrder || loadingContext || !totals}
                    className="qb-btn-primary mt-5"
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        Proceed to Payment (Rs.{" "}
                        {Number(totals.total || 0).toLocaleString()}
                        )
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                    Your cart may contain items from multiple restaurants. Each
                    restaurant receives a separate order.
                  </p>

                  {/* TRUST */}

                  <ul className="mt-4 space-y-1.5 text-[11px] text-slate-500">
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      Secure checkout
                    </li>

                    <li className="flex items-center gap-1.5">
                      <Bike size={12} className="text-brand-500" />
                      Restaurant-wise delivery
                    </li>

                    <li className="flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      Order tracking available
                    </li>
                  </ul>
                </>
              )}
            </div>

            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-500"
            >
              <MessageCircle size={14} />
              Need help with your order? Chat Now
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          PAYMENT / ORDER CONFIRMATION MODAL
      ===================================================== */}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink">
                  Payment & Checkout
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Review your order and choose how you want to pay.
                </p>
              </div>

              {!placingOrder && (
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-ink"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-5">
              {/* =================================================
                  PAYMENT METHOD
              ================================================= */}

              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-ink">
                  Select Payment Method
                </p>

                <div className="space-y-2">
                  {enabledPaymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;

                    return (
                      <div
                        key={method.id}
                        className={`overflow-hidden rounded-xl border transition ${
                          isSelected
                            ? "border-brand-500 bg-white"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {/* MAIN PAYMENT OPTION */}
                        <label
                          className={`flex cursor-pointer items-center gap-3 p-3 transition ${
                            isSelected ? "bg-brand-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethodModal"
                            value={method.id}
                            checked={isSelected}
                            onChange={() => {
                              setPaymentMethod(method.id);

                              if (method.id !== "wallet") {
                                setWalletNumber("");
                              }

                              if (method.id !== "card") {
                                setCardNumber("");
                                setCardName("");
                                setCardExpiry("");
                                setCardCvv("");
                              }
                            }}
                            className="accent-brand-500"
                          />

                          <Icon
                            size={16}
                            className={`shrink-0 ${
                              isSelected ? "text-brand-500" : "text-slate-500"
                            }`}
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-ink">
                              {method.label}
                            </span>

                            <span className="block text-[10px] text-slate-400">
                              {method.description}
                            </span>
                          </span>

                          {method.id === "wallet" && (
                            <Smartphone
                              size={15}
                              className="shrink-0 text-brand-500"
                            />
                          )}
                        </label>

                        {/* =================================================
                            MOBILE WALLET DETAILS
                            One radio option for both JazzCash/EasyPaisa.
                            Provider buttons are shown immediately below it.
                        ================================================= */}

                        {isSelected && method.id === "wallet" && (
                          <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                            <div className="mb-3">
                              <p className="mb-1.5 text-[10px] font-semibold text-slate-500">
                                Provider
                              </p>

                              {paymentSettings.jazzcash && (
                                <button
                                  type="button"
                                  onClick={() => setWalletProvider("jazzcash")}
                                  className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                                    walletProvider === "jazzcash"
                                      ? "bg-orange-500 text-white"
                                      : "bg-white text-slate-500 hover:bg-slate-100"
                                  }`}
                                >
                                  JazzCash
                                </button>
                              )}

                              {paymentSettings.easypaisa && (
                                <button
                                  type="button"
                                  onClick={() => setWalletProvider("easypaisa")}
                                  className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                                    walletProvider === "easypaisa"
                                      ? "bg-emerald-500 text-white"
                                      : "bg-white text-slate-500 hover:bg-slate-100"
                                  }`}
                                >
                                  EasyPaisa
                                </button>
                              )}
                            </div>

                            <label className="mb-1.5 block text-[10px] font-semibold text-ink">
                              Mobile Account Number
                            </label>

                            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                              <span className="flex items-center border-r border-slate-200 px-3 text-[11px] font-semibold text-slate-400">
                                +92
                              </span>

                              <input
                                type="tel"
                                inputMode="numeric"
                                value={walletNumber}
                                onChange={(event) =>
                                  setWalletNumber(
                                    event.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 11),
                                  )
                                }
                                placeholder="300-8472911"
                                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-xs text-ink outline-none"
                              />
                            </div>

                            <div className="mt-2 flex items-start gap-1.5">
                              <span className="mt-0.5 text-emerald-600">ⓘ</span>

                              <p className="text-[9px] leading-4 text-slate-500">
                                You will receive a USSD push notification or
                                in-app approval prompt to authorize the payment.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* =================================================
                            CARD DETAILS
                        ================================================= */}

                        {isSelected && method.id === "card" && (
                          <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-ink">
                                  Card Details
                                </p>

                                <p className="text-[10px] text-slate-400">
                                  Visa, Mastercard, PayPak
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-bold text-slate-500 shadow-sm">
                                  VISA
                                </span>
                                <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-bold text-slate-500 shadow-sm">
                                  MC
                                </span>
                                <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-bold text-slate-500 shadow-sm">
                                  PayPak
                                </span>
                              </div>
                            </div>

                            <label className="mb-1.5 block text-[10px] font-semibold text-ink">
                              Card Number
                            </label>

                            <input
                              type="text"
                              inputMode="numeric"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              placeholder="1234 5678 9012 3456"
                              className="qb-input pl-4"
                              maxLength={19}
                            />

                            <div className="mt-3">
                              <label className="mb-1.5 block text-[10px] font-semibold text-ink">
                                Card Holder Name
                              </label>

                              <input
                                type="text"
                                value={cardName}
                                onChange={(event) =>
                                  setCardName(event.target.value)
                                }
                                placeholder="Name on card"
                                className="qb-input pl-4"
                              />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1.5 block text-[10px] font-semibold text-ink">
                                  Expiry
                                </label>

                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={cardExpiry}
                                  onChange={handleExpiryChange}
                                  placeholder="MM/YY"
                                  className="qb-input pl-4"
                                  maxLength={5}
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-[10px] font-semibold text-ink">
                                  CVV
                                </label>

                                <input
                                  type="password"
                                  inputMode="numeric"
                                  value={cardCvv}
                                  onChange={(event) =>
                                    setCardCvv(
                                      event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 4),
                                    )
                                  }
                                  placeholder="•••"
                                  className="qb-input pl-4"
                                  maxLength={4}
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex items-start gap-1.5">
                              <Lock
                                size={11}
                                className="mt-0.5 shrink-0 text-emerald-500"
                              />

                              <p className="text-[9px] leading-4 text-slate-500">
                                For production, connect this form to a real
                                payment gateway instead of sending raw card
                                details to your backend.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* =================================================
                            COD DETAILS
                        ================================================= */}

                        {isSelected && method.id === "cod" && (
                          <div className="border-t border-emerald-100 bg-emerald-50 px-3 py-3">
                            <div className="flex items-start gap-2.5">
                              <Banknote
                                size={15}
                                className="mt-0.5 shrink-0 text-emerald-600"
                              />

                              <div>
                                <p className="text-xs font-bold text-emerald-800">
                                  Cash on Delivery
                                </p>

                                <p className="mt-0.5 text-[10px] leading-4 text-emerald-700">
                                  Pay Rs.{" "}
                                  {Number(totals?.total || 0).toLocaleString()}{" "}
                                  cash when your order arrives.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* =================================================
                  ORDER RECEIPT
              ================================================= */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink">Order Summary</p>

                    <p className="text-[11px] text-slate-400">
                      {items.length} {items.length === 1 ? "item" : "items"} •{" "}
                      {restaurantGroups.length}{" "}
                      {restaurantGroups.length === 1
                        ? "restaurant"
                        : "restaurants"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    {paymentMethod === "cod"
                      ? "COD"
                      : paymentMethod === "wallet"
                        ? walletProvider === "jazzcash"
                          ? "JAZZCASH"
                          : "EASYPAISA"
                        : "CARD"}
                  </span>
                </div>

                {/* ITEMS */}

                <div className="max-h-44 space-y-2 overflow-y-auto border-y border-slate-200 py-3">
                  {items.map((item) => {
                    const price = Number(item.price || 0);
                    const quantity = Number(item.quantity || 1);
                    const itemTotal = price * quantity;

                    return (
                      <div
                        key={item.cartItemId || item.menuItemId}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            {item.name}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            {quantity} × Rs. {price.toLocaleString()}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs font-bold text-ink">
                          Rs. {itemTotal.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* TOTALS */}

                {totals && (
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Items</span>

                      <span>
                        Rs. {Number(totals.itemsSubtotal || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Delivery</span>

                      <span>
                        {totals.deliveryFee === 0
                          ? "FREE"
                          : `Rs. ${Number(
                              totals.deliveryFee || 0,
                            ).toLocaleString()}`}
                      </span>
                    </div>

                    {totals.packagingFee > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Packaging & Service</span>

                        <span>
                          Rs.{" "}
                          {Number(totals.packagingFee || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {totals.discount > 0 && (
                      <div className="flex justify-between font-semibold text-emerald-600">
                        <span>Discount</span>

                        <span>
                          -Rs. {Number(totals.discount || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {totals.tax > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>GST</span>

                        <span>
                          Rs. {Number(totals.tax || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="font-bold text-ink">Total</span>

                      <span className="text-xl font-extrabold text-brand-500">
                        Rs. {Number(totals.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  DELIVERY ADDRESS
              ================================================= */}

              {selectedAddress && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-brand-500"
                    />

                    <div>
                      <p className="text-xs font-bold text-ink">
                        Delivery Address
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {selectedAddress.line1}, {selectedAddress.area},{" "}
                        {selectedAddress.city}
                      </p>

                      {instructions && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Note: {instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  ACTION BUTTON
              ================================================= */}

              <div className="mt-5 flex gap-2">
                {!placingOrder && (
                  <button
                    type="button"
                    onClick={handleClosePaymentModal}
                    className="flex-1 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={placingOrder}
                  className={`qb-btn-primary ${
                    placingOrder ? "w-full" : "flex-[2]"
                  }`}
                >
                  {placingOrder ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing…
                    </>
                  ) : paymentMethod === "cod" ? (
                    <>
                      <CheckCircle2 size={16} />
                      Place Order
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      Pay & Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SUCCESS MODAL
      ===================================================== */}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 size={34} />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-ink">
              Your Order is Placed!
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your order has been placed successfully.
              {createdOrders.length > 1
                ? ` ${createdOrders.length} restaurant orders were created.`
                : " You can track your order from My Orders."}
            </p>

            {createdOrders.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-left">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Order Number
                </p>

                <div className="space-y-1">
                  {createdOrders.map((order) => (
                    <p key={order._id} className="text-sm font-bold text-ink">
                      #QB-{order.customerOrderNumber}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSuccessOk}
              className="qb-btn-primary mt-5 w-full"
            >
              OK, View My Orders
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Cart;
