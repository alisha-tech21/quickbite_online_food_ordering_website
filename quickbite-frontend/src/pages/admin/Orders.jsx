import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserRound,
  Store,
  MapPin,
  CreditCard,
  Package,
  Phone,
  Mail,
  Truck,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminLayout from "../../components/adminLayout/AdminLayout";
import {
  getAdminOrdersApi,
  updateAdminOrderStatusApi,
} from "../../api/orderApi";

// =========================================================
// HELPERS
// =========================================================

const formatCurrency = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusConfig = (status) => {
  const configs = {
    confirmed: {
      label: "Confirmed",
      className: "bg-blue-50 text-blue-700 border-blue-100",
      dot: "bg-blue-500",
      icon: CheckCircle2,
    },

    preparing: {
      label: "Preparing",
      className: "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-500",
      icon: ChefHat,
    },

    out_for_delivery: {
      label: "Out for Delivery",
      className: "bg-purple-50 text-purple-700 border-purple-100",
      dot: "bg-purple-500",
      icon: Bike,
    },

    delivered: {
      label: "Delivered",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },

    cancelled: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border-red-100",
      dot: "bg-red-500",
      icon: XCircle,
    },
  };

  return (
    configs[status] || {
      label: formatStatus(status),
      className: "bg-slate-50 text-slate-700 border-slate-100",
      dot: "bg-slate-400",
      icon: Clock3,
    }
  );
};

const getPaymentLabel = (method) => {
  const methods = {
    cod: "Cash on Delivery",
    jazzcash: "JazzCash",
    easypaisa: "EasyPaisa",
    card: "Card",
  };

  return methods[method] || formatStatus(method);
};

const getPaymentStatusClass = (status) => {
  const classes = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
    refunded: "bg-slate-100 text-slate-700",
  };

  return classes[status] || "bg-slate-100 text-slate-700";
};

// =========================================================
// STATUS BADGE
// =========================================================

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon size={13} strokeWidth={2.2} />
      {config.label}
    </span>
  );
};

// =========================================================
// SUMMARY CARD
// =========================================================

