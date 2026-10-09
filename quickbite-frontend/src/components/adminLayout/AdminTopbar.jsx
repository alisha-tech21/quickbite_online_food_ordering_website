import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Smartphone,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PERIOD_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const getInitials = (name = "Admin") => {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A"
  );
};

const AdminTopbar = ({
  user,
  searchTerm,
  setSearchTerm,
  activePeriod,
  onPeriodChange,
  onOpenMobileSidebar,
  onLogout,
}) => {
  const navigate = useNavigate();

  const profileRef = useRef(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const displayName = user?.fullName || user?.name || user?.username || "Admin";

  const roleLabel =
    user?.role === "admin"
      ? "Super Admin"
      : user?.role === "branch_manager"
        ? "Branch Manager"
        : user?.role === "kitchen_staff"
          ? "Kitchen Staff"
          : user?.role === "rider"
            ? "Rider"
            : user?.role || "Admin";

  const profileEmail = user?.email || "Email not available";
  const profilePhone = user?.phone || "Phone not available";

  const handleLogout = () => {
    setShowAdminMenu(false);
    onLogout?.();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="flex min-h-[82px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-8 xl:px-10">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-400 md:flex">
            <span>QuickBite</span>
            <span>›</span>
            <span>Portal</span>
            <span>›</span>
            <span className="font-semibold text-[#ff6247]">
              Live Operations
            </span>
          </div>

          <div className="relative min-w-0 flex-1 md:hidden">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders..."
              className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-50"
            />
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative hidden flex-1 md:block md:max-w-[440px]">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders, dishes, customers..."
            className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-50"
          />
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          {/* PERIOD */}
          <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-100 p-1 sm:flex">
            {PERIOD_OPTIONS.map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => onPeriodChange(period.id)}
                className={`rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                  activePeriod === period.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* MOBILE PERIOD */}
          <select
            value={activePeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none sm:hidden"
          >
            {PERIOD_OPTIONS.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>

          {/* KITCHEN LIVE */}
          <div className="hidden items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-2.5 text-xs font-bold text-emerald-700 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Kitchen Live
          </div>

          {/* NOTIFICATION */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50"
          >
            <Bell size={19} />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff6247]" />
          </button>

          {/* ADMIN PROFILE */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setShowAdminMenu((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
            >
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-800">
                  {displayName}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">{roleLabel}</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xs font-extrabold text-orange-600">
                {getInitials(displayName)}
              </div>

              <ChevronDown
                size={15}
                className={`text-slate-400 transition ${
                  showAdminMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* PROFILE DROPDOWN */}
            {showAdminMenu && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* HEADER */}
                <div className="bg-slate-50 px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-base font-extrabold text-orange-600">
                      {getInitials(displayName)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold text-slate-900">
                        {displayName}
                      </p>

                      <p className="mt-1 text-xs font-bold text-orange-500">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="space-y-4 px-6 py-6">
                  <div className="flex items-start gap-3">
                    <UserRound
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Full Name
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {displayName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Smartphone
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {profilePhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                        {profileEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Settings
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Account Role
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="border-t border-slate-100 p-3">
                  {user?.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminMenu(false);
                        navigate("/admin/settings");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Settings size={17} />
                      Account Settings
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
