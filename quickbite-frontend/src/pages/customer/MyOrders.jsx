import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock3,
  Bike,
  PackageCheck,
  CheckCircle2,
  Circle,
  X,
  Star,
  RotateCcw,
  ReceiptText,
  Eye,
  Loader2,
  AlertCircle,
  Utensils,
  RefreshCw,
} from "lucide-react";

import PageShell from "../../components/common/PageShell";

import { useCart } from "../../hooks/useCart";

import {
  getMyOrdersApi,
  getOrderByIdApi,
  cancelOrderApi,
  rateOrderApi,
} from "../../api/orderApi";

// =========================================================
// CONSTANTS
// =========================================================

const TABS = [
  {
    id: "all",
    label: "All Orders",
  },
  {
    id: "active",
    label: "Active Orders",
  },
  {
    id: "delivered",
    label: "Delivered",
  },
  {
    id: "cancelled",
    label: "Cancelled",
  },
];

const ACTIVE_STATUSES = ["confirmed", "preparing", "out_for_delivery"];

const STATUS_STEPS = [
  {
    id: "confirmed",
    label: "Order Confirmed",
    shortLabel: "Confirmed",
  },
  {
    id: "preparing",
    label: "Prepared & Packed",
    shortLabel: "Preparing",
  },
  {
    id: "out_for_delivery",
    label: "Out for Delivery",
    shortLabel: "On the way",
  },
  {
    id: "delivered",
    label: "Delivered",
    shortLabel: "Delivered",
  },
];