const SummaryCard = ({ title, value, description, icon: Icon, iconClass }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ORDERS PAGE
// =========================================================

const Orders = () => {
  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [range, setRange] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [statusUpdating, setStatusUpdating] = useState(false);

  const limit = 10;

  // -------------------------------------------------------
  // LOAD ORDERS
  // -------------------------------------------------------

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getAdminOrdersApi({
          page,
          limit,
          range,
          status: statusFilter,
          search,
        });

        setOrders(response.orders || []);
        setStats(response.stats || null);
        setPages(Math.max(1, Number(response.pages || 1)));
      } catch (err) {
        console.error("Admin orders error:", err);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load orders.";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, range, statusFilter, search],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // -------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // -------------------------------------------------------
  // FILTER
  // -------------------------------------------------------

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleRangeChange = (value) => {
    setRange(value);
    setPage(1);
  };

  // -------------------------------------------------------
  // UPDATE STATUS
  // -------------------------------------------------------

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedOrder?._id) return;

    if (newStatus === selectedOrder.status) return;

    try {
      setStatusUpdating(true);

      const response = await updateAdminOrderStatusApi(selectedOrder._id, {
        status: newStatus,
      });

      const updatedOrder = response.order;

      setSelectedOrder(updatedOrder);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order,
        ),
      );

      toast.success("Order status updated successfully.");
    } catch (err) {
      console.error("Status update error:", err);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update order status.",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  // -------------------------------------------------------
  // AVAILABLE NEXT STATUS
  // -------------------------------------------------------

  const availableStatuses = useMemo(() => {
    if (!selectedOrder) return [];

    const transitions = {
      confirmed: [
        {
          value: "preparing",
          label: "Start Preparing",
        },
        {
          value: "out_for_delivery",
          label: "Mark Out for Delivery",
        },
        {
          value: "cancelled",
          label: "Cancel Order",
        },
      ],

      preparing: [
        {
          value: "out_for_delivery",
          label: "Mark Out for Delivery",
        },
        {
          value: "cancelled",
          label: "Cancel Order",
        },
      ],

      out_for_delivery: [
        {
          value: "delivered",
          label: "Mark Delivered",
        },
      ],

      delivered: [],

      cancelled: [],
    };

    return transitions[selectedOrder.status] || [];
  }, [selectedOrder]);

  // -------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------

  const summary = stats || {
    totalOrders: 0,
    inKitchen: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    averageOrderValue: 0,
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <AdminLayout>
      <div className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          {/* ================================================= */}
          {/* PAGE HEADER */}
          {/* ================================================= */}

          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-[#ff6247]">
                Order Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Orders
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View, monitor and manage customer orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders({ silent: true })}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* ================================================= */}
          {/* RANGE TABS */}
          {/* ================================================= */}

          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
            {[
              { value: "all", label: "All" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
            ].map((item) => {
              const active = range === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setRange(item.value);
                    setPage(1);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-[#ff6247] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* ================================================= */}
          {/* SUMMARY CARDS */}
          {/* ================================================= */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="Total Orders"
              value={summary.totalOrders}
              description="Orders in selected period"
              icon={Package}
              iconClass="bg-orange-50 text-[#ff6247]"
            />

            <SummaryCard
              title="In Kitchen"
              value={summary.inKitchen}
              description="Confirmed + preparing"
              icon={ChefHat}
              iconClass="bg-amber-50 text-amber-600"
            />

            <SummaryCard
              title="On the Road"
              value={summary.outForDelivery}
              description="Currently delivering"
              icon={Truck}
              iconClass="bg-purple-50 text-purple-600"
            />

            <SummaryCard
              title="Delivered"
              value={summary.delivered}
              description="Successfully completed"
              icon={CheckCircle2}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <SummaryCard
              title="Revenue"
              value={formatCurrency(summary.revenue)}
              description={`Avg. order ${formatCurrency(
                summary.averageOrderValue,
              )}`}
              icon={CreditCard}
              iconClass="bg-blue-50 text-blue-600"
            />
          </div>

          {/* ================================================= */}
          {/* FILTER BAR */}
          {/* ================================================= */}

          <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search order number..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#ff6247] focus:bg-white focus:ring-2 focus:ring-[#ff6247]/10"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-[#ff6247] focus:ring-2 focus:ring-[#ff6247]/10 xl:w-[190px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {search && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>Showing results for:</span>

                <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                  {search}
                </span>

                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="font-semibold text-[#ff6247] hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && !loading && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load orders
                </p>

                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => loadOrders()}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ================================================= */}
          {/* TABLE */}
          {/* ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Order Records
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  {orders.length} order
                  {orders.length === 1 ? "" : "s"} on this page
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CalendarDays size={14} />
                {range === "today"
                  ? "Today"
                  : range === "week"
                    ? "This week"
                    : "This month"}
              </div>
            </div>

            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package size={25} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No orders found
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                  There are no orders matching the selected filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Order
                        </th>

                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Customer
                        </th>

                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Restaurant
                        </th>

                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Items
                        </th>

                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Total
                        </th>

                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Payment
                        </th>

                        <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {order.orderNumber}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock3 size={12} />
                                {formatDate(order.createdAt)}
                                <span>•</span>
                                {formatTime(order.createdAt)}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[180px]">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {order.customer?.fullName || "Unknown Customer"}
                              </p>

                              {order.customer?.phone && (
                                <p className="mt-1 truncate text-xs text-slate-400">
                                  {order.customer.phone}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex max-w-[180px] items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff6247]">
                                <Store size={15} />
                              </div>

                              <p className="truncate text-sm font-medium text-slate-700">
                                {order.restaurant?.name || "Restaurant"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {order.items?.length || 0} item
                                {order.items?.length === 1 ? "" : "s"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                                {order.items
                                  ?.map(
                                    (item) => `${item.name} × ${item.quantity}`,
                                  )
                                  .join(", ") || "-"}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-medium capitalize text-slate-700">
                                {getPaymentLabel(order.paymentMethod)}
                              </p>

                              <span
                                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getPaymentStatusClass(
                                  order.paymentStatus,
                                )}`}
                              >
                                {order.paymentStatus || "pending"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#ff6247]/30 hover:bg-orange-50 hover:text-[#ff6247]"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    Page{" "}
                    <span className="font-semibold text-slate-700">{page}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {pages}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <button
                      type="button"
                      disabled={page >= pages}
                      onClick={() =>
                        setPage((current) => Math.min(pages, current + 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* =================================================== */}
      {/* ORDER DETAILS MODAL */}
      {/* =================================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedOrder.orderNumber}
                  </h2>

                  <StatusBadge status={selectedOrder.status} />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Placed on {formatDate(selectedOrder.createdAt)} at{" "}
                  {formatTime(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* LEFT / MAIN */}

                <div className="space-y-5 lg:col-span-2">
                  {/* CUSTOMER */}

                  <section className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Customer
                        </h3>

                        <p className="text-xs text-slate-400">
                          Customer information
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Name
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {selectedOrder.customer?.fullName ||
                            "Unknown Customer"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Phone
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          <Phone size={14} />
                          {selectedOrder.customer?.phone || "-"}
                        </p>
                      </div>

                      {selectedOrder.customer?.email && (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Email
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                            <Mail size={14} />
                            {selectedOrder.customer.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* RESTAURANT */}

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#ff6247]">
                        <Store size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Restaurant
                        </h3>

                        <p className="text-xs text-slate-400">Order source</p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      {selectedOrder.restaurant?.name || "Restaurant"}
                    </p>
                  </section>

                  {/* ITEMS */}

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Package size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Order Items
                        </h3>

                        <p className="text-xs text-slate-400">
                          {selectedOrder.items?.length || 0} items
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(selectedOrder.items || []).map((item, index) => (
                        <div
                          key={`${item.menuItem || item.name}-${index}`}
                          className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {item.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatCurrency(item.unitPrice)} × {item.quantity}
                            </p>

                            {item.notes && (
                              <p className="mt-1 text-xs italic text-slate-400">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>

                          <p className="shrink-0 text-sm font-bold text-slate-900">
                            {formatCurrency(
                              Number(item.unitPrice || 0) *
                                Number(item.quantity || 0),
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* DELIVERY ADDRESS */}

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <MapPin size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Delivery Address
                        </h3>

                        <p className="text-xs text-slate-400">
                          Customer delivery details
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      {selectedOrder.deliveryAddress?.label || "Delivery"}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {selectedOrder.deliveryAddress?.line1 || "-"}
                    </p>

                    {(selectedOrder.deliveryAddress?.area ||
                      selectedOrder.deliveryAddress?.city) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {[
                          selectedOrder.deliveryAddress?.area,
                          selectedOrder.deliveryAddress?.city,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {selectedOrder.deliveryAddress?.instructions && (
                      <div className="mt-3 rounded-xl bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-700">
                          Delivery Instructions
                        </p>

                        <p className="mt-1 text-xs text-amber-700/80">
                          {selectedOrder.deliveryAddress.instructions}
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                {/* RIGHT / SIDEBAR */}

                <div className="space-y-5">
                  {/* STATUS CONTROL */}

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Manage Order
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Update the order workflow status.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {availableStatuses.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                          This order has reached its final status.
                        </div>
                      ) : (
                        availableStatuses.map((item) => {
                          const isCancel = item.value === "cancelled";

                          return (
                            <button
                              key={item.value}
                              type="button"
                              disabled={statusUpdating}
                              onClick={() => handleStatusUpdate(item.value)}
                              className={`flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                isCancel
                                  ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-[#ff6247] text-white hover:bg-[#e9553d]"
                              }`}
                            >
                              {statusUpdating ? (
                                <RefreshCw size={15} className="animate-spin" />
                              ) : (
                                item.label
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </section>

                  {/* PAYMENT */}

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <CreditCard size={17} className="text-blue-600" />

                      <h3 className="text-sm font-bold text-slate-900">
                        Payment
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">Method</span>

                        <span className="text-right text-xs font-semibold text-slate-700">
                          {getPaymentLabel(selectedOrder.paymentMethod)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">Status</span>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getPaymentStatusClass(
                            selectedOrder.paymentStatus,
                          )}`}
                        >
                          {selectedOrder.paymentStatus || "pending"}
                        </span>
                      </div>

                      {selectedOrder.paymentTransactionId && (
                        <div>
                          <p className="text-xs text-slate-400">Transaction</p>

                          <p className="mt-1 break-all text-xs font-medium text-slate-700">
                            {selectedOrder.paymentTransactionId}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* PRICE SUMMARY */}

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <h3 className="mb-4 text-sm font-bold text-slate-900">
                      Price Summary
                    </h3>

                    <div className="space-y-2.5">
                      <div className="flex justify-between gap-3 text-xs">
                        <span className="text-slate-400">Items Subtotal</span>

                        <span className="font-medium text-slate-700">
                          {formatCurrency(selectedOrder.itemsSubtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-xs">
                        <span className="text-slate-400">Delivery Fee</span>

                        <span className="font-medium text-slate-700">
                          {formatCurrency(selectedOrder.deliveryFee)}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-xs">
                        <span className="text-slate-400">Packaging</span>

                        <span className="font-medium text-slate-700">
                          {formatCurrency(selectedOrder.packagingFee)}
                        </span>
                      </div>

                      {Number(selectedOrder.voucherDiscount) > 0 && (
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="text-emerald-600">
                            Voucher
                            {selectedOrder.voucherCode
                              ? ` (${selectedOrder.voucherCode})`
                              : ""}
                          </span>

                          <span className="font-semibold text-emerald-600">
                            - {formatCurrency(selectedOrder.voucherDiscount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between gap-3 text-xs">
                        <span className="text-slate-400">Tax</span>

                        <span className="font-medium text-slate-700">
                          {formatCurrency(selectedOrder.tax)}
                        </span>
                      </div>

                      {Number(selectedOrder.tipAmount) > 0 && (
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="text-slate-400">Tip</span>

                          <span className="font-medium text-slate-700">
                            {formatCurrency(selectedOrder.tipAmount)}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-sm font-bold text-slate-900">
                          Total
                        </span>

                        <span className="text-lg font-bold text-[#ff6247]">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* RIDER */}

                  {(selectedOrder.assignedRider ||
                    selectedOrder.riderEtaMinutes) && (
                    <section className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <Bike size={17} className="text-purple-600" />

                        <h3 className="text-sm font-bold text-slate-900">
                          Delivery Rider
                        </h3>
                      </div>

                      {selectedOrder.assignedRider && (
                        <div>
                          <p className="text-xs text-slate-400">Rider</p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {selectedOrder.assignedRider.fullName ||
                              "Assigned Rider"}
                          </p>

                          {selectedOrder.assignedRider.phone && (
                            <p className="mt-1 text-xs text-slate-400">
                              {selectedOrder.assignedRider.phone}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedOrder.riderEtaMinutes !== undefined && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-400">ETA</p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {selectedOrder.riderEtaMinutes} minutes
                          </p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>

              {/* STATUS HISTORY */}

              {selectedOrder.statusHistory?.length > 0 && (
                <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Status History
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Order progress timeline
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[...selectedOrder.statusHistory]
                      .reverse()
                      .map((history, index) => {
                        const config = getStatusConfig(history.status);

                        return (
                          <div
                            key={`${history.status}-${history.at}-${index}`}
                            className="flex gap-3"
                          >
                            <div className="relative flex flex-col items-center">
                              <span
                                className={`mt-1 h-2.5 w-2.5 rounded-full ${config.dot}`}
                              />

                              {index !==
                                selectedOrder.statusHistory.length - 1 && (
                                <span className="absolute top-4 h-full w-px bg-slate-200" />
                              )}
                            </div>

                            <div className="pb-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold text-slate-800">
                                  {config.label}
                                </p>

                                {history.at && (
                                  <span className="text-[11px] text-slate-400">
                                    {formatDate(history.at)}{" "}
                                    {formatTime(history.at)}
                                  </span>
                                )}
                              </div>

                              {history.note && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {history.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;
