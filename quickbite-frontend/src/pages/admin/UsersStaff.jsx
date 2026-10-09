import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Users,
  UserCheck,
  Bike,
  ChefHat,
  X,
  CheckCircle2,
  Clock3,
  CircleOff,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import AdminLayout from "../../components/adminLayout/AdminLayout";

import {
  getAdminUsersApi,
  getAdminUserStatsApi,
  createAdminMemberApi,
  updateAdminMemberApi,
  updateAdminMemberStatusApi,
  deleteAdminMemberApi,
} from "../../api/userApi";

// =========================================================
// HELPERS
// =========================================================

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRole = (role) => {
  const roles = {
    customer: "Customer",
    rider: "Delivery Rider",
    kitchen_staff: "Kitchen Staff",
    branch_manager: "Branch Manager",
    admin: "Admin",
  };

  return roles[role] || role;
};

const getRoleIcon = (role) => {
  if (role === "rider") return Bike;
  if (role === "kitchen_staff") return ChefHat;
  if (role === "branch_manager") return ShieldCheck;
  if (role === "admin") return ShieldCheck;

  return Users;
};

const getRoleClass = (role) => {
  const classes = {
    customer: "bg-slate-100 text-slate-700",
    rider: "bg-blue-50 text-blue-700",
    kitchen_staff: "bg-orange-50 text-orange-700",
    branch_manager: "bg-purple-50 text-purple-700",
    admin: "bg-rose-50 text-rose-700",
  };

  return classes[role] || "bg-slate-100 text-slate-700";
};

const getStatusConfig = (status) => {
  const configs = {
    active: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700",
      icon: Clock3,
    },
    on_delivery: {
      label: "On Delivery",
      className: "bg-blue-50 text-blue-700",
      icon: Bike,
    },
    offline: {
      label: "Offline",
      className: "bg-slate-100 text-slate-600",
      icon: CircleOff,
    },
    suspended: {
      label: "Suspended",
      className: "bg-red-50 text-red-700",
      icon: CircleOff,
    },
  };

  return (
    configs[status] || {
      label: status || "Unknown",
      className: "bg-slate-100 text-slate-600",
      icon: CircleOff,
    }
  );
};

// =========================================================
// STATUS BADGE
// =========================================================

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
};

// =========================================================
// ROLE BADGE
// =========================================================

