// src/pages/customer/Checkout.jsx

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import PageShell from "../../components/common/PageShell";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

import { createCheckoutApi } from "../../api/orderApi";
import { applyVoucherApi } from "../../api/voucherApi";

// ---------------------------------------------------------
// PAYMENT METHODS
// ---------------------------------------------------------

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: Banknote,
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: CreditCard,
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    icon: Smartphone,
    needsAccount: true,
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    icon: Smartphone,
    needsAccount: true,
  },
];

// ---------------------------------------------------------
// CHECKOUT
// ---------------------------------------------------------

const Checkout = () => {
  const { user } = useAuth();

  const { items, cartSubtotal, clearCart } = useCart();

  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [walletNumber, setWalletNumber] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);

  const [instructions, setInstructions] = useState("");

  const [ecoFriendlyCutlery, setEcoFriendlyCutlery] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // ---------------------------------------------------------
  // ADDRESS
  // ---------------------------------------------------------

  const selectedAddress = useMemo(() => {
    if (!user?.addresses?.length) return null;

    return (
      user.addresses.find((address) => address.isPrimary) || user.addresses[0]
    );
  }, [user]);

  // ---------------------------------------------------------
  // GROUP ITEMS BY RESTAURANT
  // ---------------------------------------------------------

  const restaurantGroups = useMemo(() => {
    const groups = {};

    for (const item of items) {
      const restaurantId = item?.restaurantId;

      if (!restaurantId) continue;

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
    }

    return Object.values(groups);
  }, [items]);

  // ---------------------------------------------------------
  // TOTAL
  // ---------------------------------------------------------

  const total = useMemo(() => {
    const subtotal = Number(cartSubtotal || 0);
    const discount = Number(appliedVoucher?.discountAmount || 0);

    return Math.max(0, subtotal - discount);
  }, [cartSubtotal, appliedVoucher]);

  // ---------------------------------------------------------
  // CONFIRM ORDER
  // ---------------------------------------------------------
  //
  // IMPORTANT:
  //
  // This is the ONLY place where createCheckoutApi()
  // is called.
  //
  // Cart page should NOT call createCheckoutApi().
  //
  // Backend creates checkoutGroupId automatically.
  //
  // ---------------------------------------------------------
  const handleApplyVoucher = async () => {
    if (!user) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    if (!voucherCode.trim()) {
      toast.error("Enter a voucher code.");
      return;
    }

    if (!restaurantGroups.length) {
      toast.error("Restaurant information is missing.");
      return;
    }

    if (restaurantGroups.length > 1) {
      toast.error(
        "Voucher can currently be applied to one restaurant order at a time.",
      );
      return;
    }

    const restaurant = restaurantGroups[0];

    try {
      setApplyingVoucher(true);

      const result = await applyVoucherApi({
        code: voucherCode.trim().toUpperCase(),
        restaurantId: restaurant.restaurantId,
        itemsSubtotal: restaurant.subtotal,
      });

      if (result?.success) {
        setAppliedVoucher({
          code: result.code,
          discountAmount: Number(result.discountAmount || 0),
          freeDelivery: Boolean(result.freeDelivery),
          message: result.message,
        });

        setVoucherCode(result.code);

        toast.success(result.message || "Voucher applied successfully.");
      } else {
        setAppliedVoucher(null);
        toast.error(result?.message || "Unable to apply voucher.");
      }
    } catch (error) {
      console.error("Voucher apply failed:", error);

      setAppliedVoucher(null);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to apply voucher.";

      toast.error(message);
    } finally {
      setApplyingVoucher(false);
    }
  };
  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    if (!items.length) {
      toast.error("Your cart is empty.");
      navigate("/cart");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please add a delivery address first.");
      navigate("/cart");
      return;
    }

    if (!restaurantGroups.length) {
      toast.error("Restaurant information is missing.");
      navigate("/cart");
      return;
    }

    const payment = PAYMENT_METHODS.find(
      (method) => method.id === paymentMethod,
    );

    if (payment?.needsAccount && !walletNumber.trim()) {
      toast.error("Enter your mobile wallet number.");
      return;
    }

    setPlacingOrder(true);

    try {
      // -----------------------------------------------------
      // BUILD CHECKOUT PAYLOAD
      // -----------------------------------------------------

      const payload = {
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          restaurantId: item.restaurantId,
          quantity: Number(item.quantity || 1),
          notes: item.notes || undefined,
        })),

        voucherCode: appliedVoucher?.code || undefined,

        deliveryAddress: {
          label: selectedAddress.label,
          line1: selectedAddress.line1,
          area: selectedAddress.area,
          city: selectedAddress.city,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
          instructions,
        },

        ecoFriendlyCutlery,

        paymentMethod,

        paymentAccountNumber:
          paymentMethod === "jazzcash" || paymentMethod === "easypaisa"
            ? walletNumber.trim()
            : undefined,
      };

      // -----------------------------------------------------
      // CREATE ORDERS
      // -----------------------------------------------------
      //
      // Backend creates:
      //
      // CHK-XXXX
      //
      // Restaurant A -> Order A
      // Restaurant B -> Order B
      //
      // Both orders share the same checkoutGroupId.
      //
      // We DO NOT create or send checkoutGroupId here.
      // -----------------------------------------------------

      const result = await createCheckoutApi(payload);

      console.log("Checkout created successfully:", result);

      // -----------------------------------------------------
      // ONLINE PAYMENT
      // -----------------------------------------------------
      //
      // If a real payment gateway later returns paymentUrl,
      // redirect there.
      //
      // COD does not have paymentUrl.
      // -----------------------------------------------------

      if (paymentMethod !== "cod" && result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      // -----------------------------------------------------
      // COD SUCCESS
      // -----------------------------------------------------

      if (paymentMethod === "cod") {
        await clearCart();

        const orderCount = Array.isArray(result?.orders)
          ? result.orders.length
          : 1;

        toast.success(
          orderCount > 1
            ? `${orderCount} orders placed successfully!`
            : "Order placed successfully!",
        );

        navigate("/my-orders");

        return;
      }

      // -----------------------------------------------------
      // ONLINE PAYMENT WITHOUT PAYMENT URL
      // -----------------------------------------------------
      //
      // Currently your backend creates the order but does not
      // yet provide a real gateway URL.
      //
      // Do not pretend that payment was completed.
      // -----------------------------------------------------

      await clearCart();

      toast.success(
        "Order created successfully. Payment is pending confirmation.",
      );

      navigate("/my-orders");
    } catch (error) {
      console.error("Checkout failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to complete checkout.";

      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // ---------------------------------------------------------
  // EMPTY CART
  // ---------------------------------------------------------

  if (!items.length) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="text-2xl font-extrabold text-ink">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Add some food items before checkout.
          </p>

          <Link to="/restaurants" className="qb-btn-primary mt-6 inline-flex">
            Browse Restaurants
          </Link>
        </div>
      </PageShell>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        {/* HEADER */}

        <div className="mb-6">
          <Link
            to="/cart"
            className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline"
          >
            <ArrowLeft size={15} />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-extrabold text-ink">Checkout</h1>

          <p className="mt-1 text-sm text-slate-500">
            One checkout for all restaurants in your cart.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-6 lg:col-span-2">
            {/* RESTAURANT ORDERS */}

            <div className="qb-card p-5">
              <h2 className="mb-4 font-bold text-ink">Your Orders</h2>

              <div className="space-y-5">
                {restaurantGroups.map((restaurant) => (
                  <div
                    key={restaurant.restaurantId}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-ink">
                        {restaurant.restaurantName}
                      </h3>

                      <span className="text-xs font-semibold text-slate-500">
                        {restaurant.items.length} item
                        {restaurant.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {restaurant.items.map((item) => (
                        <div
                          key={item.cartItemId || item.menuItemId}
                          className="flex items-center gap-3"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
                              🍽️
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-sm font-bold text-ink">
                              {item.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              Rs. {Number(item.price || 0).toLocaleString()} ×{" "}
                              {item.quantity}
                            </p>
                          </div>

                          <p className="text-sm font-bold text-ink">
                            Rs.{" "}
                            {(
                              Number(item.price || 0) *
                              Number(item.quantity || 0)
                            ).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3 text-right">
                      <span className="text-xs text-slate-500">
                        Restaurant subtotal
                      </span>

                      <p className="font-bold text-ink">
                        Rs. {restaurant.subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DELIVERY ADDRESS */}

            <div className="qb-card p-5">
              <h2 className="mb-4 font-bold text-ink">Delivery Address</h2>

              {selectedAddress ? (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="font-bold text-ink">{selectedAddress.label}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedAddress.line1}
                    {selectedAddress.area ? `, ${selectedAddress.area}` : ""}
                    {selectedAddress.city ? `, ${selectedAddress.city}` : ""}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  No delivery address found. Please add one from Cart.
                </div>
              )}

              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Delivery instructions..."
                className="qb-input mt-4 min-h-[90px] pl-4 pt-3"
              />

              <label className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                <span className="text-sm font-semibold text-emerald-800">
                  Eco-Friendly Cutlery
                </span>

                <input
                  type="checkbox"
                  checked={ecoFriendlyCutlery}
                  onChange={(e) => setEcoFriendlyCutlery(e.target.checked)}
                />
              </label>
            </div>

            {/* PAYMENT */}

            <div className="qb-card p-5">
              <h2 className="mb-4 font-bold text-ink">Payment Method</h2>

              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;

                  return (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${
                        paymentMethod === method.id
                          ? "border-brand-500 bg-brand-50"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />

                      <Icon size={18} />

                      <span className="text-sm font-semibold">
                        {method.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {(paymentMethod === "jazzcash" ||
                paymentMethod === "easypaisa") && (
                <input
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="03001234567"
                  className="qb-input mt-3 pl-4"
                  inputMode="numeric"
                />
              )}
            </div>
          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <div>
            <div className="qb-card sticky top-24 p-5">
              <h2 className="mb-4 font-bold text-ink">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Food subtotal</span>

                  <span className="font-semibold">
                    Rs. {total.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Restaurants</span>

                  <span className="font-semibold">
                    {restaurantGroups.length}
                  </span>
                </div>
              </div>
              {/* VOUCHER */}

              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-ink">
                  Have a voucher?
                </p>

                <div className="flex gap-2">
                  <input
                    value={voucherCode}
                    onChange={(e) =>
                      setVoucherCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter voucher code"
                    disabled={applyingVoucher}
                    className="qb-input min-w-0 flex-1 pl-4 uppercase"
                  />

                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={applyingVoucher || !voucherCode.trim()}
                    className="shrink-0 rounded-lg bg-brand-500 px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applyingVoucher ? "Applying..." : "Apply"}
                  </button>
                </div>

                {appliedVoucher && (
                  <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">
                        {appliedVoucher.code}
                      </span>

                      {appliedVoucher.discountAmount > 0 && (
                        <span className="font-bold">
                          - Rs. {appliedVoucher.discountAmount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {appliedVoucher.freeDelivery && (
                      <p className="mt-1 font-semibold">
                        Free delivery applied
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="my-4 border-t border-slate-100" />

              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>

                <span className="text-2xl font-extrabold text-brand-500">
                  Rs. {total.toLocaleString()}
                </span>
              </div>

              {/* -------------------------------------------------
                  CONFIRM & PAY
              ------------------------------------------------- */}

              <button
                type="button"
                disabled={placingOrder}
                onClick={handleConfirmOrder}
                className="qb-btn-primary mt-5 w-full"
              >
                {placingOrder ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "cod" ? (
                  "Confirm Order"
                ) : (
                  "Confirm & Pay"
                )}
              </button>

              <div className="mt-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                <ShieldCheck size={16} className="shrink-0" />

                <span>
                  Your payment is processed securely through the selected
                  payment method.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Checkout;
