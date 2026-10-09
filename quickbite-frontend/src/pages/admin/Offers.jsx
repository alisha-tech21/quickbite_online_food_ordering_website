import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  X,
  Tag,
  CalendarDays,
  Percent,
  Truck,
  Copy,
  Check,
  RefreshCw,
  TicketPercent,
  Clock3,
  Users,
  Store,
  ChevronDown,
  MoreVertical,
} from "lucide-react";

import AdminLayout from "../../components/adminLayout/AdminLayout";

import {
  getAllVouchersAdminApi,
  createVoucherAdminApi,
  updateVoucherAdminApi,
  toggleVoucherActiveAdminApi,
  deleteVoucherAdminApi,
} from "../../api/voucherApi";

// ==================================================
// DEFAULT FORM
// ==================================================

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",

  discountType: "flat",
  discountValue: "",
  maxDiscount: "",

  minOrderAmount: "",

  applicableRestaurants: [],

  validDays: [],

  validFrom: "",
  validUntil: "",

  usageLimitPerUser: "1",
  totalUsageLimit: "",

  isActive: true,
};

// ==================================================
// CONSTANTS
// ==================================================

const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DISCOUNT_TYPES = [
  {
    value: "flat",
    label: "Flat Discount",
    description: "Fixed PKR amount off",
    icon: Tag,
  },
  {
    value: "percentage",
    label: "Percentage",
    description: "Percentage discount",
    icon: Percent,
  },
  {
    value: "free_delivery",
    label: "Free Delivery",
    description: "Remove delivery fee",
    icon: Truck,
  },
];

// ==================================================
// HELPERS
// ==================================================

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-PK")}`;
};