const RoleBadge = ({ role }) => {
  const Icon = getRoleIcon(role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleClass(
        role,
      )}`}
    >
      <Icon size={13} />
      {formatRole(role)}
    </span>
  );
};

// =========================================================
// SUMMARY CARD
// =========================================================

const SummaryCard = ({ icon: Icon, title, value, description }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {Number(value || 0).toLocaleString()}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1ee] text-[#ff6247]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

// =========================================================
// EMPTY FORM
// =========================================================

const emptyForm = {
  role: "customer",
  fullName: "",
  email: "",
  phone: "",
  countryCode: "+92",
  branch: "",
  vehicle: "",
  licensePlate: "",
  initialStatus: "active",
  sendWelcome: true,
};

// =========================================================
// MAIN COMPONENT
// =========================================================

const UsersStaff = () => {
  // -------------------------------------------------------
  // DATA
  // -------------------------------------------------------

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // -------------------------------------------------------
  // FILTERS
  // -------------------------------------------------------

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const limit = 10;

  // -------------------------------------------------------
  // MODALS
  // -------------------------------------------------------

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------
  // ACTION MENU
  // -------------------------------------------------------

  const [openMenuId, setOpenMenuId] = useState(null);

  // -------------------------------------------------------
  // LOAD USERS
  // -------------------------------------------------------

  const loadUsers = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getAdminUsersApi({
          page,
          limit,
          role: roleFilter,
          status: statusFilter,
          search,
        });

        setUsers(response.users || []);
        setPages(Math.max(1, Number(response.pages || 1)));
      } catch (err) {
        console.error("Admin users error:", err);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load users.";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, roleFilter, statusFilter, search],
  );

  // -------------------------------------------------------
  // LOAD STATS
  // -------------------------------------------------------

  const loadStats = useCallback(async () => {
    try {
      const response = await getAdminUserStatsApi();

      setStats(response);
    } catch (err) {
      console.error("Admin user stats error:", err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // -------------------------------------------------------
  // LIVE SEARCH
  // -------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // -------------------------------------------------------
  // SEARCH CLEAR
  // -------------------------------------------------------

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // -------------------------------------------------------
  // OPEN ADD MODAL
  // -------------------------------------------------------

  const openAddModal = () => {
    setEditingUser(null);

    setForm(emptyForm);

    setShowMemberModal(true);
  };

  // -------------------------------------------------------
  // OPEN EDIT MODAL
  // -------------------------------------------------------

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      role: user.role || "customer",
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      countryCode: user.countryCode || "+92",
      branch: user.staffInfo?.branch || user.riderInfo?.hubAssignment || "",
      vehicle: user.riderInfo?.vehicle || "",
      licensePlate: user.riderInfo?.licensePlate || "",
      initialStatus: user.status || "active",
      sendWelcome: false,
    });

    setOpenMenuId(null);
    setShowMemberModal(true);
  };

  // -------------------------------------------------------
  // FORM CHANGE
  // -------------------------------------------------------

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // -------------------------------------------------------
  // SAVE MEMBER
  // -------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          status: form.initialStatus,
        };

        if (form.role === "rider") {
          payload.riderInfo = {
            vehicle: form.vehicle.trim(),
            licensePlate: form.licensePlate.trim(),
            hubAssignment: form.branch.trim(),
          };
        }

        if (form.role === "kitchen_staff" || form.role === "branch_manager") {
          payload.staffInfo = {
            branch: form.branch.trim(),
          };
        }

        const response = await updateAdminMemberApi(editingUser._id, payload);

        setUsers((previous) =>
          previous.map((user) =>
            user._id === editingUser._id ? response.user : user,
          ),
        );

        toast.success("Member updated successfully.");
      } else {
        const payload = {
          role: form.role,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          countryCode: form.countryCode,
          branch: form.branch.trim(),
          vehicle: form.vehicle.trim(),
          licensePlate: form.licensePlate.trim(),
          initialStatus: form.initialStatus,
          sendWelcome: form.sendWelcome,
        };

        const response = await createAdminMemberApi(payload);

        setUsers((previous) => [response.user, ...previous]);

        toast.success("Member created successfully.");

        await loadStats();
      }

      setShowMemberModal(false);
      setEditingUser(null);
      setForm(emptyForm);

      await loadUsers({ silent: true });
    } catch (err) {
      console.error("Save member error:", err);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save member.",
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // STATUS CHANGE
  // -------------------------------------------------------

  const handleStatusChange = async (user, status) => {
    try {
      setOpenMenuId(null);

      const response = await updateAdminMemberStatusApi(user._id, status);

      setUsers((previous) =>
        previous.map((item) => (item._id === user._id ? response.user : item)),
      );

      toast.success(
        status === "suspended" ? "Member suspended." : "Member status updated.",
      );

      await loadStats();
    } catch (err) {
      console.error("Status update error:", err);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update member status.",
      );
    }
  };

  // -------------------------------------------------------
  // DELETE MEMBER
  // -------------------------------------------------------

  const handleDelete = async (user) => {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Are you sure you want to remove ${user.fullName}?`,
    );

    if (!confirmed) return;

    try {
      await deleteAdminMemberApi(user._id);

      setUsers((previous) => previous.filter((item) => item._id !== user._id));

      toast.success("Member removed successfully.");

      await loadStats();
      await loadUsers({ silent: true });
    } catch (err) {
      console.error("Delete member error:", err);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to remove member.",
      );
    }
  };

  // -------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------

  const canGoPrevious = page > 1;
  const canGoNext = page < pages;

  const goPrevious = () => {
    if (!canGoPrevious) return;

    setPage((previous) => previous - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;

    setPage((previous) => previous + 1);
  };

  // -------------------------------------------------------
  // CURRENT PAGE INFO
  // -------------------------------------------------------

  const pageStart = users.length ? (page - 1) * limit + 1 : 0;

  const pageEnd = users.length ? pageStart + users.length - 1 : 0;

  // -------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Registered",
        value: stats?.totalRegistered || 0,
        description: "All customers & staff",
        icon: Users,
      },
      {
        title: "Active Customers",
        value: stats?.activeCustomers || 0,
        description: "Currently active",
        icon: UserCheck,
      },
      {
        title: "Delivery Riders",
        value: stats?.deliveryRiders || 0,
        description: `${stats?.ridersCurrentlyOnRoad || 0} currently on road`,
        icon: Bike,
      },
      {
        title: "Kitchen & Ops Staff",
        value: stats?.kitchenOpsStaff || 0,
        description: "Kitchen + branch managers",
        icon: ChefHat,
      },
    ],
    [stats],
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#f8f7fb] px-5 py-6 lg:px-7">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Users & Staff
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customers, riders and operational staff.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadUsers({ silent: true });
                loadStats();
              }}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ff6247] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ef533a]"
            >
              <Plus size={17} />
              Add New Member
            </button>
          </div>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              value={card.value}
              description={card.description}
            />
          ))}
        </div>

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              {/* SEARCH */}

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
                    placeholder="Search name, email or phone..."
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

              {/* ROLE */}

              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#ff6247]"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="rider">Delivery Riders</option>
                <option value="kitchen_staff">Kitchen Staff</option>
                <option value="branch_manager">Branch Managers</option>
                <option value="admin">Admins</option>
              </select>

              {/* STATUS */}

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#ff6247]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="on_delivery">On Delivery</option>
                <option value="offline">Offline</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Member
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Orders
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Joined
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw
                          size={24}
                          className="animate-spin text-[#ff6247]"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-600">
                          Loading members...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-sm font-semibold text-red-600">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() => loadUsers()}
                        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Users size={22} />
                        </div>

                        <p className="mt-3 text-sm font-bold text-slate-800">
                          No members found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const role = user.role;

                    return (
                      <tr
                        key={user._id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                      >
                        {/* MEMBER */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.fullName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ee] text-sm font-bold text-[#ff6247]">
                                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {user.fullName}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                ID: {String(user._id).slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">
                          <div>
                            <p className="max-w-[230px] truncate text-sm text-slate-700">
                              {user.email}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {user.countryCode || ""}
                              {user.phone || "—"}
                            </p>
                          </div>
                        </td>

                        {/* ROLE */}

                        <td className="px-5 py-4">
                          <RoleBadge role={role} />
                        </td>

                        {/* ORDERS */}

                        <td className="px-5 py-4">
                          {role === "customer" ? (
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {user.totalOrders || 0}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Orders
                              </p>
                            </div>
                          ) : role === "rider" ? (
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {user.riderInfo?.totalDeliveries || 0}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Deliveries
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>

                        {/* JOINED */}

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <StatusBadge status={user.status} />
                        </td>

                        {/* ACTIONS */}

                        <td className="relative px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                              title="Edit member"
                            >
                              <Pencil size={16} />
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === user._id ? null : user._id,
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                title="More actions"
                              >
                                <MoreVertical size={17} />
                              </button>

                              {openMenuId === user._id && (
                                <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                                  {user.status !== "active" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(user, "active")
                                      }
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      Activate
                                    </button>
                                  )}

                                  {user.status === "active" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(user, "suspended")
                                      }
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                                    >
                                      Suspend
                                    </button>
                                  )}

                                  {user.status === "suspended" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(user, "active")
                                      }
                                      className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                                    >
                                      Reactivate
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDelete(user)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={15} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">{pageStart}</span>{" "}
              to <span className="font-semibold text-slate-700">{pageEnd}</span>{" "}
              members
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevious}
                disabled={!canGoPrevious}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-[80px] text-center text-sm font-semibold text-slate-700">
                Page {page} of {pages}
              </span>

              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MEMBER MODAL
      ===================================================== */}

      {showMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingUser ? "Edit Member" : "Add New Member"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingUser
                    ? "Update member information and access role."
                    : "Create a customer or operational staff account."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setShowMemberModal(false);
                    setEditingUser(null);
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* ROLE */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role
                  </label>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateField("role", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#ff6247]"
                  >
                    <option value="customer">Customer</option>
                    <option value="rider">Delivery Rider</option>
                    <option value="kitchen_staff">Kitchen Staff</option>
                    <option value="branch_manager">Branch Manager</option>

                    {!editingUser && <option value="admin">Admin</option>}
                  </select>
                </div>

                {/* FULL NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      updateField("fullName", event.target.value)
                    }
                    placeholder="Enter full name"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="name@example.com"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>

                  <div className="flex">
                    <input
                      type="text"
                      value={form.countryCode}
                      onChange={(event) =>
                        updateField("countryCode", event.target.value)
                      }
                      className="h-11 w-20 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-2 text-center text-sm outline-none focus:border-[#ff6247]"
                    />

                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="3001234567"
                      className="h-11 min-w-0 flex-1 rounded-r-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                    />
                  </div>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.initialStatus}
                    onChange={(event) =>
                      updateField("initialStatus", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#ff6247]"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="offline">Offline</option>
                    <option value="suspended">Suspended</option>

                    {form.role === "rider" && (
                      <option value="on_delivery">On Delivery</option>
                    )}
                  </select>
                </div>

                {/* RIDER FIELDS */}

                {form.role === "rider" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Vehicle
                      </label>

                      <input
                        type="text"
                        value={form.vehicle}
                        onChange={(event) =>
                          updateField("vehicle", event.target.value)
                        }
                        placeholder="e.g. Honda CD 70"
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        License Plate
                      </label>

                      <input
                        type="text"
                        value={form.licensePlate}
                        onChange={(event) =>
                          updateField("licensePlate", event.target.value)
                        }
                        placeholder="e.g. ABC-123"
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Hub / Branch Assignment
                      </label>

                      <input
                        type="text"
                        value={form.branch}
                        onChange={(event) =>
                          updateField("branch", event.target.value)
                        }
                        placeholder="e.g. Mall Road Kitchen Hub"
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                      />
                    </div>
                  </>
                )}

                {/* STAFF BRANCH */}

                {(form.role === "kitchen_staff" ||
                  form.role === "branch_manager") && (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Branch
                    </label>

                    <input
                      type="text"
                      value={form.branch}
                      onChange={(event) =>
                        updateField("branch", event.target.value)
                      }
                      placeholder="e.g. Mall Road Kitchen Hub"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6247]"
                    />
                  </div>
                )}

                {/* WELCOME EMAIL */}

                {!editingUser && (
                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        checked={form.sendWelcome}
                        onChange={(event) =>
                          updateField("sendWelcome", event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 accent-[#ff6247]"
                      />

                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          Send welcome email
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          The system will generate a temporary password and send
                          it to the member.
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* BUTTONS */}

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setShowMemberModal(false);
                    setEditingUser(null);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ff6247] px-5 text-sm font-semibold text-white hover:bg-[#ef533a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}

                  {editingUser ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UsersStaff;