// =========================================================
// HELPERS
// =========================================================

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getRelativePlacedTime = (date) => {
  if (!date) return "";

  const created = new Date(date);
  const now = new Date();

  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Placed just now";

  if (diffMinutes < 60) {
    return `Placed ${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }

  if (diffHours < 24) {
    return `Placed ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  if (diffDays === 1) {
    return "Placed yesterday";
  }

  if (diffDays < 7) {
    return `Placed ${diffDays} days ago`;
  }

  return `Placed ${formatDate(date)}`;
};

const getStatusLabel = (status) => {
  const labels = {
    confirmed: "Order Confirmed",
    preparing: "Preparing & Packed",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status] || status || "Unknown";
};

const getPaymentLabel = (paymentMethod) => {
  const labels = {
    cod: "Cash on Delivery",
    jazzcash: "JazzCash",
    easypaisa: "EasyPaisa",
    card: "Credit / Debit Card",
  };

  return labels[paymentMethod] || paymentMethod || "Payment";
};

const getItemSummary = (order) => {
  if (!order?.items?.length) {
    return "No items";
  }

  const firstItem = order.items[0];

  const firstText = `${firstItem.name || "Item"} × ${firstItem.quantity || 1}`;

  if (order.items.length === 1) {
    return firstText;
  }

  return `${firstText} + ${
    order.items.length - 1
  } more item${order.items.length - 1 === 1 ? "" : "s"}`;
};

const getTotalItems = (order) => {
  if (!order?.items?.length) return 0;

  return order.items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
};

const getRestaurantName = (order) => {
  return order?.restaurant?.name || "QuickBite Restaurant";
};

const getRestaurantImage = (order) => {
  return order?.restaurant?.coverImage || "";
};

const getCurrentStepIndex = (status) => {
  const index = STATUS_STEPS.findIndex((step) => step.id === status);

  return index === -1 ? 0 : index;
};

// =========================================================
// STATUS BADGE
// =========================================================

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    preparing: "bg-orange-50 text-orange-700 border-orange-100",
    out_for_delivery: "bg-blue-50 text-blue-700 border-blue-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${
        styles[status] || "bg-slate-50 text-slate-600 border-slate-100"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

// =========================================================
// RESTAURANT IMAGE
// =========================================================

const RestaurantImage = ({ order, className = "" }) => {
  const image = getRestaurantImage(order);

  if (image) {
    return (
      <img
        src={image}
        alt={getRestaurantName(order)}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-orange-50 text-brand-500 ${className}`}
    >
      <Utensils size={24} />
    </div>
  );
};

// =========================================================
// ACTIVE DELIVERY TRACKER
// =========================================================

const DeliveryTracker = ({ status }) => {
  const currentIndex = getCurrentStepIndex(status);

  return (
    <div className="mt-7">
      <div className="relative px-1">
        {/* BASE LINE */}
        <div className="absolute left-3 right-3 top-[7px] h-[3px] rounded-full bg-slate-200" />

        {/* ACTIVE LINE */}
        <div
          className="absolute left-3 top-[7px] h-[3px] rounded-full bg-brand-500 transition-all duration-500"
          style={{
            width:
              currentIndex === 0
                ? "0%"
                : `calc(${(currentIndex / 3) * 100}% - 4px)`,
          }}
        />

        <div className="relative grid grid-cols-4">
          {STATUS_STEPS.map((step, index) => {
            const completed = index <= currentIndex;
            const current = index === currentIndex;

            return (
              <div
                key={step.id}
                className={`flex flex-col ${
                  index === 0
                    ? "items-start"
                    : index === 3
                      ? "items-end"
                      : "items-center"
                }`}
              >
                <div
                  className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    completed
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-slate-300 bg-white text-slate-300"
                  } ${current ? "ring-4 ring-brand-50" : ""}`}
                >
                  {completed ? (
                    <CheckCircle2 size={10} strokeWidth={3} />
                  ) : (
                    <Circle size={7} />
                  )}
                </div>

                <span
                  className={`mt-2 text-[9px] sm:text-[10px] font-semibold ${
                    completed ? "text-slate-700" : "text-slate-300"
                  } ${
                    index === 0
                      ? "text-left"
                      : index === 3
                        ? "text-right"
                        : "text-center"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>

                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ACTIVE ORDER CARD
// =========================================================

const ActiveOrderCard = ({ order, onView, onCancel }) => {
  const navigate = useNavigate();

  const canCancel = order.status === "confirmed";

  const handleTrack = () => {
    onView(order);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      {/* TOP ORANGE BORDER */}
      <div className="h-1 bg-brand-500" />

      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          {/* ORDER INFORMATION */}
          <div className="flex min-w-0 items-start gap-4">
            <RestaurantImage
              order={order}
              className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Order #QB-{order.customerOrderNumber}{" "}
                </h3>

                <StatusBadge status={order.status} />
              </div>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {getRestaurantName(order)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {getRelativePlacedTime(order.createdAt)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {getTotalItems(order)}{" "}
                {getTotalItems(order) === 1 ? "item" : "items"} •{" "}
                {formatCurrency(order.totalAmount)} •{" "}
                {getPaymentLabel(order.paymentMethod)}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleTrack}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md"
            >
              <Bike size={14} />
              <span>Track / View Order</span>
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(order)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS */}
        <DeliveryTracker status={order.status} />

        {/* BOTTOM INFO */}
        <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2 text-xs text-slate-500">
            <MapPin size={16} className="mt-0.5 shrink-0 text-brand-500" />

            <span className="truncate">
              {order.deliveryAddress?.line1 || "Delivery address unavailable"}
              {order.deliveryAddress?.area
                ? `, ${order.deliveryAddress.area}`
                : ""}
              {order.deliveryAddress?.city
                ? `, ${order.deliveryAddress.city}`
                : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={15} className="text-brand-500" />

            {order.riderEtaMinutes ? (
              <span>
                Estimated delivery:{" "}
                <strong className="text-slate-700">
                  {order.riderEtaMinutes} min
                </strong>
              </span>
            ) : (
              <span>Estimated delivery time unavailable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// PAST ORDER CARD
// =========================================================

const PastOrderCard = ({ order, onView, onReceipt, onReorder, onReview }) => {
  const totalItems = getTotalItems(order);

  const isDelivered = order.status === "delivered";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_5px_25px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(15,23,42,0.07)] sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* LEFT */}
        <div className="flex min-w-0 items-start gap-4">
          <RestaurantImage
            order={order}
            className="h-14 w-14 shrink-0 rounded-2xl sm:h-16 sm:w-16"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Order #QB-{order.customerOrderNumber}{" "}
              </h3>

              <StatusBadge status={order.status} />
            </div>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {getRestaurantName(order)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {getItemSummary(order)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>{formatDate(order.createdAt)}</span>

              <span>•</span>

              <span>{formatCurrency(order.totalAmount)}</span>

              <span>•</span>

              <span>{getPaymentLabel(order.paymentMethod)}</span>

              <span>•</span>

              <span>
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          {isDelivered && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2.5 text-[11px] font-bold text-brand-600 transition hover:bg-brand-500 hover:text-white"
            >
              <RotateCcw size={13} />
              Reorder Items
            </button>
          )}

          {isDelivered && !order.reviewSubmitted && (
            <button
              type="button"
              onClick={() => onReview(order)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
            >
              <Star size={13} />
              Rate Order
            </button>
          )}

          {isDelivered && order.reviewSubmitted && (
            <div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-4 py-2.5 text-[11px] font-bold text-yellow-700">
              <Star size={13} fill="currentColor" />
              {order.rating || 0}/5
            </div>
          )}

          <button
            type="button"
            onClick={() => onReceipt(order)}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2.5 text-[11px] font-bold text-brand-600 transition hover:bg-orange-100 hover:border-orange-300"
          >
            <ReceiptText size={14} />
            Receipt
          </button>

          <button
            type="button"
            onClick={() => onView(order)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-brand-600 hover:shadow-md"
          >
            <Eye size={14} />
            View Order
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// RECEIPT MODAL
// =========================================================

const ReceiptModal = ({ order, onClose }) => {
  if (!order) return null;

  const subtotal = Number(order.itemsSubtotal ?? order.subtotal ?? 0);
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const packagingFee = Number(order.packagingFee ?? 0);
  const tax = Number(order.tax ?? order.taxAmount ?? 0);
  const tip = Number(order.tipAmount ?? order.tip ?? 0);
  const discount = Number(order.voucherDiscount ?? order.discount ?? 0);

  const calculatedTotal =
    subtotal + deliveryFee + packagingFee + tax + tip - discount;

  const total = Number(order.totalAmount ?? order.total ?? calculatedTotal);

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* RECEIPT HEADER */}
        <div className="border-b border-dashed border-slate-200 bg-orange-50/70 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm">
                <ReceiptText size={21} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">
                  Payment Receipt
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                  #{order.customerOrderNumber}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-100"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">
              {getRestaurantName(order)}
            </span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
        </div>

        {/* RECEIPT BODY */}
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">
                  Order Summary
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {getTotalItems(order)}{" "}
                  {getTotalItems(order) === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item, index) => {
                const quantity = Number(item.quantity || 0);
                const unitPrice = Number(item.unitPrice || item.price || 0);
                const lineTotal = unitPrice * quantity;

                return (
                  <div
                    key={`${item.menuItem || item.name}-${index}`}
                    className="flex items-start justify-between gap-4 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        {item.name || "Item"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {quantity} × {formatCurrency(unitPrice)}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-extrabold text-slate-800">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOTALS */}
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex justify-between py-1.5 text-xs text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between py-1.5 text-xs text-slate-500">
              <span>Delivery fee</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>

            {packagingFee > 0 && (
              <div className="flex justify-between py-1.5 text-xs text-slate-500">
                <span>Packaging fee</span>
                <span>{formatCurrency(packagingFee)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between py-1.5 text-xs text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}

            {tip > 0 && (
              <div className="flex justify-between py-1.5 text-xs text-slate-500">
                <span>Tip</span>
                <span>{formatCurrency(tip)}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between py-1.5 text-xs font-semibold text-emerald-600">
                <span>
                  Discount{order.voucherCode ? ` (${order.voucherCode})` : ""}
                </span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}

            <div className="mt-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">
                  Total Paid
                </span>
                <span className="text-xl font-extrabold text-brand-500">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT INFORMATION */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Method
              </p>
              <p className="mt-2 text-xs font-extrabold text-slate-800">
                {getPaymentLabel(order.paymentMethod)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Status
              </p>
              <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold capitalize text-emerald-700">
                {order.paymentStatus || "pending"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-center">
            <p className="text-[10px] leading-4 text-slate-400">
              Thank you for ordering with QuickBite. This receipt contains the
              payment summary for order #QB-{order.customerOrderNumber}
            </p>
          </div>
        </div>

        {/* RECEIPT FOOTER */}
        <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ORDER DETAILS MODAL
// =========================================================

const OrderDetailsModal = ({
  order,
  onClose,
  onCancel,
  onReorder,
  onReview,
}) => {
  if (!order) return null;

  const canCancel = order.status === "confirmed";
  const isDelivered = order.status === "delivered";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Order Details
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              #{order.customerOrderNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={17} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {/* RESTAURANT */}
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <RestaurantImage order={order} className="h-14 w-14 rounded-xl" />

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900">
                {getRestaurantName(order)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(order.createdAt)}
              </p>

              <div className="mt-2">
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>

          {/* ACTIVE TRACKER */}
          {ACTIVE_STATUSES.includes(order.status) && (
            <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Bike size={16} className="text-brand-500" />
                Delivery progress
              </div>

              <DeliveryTracker status={order.status} />
            </div>
          )}

          {/* ITEMS */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Items</h3>

              <span className="text-xs text-slate-400">
                {getTotalItems(order)}{" "}
                {getTotalItems(order) === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {order.items?.map((item, index) => (
                <div
                  key={`${item.menuItem || item.name}-${index}`}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>

                    {item.notes && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 text-sm font-extrabold text-slate-900">
                    {formatCurrency(
                      Number(item.unitPrice || 0) * Number(item.quantity || 0),
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DELIVERY ADDRESS */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-extrabold text-slate-900">
              Delivery Address
            </h3>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <MapPin size={17} className="mt-0.5 shrink-0 text-brand-500" />

              <div>
                <p className="text-xs font-bold text-slate-800">
                  {order.deliveryAddress?.label || "Delivery Address"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {order.deliveryAddress?.line1 || "Address unavailable"}
                  {order.deliveryAddress?.area
                    ? `, ${order.deliveryAddress.area}`
                    : ""}
                  {order.deliveryAddress?.city
                    ? `, ${order.deliveryAddress.city}`
                    : ""}
                </p>

                {order.deliveryAddress?.instructions && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Instructions: {order.deliveryAddress.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT SUMMARY */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-extrabold text-slate-900">
              Payment Summary
            </h3>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between py-1.5 text-xs text-slate-500">
                <span>Items subtotal</span>
                <span>{formatCurrency(order.itemsSubtotal)}</span>
              </div>

              <div className="flex justify-between py-1.5 text-xs text-slate-500">
                <span>Delivery fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>

              {Number(order.packagingFee || 0) > 0 && (
                <div className="flex justify-between py-1.5 text-xs text-slate-500">
                  <span>Packaging fee</span>
                  <span>{formatCurrency(order.packagingFee)}</span>
                </div>
              )}

              {Number(order.voucherDiscount || 0) > 0 && (
                <div className="flex justify-between py-1.5 text-xs text-emerald-600">
                  <span>
                    Voucher {order.voucherCode ? `(${order.voucherCode})` : ""}
                  </span>
                  <span>-{formatCurrency(order.voucherDiscount)}</span>
                </div>
              )}

              {Number(order.tax || 0) > 0 && (
                <div className="flex justify-between py-1.5 text-xs text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}

              {Number(order.tipAmount || 0) > 0 && (
                <div className="flex justify-between py-1.5 text-xs text-slate-500">
                  <span>Tip</span>
                  <span>{formatCurrency(order.tipAmount)}</span>
                </div>
              )}

              <div className="mt-2 flex justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-extrabold text-slate-900">
                  Total
                </span>

                <span className="text-base font-extrabold text-brand-500">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Payment
                </span>

                <span className="text-[11px] font-bold text-slate-800">
                  {getPaymentLabel(order.paymentMethod)} •{" "}
                  {order.paymentStatus || "pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="rounded-full border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              Cancel Order
            </button>
          )}

          {isDelivered && !order.reviewSubmitted && (
            <button
              type="button"
              onClick={() => onReview(order)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Star size={14} />
              Rate Order
            </button>
          )}

          {isDelivered && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-600"
            >
              <RotateCcw size={14} />
              Reorder Items
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// CANCEL MODAL
// =========================================================

const CancelModal = ({
  order,
  reason,
  setReason,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={22} />
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-slate-900">
              Cancel this order?
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Order #QB-{order.customerOrderNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        <label className="mt-5 block text-xs font-bold text-slate-700">
          Cancellation reason
        </label>

        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          placeholder="Tell us why you want to cancel..."
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
        />

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full bg-slate-100 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Keep Order
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 py-3 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// REVIEW MODAL
// =========================================================

const ReviewModal = ({
  order,
  rating,
  setRating,
  comment,
  setComment,
  loading,
  onClose,
  onSubmit,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Your feedback
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Rate your order
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {getRestaurantName(order)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* STARS */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="transition hover:scale-110"
            >
              <Star
                size={30}
                className={
                  star <= rating ? "text-yellow-400" : "text-slate-200"
                }
                fill={star <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>

        <p className="mt-2 text-center text-xs font-semibold text-slate-500">
          {rating === 0 ? "Select a rating" : `${rating} out of 5`}
        </p>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Share your experience (optional)..."
          className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
        />

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full bg-slate-100 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || rating < 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 py-3 text-xs font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// EMPTY STATE
// =========================================================

const EmptyOrders = ({ tab }) => {
  const navigate = useNavigate();

  const messages = {
    all: {
      title: "No orders yet",
      description:
        "Your QuickBite orders will appear here once you place your first order.",
    },
    active: {
      title: "No active orders",
      description: "You don't have any ongoing deliveries right now.",
    },
    delivered: {
      title: "No delivered orders",
      description: "Your completed orders will appear here.",
    },
    cancelled: {
      title: "No cancelled orders",
      description: "Orders that you cancel will appear here.",
    },
  };

  const content = messages[tab] || messages.all;

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-brand-500">
        <Utensils size={27} />
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-slate-900">
        {content.title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
        {content.description}
      </p>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-5 rounded-full bg-brand-500 px-6 py-3 text-xs font-bold text-white transition hover:bg-brand-600"
      >
        Browse Restaurants
      </button>
    </div>
  );
};

// =========================================================
// LOADING STATE
// =========================================================

const LoadingOrders = () => {
  return (
    <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm">
      <Loader2 size={30} className="mx-auto animate-spin text-brand-500" />

      <p className="mt-4 text-sm font-semibold text-slate-500">
        Loading your orders...
      </p>
    </div>
  );
};

// =========================================================
// MAIN COMPONENT
// =========================================================

const MyOrders = () => {
  const navigate = useNavigate();

  const { addItem } = useCart();

  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [activeTab, setActiveTab] = useState("all");

  const [orders, setOrders] = useState([]);

  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    delivered: 0,
    cancelled: 0,
  });

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // -------------------------------------------------------
  // MODALS
  // -------------------------------------------------------

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [receiptOrder, setReceiptOrder] = useState(null);

  const [cancelOrder, setCancelOrder] = useState(null);

  const [cancelReason, setCancelReason] = useState("");

  const [cancelling, setCancelling] = useState(false);

  const [reviewOrder, setReviewOrder] = useState(null);

  const [reviewRating, setReviewRating] = useState(0);

  const [reviewComment, setReviewComment] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);

  const [reorderingId, setReorderingId] = useState(null);

  // -------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------

  const ORDERS_PER_PAGE = 5;

  const [currentPage, setCurrentPage] = useState(1);

  // =======================================================
  // LOAD ORDERS
  // =======================================================

  const loadOrders = async ({ showFullLoader = true } = {}) => {
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const result = await getMyOrdersApi(activeTab);

      setOrders(Array.isArray(result?.orders) ? result.orders : []);

      if (result?.counts) {
        setCounts({
          all: Number(result.counts.all || 0),
          active: Number(result.counts.active || 0),
          delivered: Number(result.counts.delivered || 0),
          cancelled: Number(result.counts.cancelled || 0),
        });
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =======================================================
  // FETCH WHEN TAB CHANGES
  // =======================================================

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");

    loadOrders({
      showFullLoader: true,
    });
  }, [activeTab]);

  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh = async () => {
    await loadOrders({
      showFullLoader: false,
    });

    toast.success("Orders refreshed");
  };

  // =======================================================
  // SEARCH FILTER
  // =======================================================

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return orders;

    return orders.filter((order) => {
      const orderNumber = String(order.customerOrderNumber || "").toLowerCase();
      const restaurantName = String(order.restaurant?.name || "").toLowerCase();

      return orderNumber.includes(term) || restaurantName.includes(term);
    });
  }, [orders, searchTerm]);

  // =======================================================
  // ACTIVE / PAST ORDERS
  // =======================================================

  const activeOrders = useMemo(() => {
    return filteredOrders.filter((order) =>
      ACTIVE_STATUSES.includes(order.status),
    );
  }, [filteredOrders]);

  const pastOrders = useMemo(() => {
    return filteredOrders.filter(
      (order) => !ACTIVE_STATUSES.includes(order.status),
    );
  }, [filteredOrders]);

  // =======================================================
  // PAGINATION
  // =======================================================

  const paginatedPastOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;

    const end = start + ORDERS_PER_PAGE;

    return pastOrders.slice(start, end);
  }, [pastOrders, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(pastOrders.length / ORDERS_PER_PAGE),
  );

  // =======================================================
  // KEEP PAGE VALID
  // =======================================================

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =======================================================
  // OPEN ORDER
  // =======================================================

  const handleViewOrder = async (order) => {
    try {
      const result = await getOrderByIdApi(order._id);

      if (result?.order) {
        setSelectedOrder(result.order);
      } else {
        setSelectedOrder(order);
      }
    } catch (error) {
      console.error("Failed to load order:", error);

      // Fallback to already-loaded order
      setSelectedOrder(order);
    }
  };

  // =======================================================
  // OPEN RECEIPT
  // =======================================================

  const handleViewReceipt = async (order) => {
    try {
      const result = await getOrderByIdApi(order._id);

      if (result?.order) {
        setReceiptOrder(result.order);
      } else {
        setReceiptOrder(order);
      }
    } catch (error) {
      console.error("Failed to load receipt:", error);

      setReceiptOrder(order);
    }
  };

  // =======================================================
  // CANCEL
  // =======================================================

  const openCancelModal = (order) => {
    setCancelOrder(order);
    setCancelReason("");
  };

  const closeCancelModal = () => {
    if (cancelling) return;

    setCancelOrder(null);
    setCancelReason("");
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder?._id) return;

    try {
      setCancelling(true);

      await cancelOrderApi(
        cancelOrder._id,
        cancelReason.trim() || "Cancelled by customer",
      );

      toast.success("Order cancelled successfully");

      setCancelOrder(null);
      setCancelReason("");

      setSelectedOrder(null);

      await loadOrders({
        showFullLoader: false,
      });
    } catch (error) {
      console.error("Failed to cancel order:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to cancel this order.",
      );
    } finally {
      setCancelling(false);
    }
  };

  // =======================================================
  // REVIEW
  // =======================================================

  const openReviewModal = (order) => {
    setReviewOrder(order);
    setReviewRating(order.rating || 0);
    setReviewComment("");
  };

  const closeReviewModal = () => {
    if (submittingReview) return;

    setReviewOrder(null);
    setReviewRating(0);
    setReviewComment("");
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder?._id) return;

    if (!reviewRating) {
      toast.error("Please select a rating.");
      return;
    }

    try {
      setSubmittingReview(true);

      await rateOrderApi(reviewOrder._id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      toast.success("Thanks for your review!");

      setReviewOrder(null);
      setReviewRating(0);
      setReviewComment("");

      await loadOrders({
        showFullLoader: false,
      });
    } catch (error) {
      console.error("Failed to submit review:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // =======================================================
  // REORDER
  // =======================================================

  const handleReorder = async (order) => {
    if (!order?.items?.length) {
      toast.error("No items available to reorder.");
      return;
    }

    try {
      setReorderingId(order._id);

      let addedCount = 0;
      let failedCount = 0;

      for (const item of order.items) {
        try {
          await addItem({
            menuItemId: item.menuItem,
            quantity: item.quantity || 1,
          });

          addedCount += 1;
        } catch (error) {
          console.error(`Failed to add ${item.name}:`, error);

          failedCount += 1;
        }
      }

      if (addedCount > 0) {
        if (failedCount > 0) {
          toast.success(
            `${addedCount} item${
              addedCount === 1 ? "" : "s"
            } added to cart. Some items were unavailable.`,
          );
        } else {
          toast.success("All items added to your cart.");
        }

        navigate("/cart");
      } else {
        toast.error("Unable to reorder these items.");
      }
    } catch (error) {
      console.error("Reorder failed:", error);

      toast.error(error?.message || "Unable to reorder items.");
    } finally {
      setReorderingId(null);
    }
  };

  // =======================================================
  // CLEAR HISTORY UI
  // =======================================================

  const handleClearHistory = () => {
    /*
     * Backend currently has no delete-history endpoint.
     *
     * Therefore we intentionally do not delete anything
     * locally because doing so would make the UI different
     * from the database.
     */
    toast("Past order history is stored in your account.");
  };

  // =======================================================
  // TAB COUNTER
  // =======================================================

  const getTabCount = (tabId) => {
    return counts[tabId] ?? 0;
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <PageShell>
      <div className="min-h-screen bg-[#f8f9fd] text-slate-900">
        {/* =================================================
            MAIN CONTAINER
        ================================================== */}

        <main className="mx-auto w-full max-w-[1300px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {/* =================================================
              BREADCRUMBS
          ================================================== */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="transition hover:text-brand-500">
              Home
            </Link>

            <span>›</span>

            <span>My Account</span>

            <span>›</span>

            <span className="font-semibold text-slate-600">
              Orders & History
            </span>
          </div>

          {/* =================================================
              PAGE HEADER
          ================================================== */}

          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between ">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                <span className="text-[#ff6247]">My Orders</span>
                <span className="text-slate-950"> &amp; History</span>
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                Manage your ongoing deliveries, revisit past culinary
                experiences, or review your order history.
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full xl:w-[340px]">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search restaurant or order no..."
                className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-xs text-slate-800 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-4 focus:ring-orange-50"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              TABS
          ================================================== */}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "border-[#ff6247] bg-[#ff6247] text-white shadow-sm"
                      : "border-orange-100 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50"
                  }`}
                >
                  {tab.label}

                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {getTabCount(tab.id)}
                  </span>
                </button>
              );
            })}

            {/* REFRESH */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />

                <span>{error}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadOrders({
                    showFullLoader: true,
                  })
                }
                className="font-bold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div className="mt-8">
              <LoadingOrders />
            </div>
          ) : (
            <>
              {/* =================================================
                  ACTIVE DELIVERY SECTION
              ================================================== */}

              {(activeTab === "all" || activeTab === "active") &&
                activeOrders.length > 0 && (
                  <section className="mt-9">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />

                        <h2 className="text-lg font-extrabold text-slate-900">
                          Active Delivery
                        </h2>
                      </div>

                      <span className="text-[10px] font-semibold text-brand-500">
                        Live tracking updates
                      </span>
                    </div>

                    <div className="space-y-5">
                      {activeOrders.map((order) => (
                        <ActiveOrderCard
                          key={order._id}
                          order={order}
                          onView={handleViewOrder}
                          onCancel={openCancelModal}
                        />
                      ))}
                    </div>
                  </section>
                )}

              {/* =================================================
                  ACTIVE TAB EMPTY
              ================================================== */}

              {activeTab === "active" && activeOrders.length === 0 && (
                <section className="mt-9">
                  <EmptyOrders tab="active" />
                </section>
              )}

              {/* =================================================
                  PAST ORDERS
              ================================================== */}

              {(activeTab !== "active" || activeOrders.length === 0) &&
                pastOrders.length > 0 && (
                  <section className="mt-10">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900">
                          {activeTab === "delivered"
                            ? "Delivered Orders"
                            : activeTab === "cancelled"
                              ? "Cancelled Orders"
                              : "Past Orders & History"}
                        </h2>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {activeTab === "delivered"
                            ? "Your completed QuickBite orders."
                            : activeTab === "cancelled"
                              ? "Orders that were cancelled."
                              : "Past completed orders and previous restaurant experiences."}
                        </p>
                      </div>

                      {activeTab === "all" && (
                        <button
                          type="button"
                          onClick={handleClearHistory}
                          className="self-start text-[10px] font-semibold text-brand-500 transition hover:text-brand-600 hover:underline sm:self-auto"
                        >
                          Clear All Past History
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {paginatedPastOrders.map((order) => (
                        <div
                          key={order._id}
                          className={
                            reorderingId === order._id
                              ? "pointer-events-none opacity-60"
                              : ""
                          }
                        >
                          <PastOrderCard
                            order={order}
                            onView={handleViewOrder}
                            onReceipt={handleViewReceipt}
                            onReorder={handleReorder}
                            onReview={openReviewModal}
                          />
                        </div>
                      ))}
                    </div>

                    {/* =================================================
                        PAGINATION
                    ================================================== */}

                    <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-slate-400">
                        Showing{" "}
                        {pastOrders.length === 0
                          ? 0
                          : (currentPage - 1) * ORDERS_PER_PAGE + 1}
                        -
                        {Math.min(
                          currentPage * ORDERS_PER_PAGE,
                          pastOrders.length,
                        )}{" "}
                        of {pastOrders.length} orders
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {Array.from(
                          {
                            length: totalPages,
                          },
                          (_, index) => index + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-bold transition ${
                              currentPage === page
                                ? "bg-brand-500 text-white shadow-sm"
                                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1),
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </section>
                )}

              {/* =================================================
                  ALL TAB EMPTY
              ================================================== */}

              {filteredOrders.length === 0 && (
                <section className="mt-9">
                  <EmptyOrders tab={activeTab} />
                </section>
              )}

              {/* =================================================
                  SEARCH NO RESULT
              ================================================== */}

              {orders.length > 0 && filteredOrders.length === 0 && (
                <section className="mt-9">
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Search size={23} />
                    </div>

                    <h3 className="mt-4 text-base font-extrabold text-slate-900">
                      No matching orders
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                      Try another restaurant name or order number.
                    </p>

                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white"
                    >
                      Clear Search
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* =====================================================
          RECEIPT MODAL
      ====================================================== */}

      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* =====================================================
          ORDER DETAILS MODAL
      ====================================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={(order) => {
            setSelectedOrder(null);
            openCancelModal(order);
          }}
          onReorder={handleReorder}
          onReview={(order) => {
            setSelectedOrder(null);
            openReviewModal(order);
          }}
        />
      )}

      {/* =====================================================
          CANCEL MODAL
      ====================================================== */}

      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          reason={cancelReason}
          setReason={setCancelReason}
          loading={cancelling}
          onClose={closeCancelModal}
          onConfirm={handleCancelOrder}
        />
      )}

      {/* =====================================================
          REVIEW MODAL
      ====================================================== */}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          rating={reviewRating}
          setRating={setReviewRating}
          comment={reviewComment}
          setComment={setReviewComment}
          loading={submittingReview}
          onClose={closeReviewModal}
          onSubmit={handleSubmitReview}
        />
      )}
    </PageShell>
  );
};

export default MyOrders;
