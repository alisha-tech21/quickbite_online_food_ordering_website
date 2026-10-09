import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  CreditCard,
  Smartphone,
  WalletCards,
  MapPin,
  Phone,
  UserRound,
  Store,
  PackageCheck,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import toast from "react-hot-toast";

import { useAuth } from "../../hooks/useAuth";
import axiosClient from "../../api/axiosClient";
import AdminLayout from "../../components/adminLayout/AdminLayout";

const PAGE_SIZE = 5;

// ============================================================
// STATUS
// ============================================================

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "preparing", label: "In Kitchen" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Completed" },
];

const STATUS_LABELS = {
  confirmed: "Confirmed",
  preparing: "Cooking",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_CLASSES = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-100",
  preparing: "bg-orange-50 text-orange-700 border-orange-100",
  out_for_delivery: "bg-indigo-50 text-indigo-700 border-indigo-100",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

// ============================================================
// PAYMENT CONFIG
// ============================================================

const PAYMENT_CONFIG = {
  jazzcash: {
    label: "JazzCash",
    icon: Smartphone,
    iconClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    barClass: "bg-emerald-500",
  },

  easypaisa: {
    label: "EasyPaisa",
    icon: Smartphone,
    iconClass: "text-sky-600",
    bgClass: "bg-sky-50",
    barClass: "bg-sky-500",
  },

  cod: {
    label: "Cash on Delivery",
    icon: WalletCards,
    iconClass: "text-amber-600",
    bgClass: "bg-amber-50",
    barClass: "bg-amber-500",
  },

  card: {
    label: "Card",
    icon: CreditCard,
    iconClass: "text-violet-600",
    bgClass: "bg-violet-50",
    barClass: "bg-violet-500",
  },
};

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return `Rs. ${number.toLocaleString("en-PK")}`;
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-PK");
};

const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatTime = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleTimeString("en-PK", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const getCustomerName = (order) => {
  return order?.customer?.fullName || "Unknown Customer";
};

const getOrderItemsText = (order) => {
  if (!order?.items?.length) return "No items";

  const first = order.items[0];

  const firstText = `${first?.name || "Item"} × ${first?.quantity || 1}`;

  if (order.items.length === 1) {
    return firstText;
  }

  return `${firstText} + ${order.items.length - 1} more`;
};

const getTotalItemCount = (order) => {
  if (!order?.items?.length) return 0;

  return order.items.reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0,
  );
};

const getStatusClass = (status) => {
  return (
    STATUS_CLASSES[status] || "bg-slate-50 text-slate-600 border-slate-100"
  );
};

const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status || "Unknown";
};