const formatDate = (value) => {
  if (!value) return "No expiry";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toInputDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getVoucherStatus = (voucher) => {
  if (!voucher.isActive) {
    return {
      label: "Inactive",
      className: "bg-gray-100 text-gray-600",
    };
  }

  const now = new Date();

  if (voucher.validFrom) {
    const start = new Date(voucher.validFrom);

    if (now < start) {
      return {
        label: "Scheduled",
        className: "bg-blue-50 text-blue-600",
      };
    }
  }

  if (voucher.validUntil) {
    const end = new Date(voucher.validUntil);

    if (now > end) {
      return {
        label: "Expired",
        className: "bg-red-50 text-red-600",
      };
    }
  }

  if (
    voucher.totalUsageLimit &&
    Number(voucher.timesUsed || 0) >= Number(voucher.totalUsageLimit)
  ) {
    return {
      label: "Limit Reached",
      className: "bg-orange-50 text-orange-600",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-50 text-emerald-600",
  };
};

// ==================================================
// SMALL COMPONENTS
// ==================================================

const StatCard = ({ icon: Icon, label, value, description }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>

          {description && (
            <p className="mt-1 text-xs text-gray-400">{description}</p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ff6247]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required = false, children, hint, className = "" }) => {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}

        {required && <span className="ml-1 text-[#ff6247]">*</span>}
      </label>

      {children}

      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff6247] focus:ring-4 focus:ring-orange-50";

const selectClass =
  "w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#ff6247] focus:ring-4 focus:ring-orange-50";

// ==================================================
// MAIN COMPONENT
// ==================================================

const Offers = () => {
  const [vouchers, setVouchers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [actionMenuId, setActionMenuId] = useState(null);

  const [toast, setToast] = useState(null);

  // ==================================================
  // LOAD VOUCHERS
  // ==================================================

  const loadVouchers = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAllVouchersAdminApi();

      setVouchers(response?.vouchers || []);
    } catch (err) {
      console.error("Failed to load vouchers:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load vouchers.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  // ==================================================
  // TOAST
  // ==================================================

  const showToast = (type, message) => {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // ==================================================
  // STATS
  // ==================================================

  const stats = useMemo(() => {
    const active = vouchers.filter((voucher) => voucher.isActive).length;

    const inactive = vouchers.filter((voucher) => !voucher.isActive).length;

    const totalUsage = vouchers.reduce(
      (sum, voucher) => sum + Number(voucher.timesUsed || 0),
      0,
    );

    return {
      total: vouchers.length,
      active,
      inactive,
      totalUsage,
    };
  }, [vouchers]);

  // ==================================================
  // FILTERED VOUCHERS
  // ==================================================

  const filteredVouchers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return vouchers.filter((voucher) => {
      const matchesSearch =
        !searchValue ||
        voucher.code?.toLowerCase().includes(searchValue) ||
        voucher.title?.toLowerCase().includes(searchValue) ||
        voucher.description?.toLowerCase().includes(searchValue);

      if (!matchesSearch) {
        return false;
      }

      if (filter === "active") {
        return voucher.isActive;
      }

      if (filter === "inactive") {
        return !voucher.isActive;
      }

      if (filter === "flat") {
        return voucher.discountType === "flat";
      }

      if (filter === "percentage") {
        return voucher.discountType === "percentage";
      }

      if (filter === "free_delivery") {
        return voucher.discountType === "free_delivery";
      }

      return true;
    });
  }, [vouchers, search, filter]);

  // ==================================================
  // FORM HELPERS
  // ==================================================

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setActionMenuId(null);
    setEditingVoucher(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (voucher) => {
    setActionMenuId(null);
    setEditingVoucher(voucher);

    setForm({
      code: voucher.code || "",
      title: voucher.title || "",
      description: voucher.description || "",

      discountType: voucher.discountType || "flat",

      discountValue:
        voucher.discountValue !== undefined && voucher.discountValue !== null
          ? String(voucher.discountValue)
          : "",

      maxDiscount:
        voucher.maxDiscount !== undefined && voucher.maxDiscount !== null
          ? String(voucher.maxDiscount)
          : "",

      minOrderAmount:
        voucher.minOrderAmount !== undefined && voucher.minOrderAmount !== null
          ? String(voucher.minOrderAmount)
          : "",

      applicableRestaurants: Array.isArray(voucher.applicableRestaurants)
        ? voucher.applicableRestaurants.map((restaurant) =>
            typeof restaurant === "object"
              ? String(restaurant._id)
              : String(restaurant),
          )
        : [],

      validDays: Array.isArray(voucher.validDays) ? voucher.validDays : [],

      validFrom: toInputDate(voucher.validFrom),
      validUntil: toInputDate(voucher.validUntil),

      usageLimitPerUser:
        voucher.usageLimitPerUser !== undefined &&
        voucher.usageLimitPerUser !== null
          ? String(voucher.usageLimitPerUser)
          : "1",

      totalUsageLimit:
        voucher.totalUsageLimit !== undefined &&
        voucher.totalUsageLimit !== null
          ? String(voucher.totalUsageLimit)
          : "",

      isActive: Boolean(voucher.isActive),
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingVoucher(null);
    setForm({ ...EMPTY_FORM });
  };

  // ==================================================
  // VALIDATION
  // ==================================================

  const validateForm = () => {
    const code = form.code.trim();
    const title = form.title.trim();

    if (!code) {
      return "Voucher code is required.";
    }

    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      return "Voucher code can only contain letters, numbers, _ or -.";
    }

    if (!title) {
      return "Voucher title is required.";
    }

    if (form.discountType !== "free_delivery") {
      if (form.discountValue === "" || Number(form.discountValue) < 0) {
        return "Enter a valid discount value.";
      }
    }

    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      return "Percentage discount cannot be greater than 100%.";
    }

    if (form.minOrderAmount !== "" && Number(form.minOrderAmount) < 0) {
      return "Minimum order amount cannot be negative.";
    }

    if (form.maxDiscount !== "" && Number(form.maxDiscount) < 0) {
      return "Maximum discount cannot be negative.";
    }

    if (form.usageLimitPerUser !== "" && Number(form.usageLimitPerUser) < 1) {
      return "Usage limit per user must be at least 1.";
    }

    if (form.totalUsageLimit !== "" && Number(form.totalUsageLimit) < 1) {
      return "Total usage limit must be at least 1.";
    }

    if (form.validFrom && form.validUntil) {
      const from = new Date(form.validFrom);
      const until = new Date(form.validUntil);

      if (until < from) {
        return "Valid until date cannot be before valid from date.";
      }
    }

    return "";
  };

  // ==================================================
  // SAVE VOUCHER
  // ==================================================

  const handleSave = async () => {
    const validationError = validateForm();

    if (validationError) {
      showToast("error", validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code: form.code.trim().toUpperCase(),

        title: form.title.trim(),

        description: form.description.trim(),

        discountType: form.discountType,

        discountValue:
          form.discountType === "free_delivery"
            ? 0
            : Number(form.discountValue || 0),

        maxDiscount:
          form.discountType === "percentage" && form.maxDiscount !== ""
            ? Number(form.maxDiscount)
            : undefined,

        minOrderAmount: Number(form.minOrderAmount || 0),

        applicableRestaurants: form.applicableRestaurants.filter(Boolean),

        validDays: form.validDays,

        validFrom: form.validFrom
          ? new Date(`${form.validFrom}T00:00:00`)
          : undefined,

        validUntil: form.validUntil
          ? new Date(`${form.validUntil}T23:59:59`)
          : undefined,

        usageLimitPerUser: Number(form.usageLimitPerUser || 1),

        totalUsageLimit:
          form.totalUsageLimit === ""
            ? undefined
            : Number(form.totalUsageLimit),

        isActive: Boolean(form.isActive),
      };

      let response;

      if (editingVoucher) {
        response = await updateVoucherAdminApi(editingVoucher._id, payload);
      } else {
        response = await createVoucherAdminApi(payload);
      }

      const savedVoucher = response?.voucher;

      if (editingVoucher && savedVoucher) {
        setVouchers((previous) =>
          previous.map((voucher) =>
            voucher._id === savedVoucher._id ? savedVoucher : voucher,
          ),
        );
      } else if (savedVoucher) {
        setVouchers((previous) => [savedVoucher, ...previous]);
      } else {
        await loadVouchers();
      }

      setShowModal(false);
      setEditingVoucher(null);
      setForm({ ...EMPTY_FORM });

      showToast(
        "success",
        editingVoucher
          ? "Voucher updated successfully."
          : "Voucher created successfully.",
      );
    } catch (err) {
      console.error("Failed to save voucher:", err);

      showToast(
        "error",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save voucher.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // TOGGLE ACTIVE
  // ==================================================

  const handleToggle = async (voucher) => {
    try {
      setTogglingId(voucher._id);

      const response = await toggleVoucherActiveAdminApi(voucher._id);

      const updatedVoucher = response?.voucher;

      if (updatedVoucher) {
        setVouchers((previous) =>
          previous.map((item) =>
            item._id === updatedVoucher._id ? updatedVoucher : item,
          ),
        );
      } else {
        await loadVouchers(true);
      }

      showToast(
        "success",
        voucher.isActive ? "Voucher deactivated." : "Voucher activated.",
      );
    } catch (err) {
      console.error("Failed to toggle voucher:", err);

      showToast(
        "error",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update voucher status.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ==================================================
  // DELETE
  // ==================================================

  const handleDelete = async (voucher) => {
    const confirmed = window.confirm(
      `Delete voucher "${voucher.code}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(voucher._id);

      await deleteVoucherAdminApi(voucher._id);

      setVouchers((previous) =>
        previous.filter((item) => item._id !== voucher._id),
      );

      showToast("success", "Voucher deleted successfully.");
    } catch (err) {
      console.error("Failed to delete voucher:", err);

      showToast(
        "error",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete voucher.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==================================================
  // ACTION MENU
  // ==================================================

  const toggleActionMenu = (voucherId) => {
    setActionMenuId((previous) => (previous === voucherId ? null : voucherId));
  };

  // ==================================================
  // COPY CODE
  // ==================================================

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);

      showToast("success", `${code} copied.`);
    } catch (err) {
      console.error("Copy failed:", err);

      showToast("error", "Unable to copy voucher code.");
    }
  };

  // ==================================================
  // DAYS
  // ==================================================

  const toggleDay = (day) => {
    setForm((previous) => {
      const exists = previous.validDays.includes(day);

      return {
        ...previous,
        validDays: exists
          ? previous.validDays.filter((item) => item !== day)
          : [...previous.validDays, day],
      };
    });
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <AdminLayout>
      <div className="min-h-[calc(100vh-82px)] bg-[#f8f7fb]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                <span>Admin</span>
                <span>/</span>
                <span className="text-gray-600">Offers & Vouchers</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Offers & Vouchers
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create and manage promotional vouchers for QuickBite customers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadVouchers(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />

                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6247] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb543b] active:scale-[0.98]"
              >
                <Plus size={18} />
                New Voucher
              </button>
            </div>
          </div>

          {/* ================================================== */}
          {/* STATS */}
          {/* ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={TicketPercent}
              label="Total Vouchers"
              value={stats.total}
              description="All created vouchers"
            />

            <StatCard
              icon={Power}
              label="Active"
              value={stats.active}
              description="Currently enabled"
            />

            <StatCard
              icon={Clock3}
              label="Inactive"
              value={stats.inactive}
              description="Disabled vouchers"
            />

            <StatCard
              icon={Users}
              label="Total Uses"
              value={stats.totalUsage}
              description="Voucher redemptions"
            />
          </div>

          {/* ================================================== */}
          {/* FILTER BAR */}
          {/* ================================================== */}

          <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by voucher code, title or description..."
                  className={`${inputClass} pl-11`}
                />
              </div>

              <div className="relative w-full lg:w-[230px]">
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="all">All Vouchers</option>

                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>

                  <option value="flat">Flat Discounts</option>

                  <option value="percentage">Percentage Discounts</option>

                  <option value="free_delivery">Free Delivery</option>
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}

          {error && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load offers
                </p>

                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => loadVouchers()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-red-600 shadow-sm"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}

          {/* ================================================== */}
          {/* CONTENT */}
          {/* ================================================== */}

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
              <div className="flex flex-col items-center justify-center">
                <RefreshCw size={28} className="animate-spin text-[#ff6247]" />

                <p className="mt-3 text-sm font-medium text-gray-500">
                  Loading vouchers...
                </p>
              </div>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#ff6247]">
                <TicketPercent size={28} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                {search || filter !== "all"
                  ? "No vouchers found"
                  : "No vouchers yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {search || filter !== "all"
                  ? "Try changing your search or filter."
                  : "Create your first promotional voucher to start offering discounts to customers."}
              </p>

              {!search && filter === "all" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6247] px-5 text-sm font-semibold text-white transition hover:bg-[#eb543b]"
                >
                  <Plus size={18} />
                  Create Voucher
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ================================================== */}
              {/* DESKTOP TABLE */}
              {/* ================================================== */}

              <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Voucher
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Discount
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Minimum Order
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Validity
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Usage
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredVouchers.map((voucher) => {
                        const status = getVoucherStatus(voucher);

                        return (
                          <tr
                            key={voucher._id}
                            className="transition hover:bg-gray-50/70"
                          >
                            {/* Voucher */}

                            <td className="px-5 py-5">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ff6247]">
                                  <Tag size={18} />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">
                                      {voucher.code}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => copyCode(voucher.code)}
                                      className="text-gray-400 transition hover:text-[#ff6247]"
                                      title="Copy code"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </div>

                                  <p className="mt-1 max-w-[260px] truncate text-sm font-medium text-gray-700">
                                    {voucher.title || "Untitled voucher"}
                                  </p>

                                  {voucher.description && (
                                    <p className="mt-0.5 max-w-[300px] truncate text-xs text-gray-400">
                                      {voucher.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Discount */}

                            <td className="px-5 py-5">
                              {voucher.discountType === "flat" ? (
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {formatMoney(voucher.discountValue)}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    Flat discount
                                  </p>
                                </div>
                              ) : voucher.discountType === "percentage" ? (
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {voucher.discountValue}%
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {voucher.maxDiscount
                                      ? `Max ${formatMoney(
                                          voucher.maxDiscount,
                                        )}`
                                      : "No maximum cap"}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-bold text-gray-900">
                                    Free Delivery
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    Delivery fee waived
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Minimum */}

                            <td className="px-5 py-5">
                              <p className="text-sm font-semibold text-gray-800">
                                {voucher.minOrderAmount
                                  ? formatMoney(voucher.minOrderAmount)
                                  : "No minimum"}
                              </p>
                            </td>

                            {/* Validity */}

                            <td className="px-5 py-5">
                              <div className="flex items-start gap-2">
                                <CalendarDays
                                  size={16}
                                  className="mt-0.5 shrink-0 text-gray-400"
                                />

                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {voucher.validFrom
                                      ? formatDate(voucher.validFrom)
                                      : "Anytime"}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    to{" "}
                                    {voucher.validUntil
                                      ? formatDate(voucher.validUntil)
                                      : "No expiry"}
                                  </p>

                                  {voucher.validDays?.length > 0 && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      {voucher.validDays.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Usage */}

                            <td className="px-5 py-5">
                              <div className="flex items-start gap-2">
                                <Users
                                  size={16}
                                  className="mt-0.5 shrink-0 text-gray-400"
                                />

                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {voucher.timesUsed || 0}
                                    {voucher.totalUsageLimit
                                      ? ` / ${voucher.totalUsageLimit}`
                                      : ""}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {voucher.usageLimitPerUser || 1} per user
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Status */}

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>

                            {/* Actions */}

                            <td className="px-4 py-4">
                              <div className="relative flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => toggleActionMenu(voucher._id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                  title="Voucher actions"
                                >
                                  <MoreVertical size={18} />
                                </button>

                                {actionMenuId === voucher._id && (
                                  <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                                    {/* Edit */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuId(null);
                                        openEditModal(voucher);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#ff6247]"
                                    >
                                      <Pencil size={16} />

                                      <span>Edit Voucher</span>
                                    </button>

                                    {/* Activate / Deactivate */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuId(null);
                                        handleToggle(voucher);
                                      }}
                                      disabled={togglingId === voucher._id}
                                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                        voucher.isActive
                                          ? "text-amber-600 hover:bg-amber-50"
                                          : "text-emerald-600 hover:bg-emerald-50"
                                      }`}
                                    >
                                      {togglingId === voucher._id ? (
                                        <RefreshCw
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Power size={16} />
                                      )}

                                      <span>
                                        {voucher.isActive
                                          ? "Deactivate"
                                          : "Activate"}
                                      </span>
                                    </button>

                                    {/* Copy */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuId(null);
                                        copyCode(voucher.code);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                                    >
                                      <Copy size={16} />

                                      <span>Copy Code</span>
                                    </button>

                                    <div className="my-1 border-t border-gray-100" />

                                    {/* Delete */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionMenuId(null);
                                        handleDelete(voucher);
                                      }}
                                      disabled={deletingId === voucher._id}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {deletingId === voucher._id ? (
                                        <RefreshCw
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}

                                      <span>Delete Voucher</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================================================== */}
              {/* MOBILE CARD VIEW */}
              {/* ================================================== */}

              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredVouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);

                  return (
                    <div
                      key={`mobile-${voucher._id}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ff6247]">
                            <Tag size={18} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-bold text-gray-900">
                                {voucher.code}
                              </p>

                              <button
                                type="button"
                                onClick={() => copyCode(voucher.code)}
                                className="shrink-0 text-gray-400 transition hover:text-[#ff6247]"
                                title="Copy code"
                              >
                                <Copy size={14} />
                              </button>
                            </div>

                            <p className="mt-1 text-sm font-medium text-gray-700">
                              {voucher.title || "Untitled voucher"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {voucher.description && (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500">
                          {voucher.description}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-[11px] font-medium text-gray-400">
                            Discount
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {voucher.discountType === "flat"
                              ? formatMoney(voucher.discountValue)
                              : voucher.discountType === "percentage"
                                ? `${voucher.discountValue}%`
                                : "Free Delivery"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-[11px] font-medium text-gray-400">
                            Minimum
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {voucher.minOrderAmount
                              ? formatMoney(voucher.minOrderAmount)
                              : "None"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-[11px] font-medium text-gray-400">
                            Valid Until
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {voucher.validUntil
                              ? formatDate(voucher.validUntil)
                              : "No expiry"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-[11px] font-medium text-gray-400">
                            Uses
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {voucher.timesUsed || 0}
                            {voucher.totalUsageLimit
                              ? ` / ${voucher.totalUsageLimit}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="text-xs text-gray-400">
                          {voucher.validDays?.length > 0
                            ? voucher.validDays.join(", ")
                            : "Available every day"}
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => toggleActionMenu(voucher._id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                            title="Voucher actions"
                          >
                            <MoreVertical size={19} />
                          </button>

                          {actionMenuId === voucher._id && (
                            <div className="absolute bottom-full right-0 z-50 mb-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                              {/* Edit */}

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  openEditModal(voucher);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#ff6247]"
                              >
                                <Pencil size={16} />

                                <span>Edit Voucher</span>
                              </button>

                              {/* Activate / Deactivate */}

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  handleToggle(voucher);
                                }}
                                disabled={togglingId === voucher._id}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition disabled:opacity-50 ${
                                  voucher.isActive
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {togglingId === voucher._id ? (
                                  <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Power size={16} />
                                )}

                                <span>
                                  {voucher.isActive ? "Deactivate" : "Activate"}
                                </span>
                              </button>

                              {/* Copy */}

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  copyCode(voucher.code);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                <Copy size={16} />

                                <span>Copy Code</span>
                              </button>

                              <div className="my-1 border-t border-gray-100" />

                              {/* Delete */}

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  handleDelete(voucher);
                                }}
                                disabled={deletingId === voucher._id}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === voucher._id ? (
                                  <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}

                                <span>Delete Voucher</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {editingVoucher ? "Edit Voucher" : "Create New Voucher"}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                  {editingVoucher
                    ? "Update voucher details and availability."
                    : "Create a promotional offer for customers."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* Modal Body */}

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ================================================== */}
                {/* BASIC INFORMATION */}
                {/* ================================================== */}

                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900">
                      Basic Information
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      Customer-facing voucher details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label="Voucher Code"
                      required
                      hint="Example: QUICK500"
                    >
                      <input
                        type="text"
                        value={form.code}
                        onChange={(event) =>
                          updateForm("code", event.target.value.toUpperCase())
                        }
                        placeholder="QUICK500"
                        className={`${inputClass} uppercase`}
                      />
                    </Field>

                    <Field label="Voucher Title" required>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(event) =>
                          updateForm("title", event.target.value)
                        }
                        placeholder="Get Rs. 500 OFF"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Description" className="sm:col-span-2">
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                        rows={3}
                        placeholder="Describe the offer for customers..."
                        className={`${inputClass} resize-none`}
                      />
                    </Field>
                  </div>
                </div>

                {/* ================================================== */}
                {/* DISCOUNT TYPE */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900">Discount</h3>

                    <p className="mt-1 text-xs text-gray-400">
                      Choose how customers receive the offer.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {DISCOUNT_TYPES.map((type) => {
                      const Icon = type.icon;

                      const selected = form.discountType === type.value;

                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateForm("discountType", type.value)}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-[#ff6247] bg-orange-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              selected
                                ? "bg-[#ff6247] text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Icon size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800">
                              {type.label}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {type.description}
                            </p>
                          </div>

                          {selected && (
                            <Check
                              size={18}
                              className="shrink-0 text-[#ff6247]"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ================================================== */}
                {/* DISCOUNT RULES */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900">Discount Rules</h3>

                    <p className="mt-1 text-xs text-gray-400">
                      Set the amount and order requirements.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {form.discountType !== "free_delivery" && (
                      <Field
                        label={
                          form.discountType === "percentage"
                            ? "Discount Percentage"
                            : "Discount Amount"
                        }
                        required
                      >
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={
                              form.discountType === "percentage"
                                ? "100"
                                : undefined
                            }
                            value={form.discountValue}
                            onChange={(event) =>
                              updateForm("discountValue", event.target.value)
                            }
                            placeholder={
                              form.discountType === "percentage" ? "20" : "500"
                            }
                            className={`${inputClass} pr-14`}
                          />

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                            {form.discountType === "percentage" ? "%" : "PKR"}
                          </span>
                        </div>
                      </Field>
                    )}

                    {form.discountType === "percentage" && (
                      <Field
                        label="Maximum Discount"
                        hint="Leave empty for no maximum cap."
                      >
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={form.maxDiscount}
                            onChange={(event) =>
                              updateForm("maxDiscount", event.target.value)
                            }
                            placeholder="1000"
                            className={`${inputClass} pr-14`}
                          />

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                            PKR
                          </span>
                        </div>
                      </Field>
                    )}

                    <Field
                      label="Minimum Order Amount"
                      hint="Leave empty for no minimum."
                    >
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={form.minOrderAmount}
                          onChange={(event) =>
                            updateForm("minOrderAmount", event.target.value)
                          }
                          placeholder="1500"
                          className={`${inputClass} pr-14`}
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                          PKR
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* ================================================== */}
                {/* VALIDITY */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5 lg:col-span-2">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ff6247]">
                      <CalendarDays size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">Validity</h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Control when this voucher can be used.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Valid From">
                      <input
                        type="date"
                        value={form.validFrom}
                        onChange={(event) =>
                          updateForm("validFrom", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Valid Until">
                      <input
                        type="date"
                        value={form.validUntil}
                        onChange={(event) =>
                          updateForm("validUntil", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      label="Valid Days"
                      className="sm:col-span-2"
                      hint="Leave all unselected to allow the voucher every day."
                    >
                      <div className="flex flex-wrap gap-2">
                        {DAY_OPTIONS.map((day) => {
                          const selected = form.validDays.includes(day);

                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                selected
                                  ? "border-[#ff6247] bg-[#ff6247] text-white"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                </div>

                {/* ================================================== */}
                {/* USAGE */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Users size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">Usage Limits</h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Control voucher redemption limits.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Field
                      label="Uses Per User"
                      hint="How many times one customer can use this voucher."
                    >
                      <input
                        type="number"
                        min="1"
                        value={form.usageLimitPerUser}
                        onChange={(event) =>
                          updateForm("usageLimitPerUser", event.target.value)
                        }
                        placeholder="1"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      label="Total Usage Limit"
                      hint="Leave empty for unlimited total usage."
                    >
                      <input
                        type="number"
                        min="1"
                        value={form.totalUsageLimit}
                        onChange={(event) =>
                          updateForm("totalUsageLimit", event.target.value)
                        }
                        placeholder="100"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                {/* ================================================== */}
                {/* RESTAURANTS */}
                {/* ================================================== */}

                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <Store size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        Restaurant Restriction
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Leave empty to make this offer available at all
                        restaurants.
                      </p>
                    </div>
                  </div>

                  <Field
                    label="Restaurant IDs"
                    hint="Enter MongoDB Restaurant IDs separated by commas."
                  >
                    <textarea
                      value={form.applicableRestaurants.join(", ")}
                      onChange={(event) => {
                        const ids = event.target.value
                          .split(",")
                          .map((id) => id.trim())
                          .filter(Boolean);

                        updateForm("applicableRestaurants", ids);
                      }}
                      rows={4}
                      placeholder="68abc123..., 68def456..."
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </div>

                {/* ================================================== */}
                {/* ACTIVE */}
                {/* ================================================== */}

                <div className="lg:col-span-2">
                  <button
                    type="button"
                    onClick={() => updateForm("isActive", !form.isActive)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          form.isActive
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        <Power size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {form.isActive
                            ? "Voucher is Active"
                            : "Voucher is Inactive"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {form.isActive
                            ? "Customers can use this voucher when all rules are satisfied."
                            : "Customers cannot use this voucher while it is inactive."}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative ml-4 h-6 w-11 shrink-0 rounded-full transition ${
                        form.isActive ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          form.isActive ? "left-6" : "left-1"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================== */}
            {/* MODAL FOOTER */}
            {/* ================================================== */}

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6247] px-6 text-sm font-semibold text-white transition hover:bg-[#eb543b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <RefreshCw size={17} className="animate-spin" />}

                {saving
                  ? "Saving..."
                  : editingVoucher
                    ? "Update Voucher"
                    : "Create Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* TOAST */}
      {/* ================================================== */}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[200] max-w-[calc(100vw-2rem)]">
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
              toast.type === "success" ? "bg-gray-900" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? <Check size={17} /> : <X size={17} />}

            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Offers;