// ============================================================
// SMALL COMPONENTS
// ============================================================

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold ${getStatusClass(
        status,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {getStatusLabel(status)}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  valueClass = "text-slate-950",
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-5 py-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p
            className={`mt-2 text-2xl font-extrabold leading-none tracking-tight ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ORDER DETAILS MODAL
// ============================================================

const OrderDetailsModal = ({ order, onClose, onUpdated, canUpdateStatus }) => {
  const [status, setStatus] = useState(order?.status || "confirmed");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(order?.status || "confirmed");
    setNote("");
  }, [order]);

  if (!order) return null;

  const options = [
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  const handleUpdate = async () => {
    if (!order?._id) return;

    if (status === order.status && !note.trim()) {
      toast("No changes to save.");
      return;
    }

    try {
      setSaving(true);

      const response = await axiosClient.patch(
        `/admin/orders/${order._id}/status`,
        {
          status,
          note: note.trim() || undefined,
        },
      );

      toast.success("Order updated successfully");

      onUpdated?.(response?.data?.order || response?.data);

      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update order status.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]">
      <div className="absolute inset-0" onClick={() => !saving && onClose()} />

      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <ClipboardList size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Order Details
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                #{order.orderNumber || order._id?.slice(-6)}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-92px)] overflow-y-auto p-7">
          {/* STATUS */}
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                CURRENT STATUS
              </p>

              <div className="mt-3">
                <StatusBadge status={order.status} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-400">Placed</p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatDate(order.createdAt)}
              </p>

              <p className="text-xs text-slate-500">
                {formatTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* CUSTOMER + RESTAURANT */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <UserRound size={18} />
                </div>

                <p className="text-base font-bold text-slate-800">Customer</p>
              </div>

              <p className="text-base font-bold text-slate-900">
                {getCustomerName(order)}
              </p>

              {order.customer?.phone && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone size={14} />
                  {order.customer.phone}
                </p>
              )}

              {order.customer?.email && (
                <p className="mt-1 break-all text-xs text-slate-400">
                  {order.customer.email}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Store size={18} />
                </div>

                <p className="text-base font-bold text-slate-800">Restaurant</p>
              </div>

              <p className="text-base font-bold text-slate-900">
                {order.restaurant?.name || "QuickBite Restaurant"}
              </p>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mt-5 rounded-2xl border border-slate-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-slate-800">
                Items Ordered
              </p>

              <span className="text-sm font-semibold text-slate-400">
                {getTotalItemCount(order)} items
              </span>
            </div>

            <div className="space-y-2.5">
              {(order.items || []).map((item, index) => (
                <div
                  key={`${item._id || item.menuItem || item.name}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3.5"
                >
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.name || "Menu Item"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Qty: {item.quantity || 1}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-bold text-slate-800">
                    {formatCurrency(
                      Number(item.unitPrice || item.price || 0) *
                        Number(item.quantity || 0),
                    )}
                  </p>
                </div>
              ))}

              {!order.items?.length && (
                <p className="text-sm text-slate-500">
                  No item details available.
                </p>
              )}
            </div>
          </div>

          {/* ADDRESS + PAYMENT */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <MapPin size={17} className="text-orange-500" />

                <p className="text-base font-bold text-slate-800">
                  Delivery Address
                </p>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {order.deliveryAddress?.line1 ||
                  order.deliveryAddress?.area ||
                  "Address not available"}
              </p>

              {order.deliveryAddress?.city && (
                <p className="mt-1 text-xs text-slate-400">
                  {order.deliveryAddress.city}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <CreditCard size={17} className="text-emerald-600" />

                <p className="text-base font-bold text-slate-800">Payment</p>
              </div>

              <p className="text-sm font-semibold capitalize text-slate-700">
                {order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : order.paymentMethod || "Payment"}
              </p>

              <p className="mt-1.5 text-xs text-slate-500">
                Payment status: {order.paymentStatus || "pending"}
              </p>
            </div>
          </div>

          {/* AMOUNT */}
          <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">
                Subtotal
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {formatCurrency(order.itemsSubtotal)}
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-sm text-slate-500">Delivery</span>

              <span className="text-sm text-slate-700">
                {formatCurrency(order.deliveryFee)}
              </span>
            </div>

            {Number(order.voucherDiscount || 0) > 0 && (
              <div className="mt-2.5 flex items-center justify-between text-emerald-600">
                <span className="text-sm">Voucher Discount</span>

                <span className="text-sm font-semibold">
                  -{formatCurrency(order.voucherDiscount)}
                </span>
              </div>
            )}

            <div className="my-4 border-t border-orange-100" />

            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">
                Total Amount
              </span>

              <span className="text-xl font-extrabold text-orange-500">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* STATUS UPDATE */}
          {canUpdateStatus && (
            <div className="mt-6 rounded-2xl border border-slate-100 p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <PackageCheck size={18} className="text-orange-500" />

                <p className="text-base font-bold text-slate-800">
                  Update Order
                </p>
              </div>

              <label className="mb-2 block text-xs font-semibold text-slate-500">
                STATUS
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {getStatusLabel(option)}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-4 block text-xs font-semibold text-slate-500">
                NOTE
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional update note..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />

              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff6247] text-sm font-bold text-white transition hover:bg-[#ed5138] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    Update Order
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN DASHBOARD
// ============================================================

const Dashboard = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);

  const [stats, setStats] = useState({
    totalOrders: 0,
    inKitchen: 0,
    outForDelivery: 0,
    delivered: 0,
    deliveredToday: 0,
    cancelled: 0,
    revenue: 0,
    averageOrderValue: 0,
    paymentStats: [],
    chart: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activePeriod, setActivePeriod] = useState("today");

  const [currentPage, setCurrentPage] = useState(1);
  const [serverPages, setServerPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null);

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadDashboard = async ({
    showLoader = false,
    page = currentPage,
    status = activeStatus,
    search = searchTerm,
    period = activePeriod,
  } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = {
        page,
        limit: PAGE_SIZE,
        range: period,
      };

      if (status !== "all") {
        params.status = status;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axiosClient.get("/admin/orders", {
        params,
      });

      const data = response?.data || {};

      setOrders(Array.isArray(data.orders) ? data.orders : []);

      setStats({
        totalOrders: Number(data.stats?.totalOrders || 0),
        inKitchen: Number(data.stats?.inKitchen || 0),
        outForDelivery: Number(data.stats?.outForDelivery || 0),
        delivered: Number(data.stats?.delivered || 0),
        deliveredToday: Number(
          data.stats?.deliveredToday ?? data.stats?.delivered ?? 0,
        ),
        cancelled: Number(data.stats?.cancelled || 0),
        revenue: Number(data.stats?.revenue ?? data.stats?.totalRevenue ?? 0),
        averageOrderValue: Number(data.stats?.averageOrderValue || 0),
        paymentStats: Array.isArray(data.stats?.paymentStats)
          ? data.stats.paymentStats
          : [],
        chart: Array.isArray(data.stats?.chart) ? data.stats.chart : [],
      });

      setTotalRecords(Number(data.total || 0));

      setServerPages(Math.max(1, Number(data.pages || 1)));
    } catch (error) {
      console.error("Dashboard load error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // SEARCH / FILTER / PERIOD / PAGINATION
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard({
        showLoader: currentPage === 1 && !orders.length,
        page: currentPage,
        status: activeStatus,
        search: searchTerm,
        period: activePeriod,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, activeStatus, activePeriod, currentPage]);

  // ============================================================
  // PERIOD CHANGE
  // ============================================================

  const handlePeriodChange = (period) => {
    if (period === activePeriod) return;

    setActivePeriod(period);
    setCurrentPage(1);
  };

  // ============================================================
  // STATUS CHANGE
  // ============================================================

  const handleStatusChange = (status) => {
    if (status === activeStatus) return;

    setActiveStatus(status);
    setCurrentPage(1);
  };

  // ============================================================
  // PAGE CHANGE
  // ============================================================

  const changePage = (page) => {
    if (page < 1 || page > serverPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    loadDashboard({
      showLoader: false,
      page: currentPage,
      status: activeStatus,
      search: searchTerm,
      period: activePeriod,
    });
  };

  // ============================================================
  // ORDER UPDATED
  // ============================================================

  const handleOrderUpdated = (updatedOrder) => {
    if (!updatedOrder?._id) return;

    setOrders((current) =>
      current.map((order) =>
        String(order._id) === String(updatedOrder._id)
          ? {
              ...order,
              ...updatedOrder,
            }
          : order,
      ),
    );

    loadDashboard({
      showLoader: false,
      page: currentPage,
      status: activeStatus,
      search: searchTerm,
      period: activePeriod,
    });
  };

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const visibleOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }, [orders]);

  const revenue = useMemo(() => {
    if (Number(stats.revenue) > 0) {
      return Number(stats.revenue);
    }

    return orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );
  }, [stats.revenue, orders]);

  const averageOrderValue = useMemo(() => {
    if (Number(stats.averageOrderValue) > 0) {
      return Number(stats.averageOrderValue);
    }

    if (stats.totalOrders > 0) {
      return revenue / stats.totalOrders;
    }

    return 0;
  }, [stats.averageOrderValue, stats.totalOrders, revenue]);

  // ============================================================
  // PAYMENT STATS
  // ============================================================

  const paymentStats = useMemo(() => {
    if (stats.paymentStats?.length) {
      const totalAmount = stats.paymentStats.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

      return stats.paymentStats
        .map((item) => ({
          method: String(item._id || item.method || "").toLowerCase(),
          amount: Number(item.amount || 0),
          percentage:
            Number(item.percentage) ||
            (totalAmount > 0
              ? Math.round((Number(item.amount || 0) / totalAmount) * 100)
              : 0),
        }))
        .filter((item) => item.method);
    }

    const result = {
      jazzcash: 0,
      easypaisa: 0,
      cod: 0,
      card: 0,
    };

    orders.forEach((order) => {
      const method = String(order.paymentMethod || "cod").toLowerCase();

      if (result[method] !== undefined) {
        result[method] += Number(order.totalAmount || 0);
      }
    });

    const total = Object.values(result).reduce((sum, value) => sum + value, 0);

    return Object.entries(result)
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [stats.paymentStats, orders]);

  // ============================================================
  // CHART
  // ============================================================

  const chartData = useMemo(() => {
    // ----------------------------------------------------------
    // TODAY
    // ----------------------------------------------------------

    if (activePeriod === "today") {
      const values = Array.from({ length: 12 }, () => 0);

      stats.chart.forEach((item) => {
        const hour = Number(item?._id);

        if (hour >= 11 && hour <= 22) {
          values[hour - 11] = Number(item.orders || 0);
        }
      });

      return {
        labels: [
          "11 AM",
          "12 PM",
          "1 PM",
          "2 PM",
          "3 PM",
          "4 PM",
          "5 PM",
          "6 PM",
          "7 PM",
          "8 PM",
          "9 PM",
          "10 PM",
        ],
        values,
      };
    }

    // ----------------------------------------------------------
    // WEEK
    // ----------------------------------------------------------

    if (activePeriod === "week") {
      const monday = new Date();

      monday.setHours(0, 0, 0, 0);

      const day = monday.getDay();
      const diff = day === 0 ? 6 : day - 1;

      monday.setDate(monday.getDate() - diff);

      const labels = [];
      const values = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);

        date.setDate(monday.getDate() + i);

        const key = date.toISOString().slice(0, 10);

        const found = stats.chart.find((item) => String(item?._id) === key);

        labels.push(
          date.toLocaleDateString("en-PK", {
            weekday: "short",
          }),
        );

        values.push(Number(found?.orders || 0));
      }

      return {
        labels,
        values,
      };
    }

    // ----------------------------------------------------------
    // MONTH
    // ----------------------------------------------------------
    if (activePeriod === "month") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const labels = [];
      const values = [];

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const key =
          date.getFullYear() +
          "-" +
          String(date.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(date.getDate()).padStart(2, "0");

        const found = stats.chart.find((item) => String(item?._id) === key);

        labels.push(
          date.toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
          }),
        );

        values.push(Number(found?.orders || 0));
      }

      return {
        labels,
        values,
      };
    }

    // ----------------------------------------------------------
    // ALL TIME
    // ----------------------------------------------------------

    const allLabels = stats.chart.map((item) => String(item?._id));
    const allValues = stats.chart.map((item) => Number(item?.orders || 0));

    return {
      labels: allLabels,
      values: allValues,
    };
  }, [stats.chart, activePeriod]);

  const maxChartValue = Math.max(
    1,
    ...(chartData.values.length ? chartData.values : [0]),
  );

  // ============================================================
  // PAGINATION
  // ============================================================

  const pageStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);

  // ============================================================
  // ADMIN
  // ============================================================

  const canUpdateStatus = ["admin", "branch_manager", "kitchen_staff"].includes(
    user?.role,
  );

  // ============================================================
  // PERIOD LABEL
  // ============================================================
  const periodLabel =
    activePeriod === "today"
      ? "Today"
      : activePeriod === "week"
        ? "This Week"
        : activePeriod === "month"
          ? "This Month"
          : "All Time";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AdminLayout
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      activePeriod={activePeriod}
      onPeriodChange={handlePeriodChange}
    >
      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="w-full px-4 py-6 sm:px-6 lg:px-7 xl:px-8 2xl:px-9">
        {/* HEADING */}
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6247]">
              <span className="h-2 w-2 rounded-full bg-[#ff6247]" />
              {periodLabel} Overview
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl lg:text-[36px]">
              Dashboard Overview
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-500">
              Monitor platform performance, order activity, revenue, payments,
              and live kitchen operations.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-slate-400 shadow-sm sm:flex">
            <Clock3 size={15} />
            Live dashboard
          </div>
        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(revenue)}
            subtitle={`Revenue for ${periodLabel.toLowerCase()}`}
            icon={CircleDollarSign}
            iconClass="bg-orange-50 text-orange-500"
          />

          <StatCard
            title="Total Orders"
            value={formatNumber(stats.totalOrders)}
            subtitle={`${formatNumber(stats.inKitchen)} currently in kitchen`}
            icon={ClipboardList}
            iconClass="bg-red-50 text-red-500"
          />

          <StatCard
            title="Completed Deliveries"
            value={formatNumber(stats.delivered)}
            subtitle={`Delivered ${periodLabel.toLowerCase()}`}
            icon={CheckCircle2}
            iconClass="bg-emerald-100 text-emerald-600"
          />

          <StatCard
            title="Average Order Value"
            value={formatCurrency(averageOrderValue)}
            subtitle={`Average for ${periodLabel.toLowerCase()}`}
            icon={TrendingUp}
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>

        {/* =================================================
            CHART + RIGHT CARDS
        ================================================= */}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.8fr)]">
          {/* CHART */}
          {/* Order & Sales Trend */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Order & Sales Trend
                    </h2>

                    <span className="rounded-full bg-[#fff1ed] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff6247]">
                      {periodLabel}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {activePeriod === "today"
                      ? "Hourly order activity for today"
                      : activePeriod === "week"
                        ? "Daily order activity for this week"
                        : activePeriod === "month"
                          ? "Daily order activity for the last 30 days"
                          : "Order activity across all available records"}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Total Orders
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">
                      {formatNumber(
                        chartData.values.reduce(
                          (sum, value) => sum + Number(value || 0),
                          0,
                        ),
                      )}
                    </p>
                  </div>

                  <div className="hidden h-9 w-px bg-slate-200 sm:block" />

                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Peak
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-[#ff6247]">
                      {formatNumber(maxChartValue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 h-[300px] w-full px-4 pb-2 sm:px-6">
              {chartData.values.some((value) => Number(value) > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.labels.map((label, index) => ({
                      label,
                      orders: Number(chartData.values[index] || 0),
                    }))}
                    margin={{
                      top: 18,
                      right: 8,
                      left: -20,
                      bottom: 4,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="quickBiteOrderGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ff6247"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#ff6247"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="#eef2f7"
                      strokeDasharray="3 5"
                    />

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={
                        activePeriod === "today"
                          ? 0
                          : activePeriod === "week"
                            ? 0
                            : activePeriod === "month"
                              ? 4
                              : Math.max(
                                  0,
                                  Math.ceil(chartData.labels.length / 6) - 1,
                                )
                      }
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                      dy={10}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={38}
                      tick={{
                        fill: "#94a3b8",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    />

                    <Tooltip
                      cursor={{
                        stroke: "#cbd5e1",
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
                        padding: "10px 12px",
                      }}
                      labelStyle={{
                        color: "#64748b",
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                      itemStyle={{
                        color: "#ff6247",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                      formatter={(value) => [`${value} orders`, "Orders"]}
                    />

                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#ff6247"
                      strokeWidth={3}
                      fill="url(#quickBiteOrderGradient)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        strokeWidth: 3,
                        stroke: "#ffffff",
                        fill: "#ff6247",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-50">
                      <ClipboardList className="h-5 w-5 text-slate-400" />
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      No orders for this period
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Order activity will appear here once orders are available.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 border-t border-slate-100">
              <div className="px-4 py-4 text-center sm:px-6">
                <p className="text-xs font-medium text-slate-400">Orders</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatNumber(stats.totalOrders)}
                </p>
              </div>

              <div className="border-x border-slate-100 px-4 py-4 text-center sm:px-6">
                <p className="text-xs font-medium text-slate-400">In Kitchen</p>
                <p className="mt-1 text-xl font-semibold text-orange-600">
                  {formatNumber(stats.inKitchen)}
                </p>
              </div>

              <div className="px-4 py-4 text-center sm:px-6">
                <p className="text-xs font-medium text-slate-400">
                  On The Road
                </p>
                <p className="mt-1 text-xl font-semibold text-indigo-600">
                  {formatNumber(stats.outForDelivery)}
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <div className="space-y-4">
            {/* PAYMENT CHANNELS */}
            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Payment Channels
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Revenue by payment method
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                  {periodLabel}
                </span>
              </div>

              <div className="mt-6 space-y-6">
                {paymentStats.length ? (
                  paymentStats.map(({ method, amount, percentage }) => {
                    const config = PAYMENT_CONFIG[method] || {
                      label: method,
                      icon: CreditCard,
                      iconClass: "text-slate-600",
                      bgClass: "bg-slate-100",
                      barClass: "bg-slate-500",
                    };

                    const Icon = config.icon;

                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bgClass}`}
                            >
                              <Icon size={18} className={config.iconClass} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-bold text-slate-700">
                                  {config.label}
                                </span>

                                <span className="text-xs font-bold text-slate-400">
                                  {percentage}%
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                Payment channel
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 text-sm font-extrabold text-slate-800">
                            {formatCurrency(amount)}
                          </span>
                        </div>

                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${config.barClass}`}
                            style={{
                              width: `${Math.max(3, percentage)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <CreditCard size={30} className="mx-auto text-slate-300" />

                    <p className="mt-3 text-sm text-slate-400">
                      No payment data available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* KITCHEN */}
            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Kitchen Operations
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Current order workflow
                  </p>
                </div>

                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Normal Load
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-orange-50 px-2 py-5 text-center">
                  <p className="text-xs text-slate-500">Preparing</p>

                  <p className="mt-2 text-2xl font-extrabold text-orange-600">
                    {formatNumber(stats.inKitchen)}
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 px-2 py-5 text-center">
                  <p className="text-xs text-slate-500">On Road</p>

                  <p className="mt-2 text-2xl font-extrabold text-indigo-600">
                    {formatNumber(stats.outForDelivery)}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 px-2 py-5 text-center">
                  <p className="text-xs text-slate-500">Completed</p>

                  <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                    {formatNumber(stats.delivered)}
                  </p>
                </div>
              </div>

              {stats.cancelled > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-500" />

                    <span className="text-xs font-semibold text-red-600">
                      Cancelled Orders
                    </span>
                  </div>

                  <span className="text-sm font-extrabold text-red-600">
                    {formatNumber(stats.cancelled)}
                  </span>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <section className="mt-5 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Order Records
              </h2>

              <p className="mt-1.5 text-sm text-slate-400">
                {periodLabel} orders across delivery operations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleStatusChange(option.id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeStatus === option.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-[#ff6247]"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Loading dashboard data...
                </p>
              </div>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <ClipboardList size={27} />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No orders found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Try changing the date range, status filter, or search term.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead>
                    <tr className="bg-[#f3f4fb] text-left">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Order ID
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Restaurant
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Items Ordered
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4 align-middle">
                          <p className="text-sm font-bold text-slate-800">
                            #{order.orderNumber || order._id?.slice(-6)}
                          </p>

                          <p className="mt-1.5 text-xs text-slate-400">
                            {formatDate(order.createdAt)}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {formatTime(order.createdAt)}
                          </p>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="text-sm font-semibold text-slate-800">
                            {getCustomerName(order)}
                          </p>

                          <p className="mt-1.5 text-xs text-slate-400">
                            {order.customer?.phone || "Phone unavailable"}
                          </p>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center gap-2">
                            <Store size={15} className="text-orange-500" />

                            <p className="text-sm font-semibold text-slate-700">
                              {order.restaurant?.name || "QuickBite"}
                            </p>
                          </div>
                        </td>

                        <td className="max-w-[300px] px-6 py-5 align-middle">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {getOrderItemsText(order)}
                          </p>

                          {order.items?.length > 1 && (
                            <p className="mt-1.5 text-xs text-slate-400">
                              {order.items.length} line items
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="text-sm font-extrabold text-slate-800">
                            {formatCurrency(order.totalAmount)}
                          </p>

                          <p className="mt-1 text-xs capitalize text-slate-400">
                            {order.paymentMethod === "cod"
                              ? "Cash"
                              : order.paymentMethod || "Payment"}
                          </p>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}
              <div className="space-y-3 p-5 md:hidden">
                {visibleOrders.map((order) => (
                  <button
                    key={order._id}
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="block w-full rounded-2xl border border-slate-100 bg-white p-5 text-left transition hover:border-orange-100 hover:bg-orange-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          #{order.orderNumber || order._id?.slice(-6)}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {getCustomerName(order)}
                        </p>
                      </div>

                      <StatusBadge status={order.status} />
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {getOrderItemsText(order)}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <p className="shrink-0 text-base font-extrabold text-[#ff6247]">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Showing{" "}
                  <span className="font-bold text-slate-600">{pageStart}</span>–
                  <span className="font-bold text-slate-600">{pageEnd}</span> of{" "}
                  <span className="font-bold text-slate-600">
                    {totalRecords}
                  </span>{" "}
                  records
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage <= 1 || refreshing}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  {Array.from(
                    {
                      length: Math.min(5, serverPages),
                    },
                    (_, index) => {
                      let pageNumber;

                      if (serverPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= serverPages - 2) {
                        pageNumber = serverPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => changePage(pageNumber)}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold ${
                            currentPage === pageNumber
                              ? "bg-[#ff6247] text-white"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    },
                  )}

                  <button
                    type="button"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage >= serverPages || refreshing}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* FOOTER */}
        <div className="py-8 text-center text-xs text-slate-400">
          QuickBite Admin Portal • Live Operations
        </div>
      </div>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={handleOrderUpdated}
          canUpdateStatus={canUpdateStatus}
        />
      )}
    </AdminLayout>
  );
};

export default Dashboard;
