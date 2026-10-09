import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

const navLinkClass = (isActive) =>
  `transition-colors ${
    isActive
      ? "text-brand-500 font-bold pb-0.5 border-b-2 border-brand-500"
      : "text-slate-600 hover:text-brand-500"
  }`;

// Delivery hub list — cosmetic for now (the backend doesn't have a hubs
// endpoint yet). If you add one later, replace this with a real fetch.
const LOCATIONS = [
  { name: "Gulberg III, Lahore", time: "25m" },
  { name: "DHA Phase 5, Lahore", time: "30m" },
  { name: "Clifton Block 4, Karachi", time: "20m" },
  { name: "F-7/2, Islamabad", time: "28m" },
];

// Turns "Sara Tariq" into "ST" for the avatar circle.
const getInitials = (fullName = "") =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const {
    cartCount: itemCount,
    cartSubtotal: totalAmount,
    resetLocalCart,
  } = useCart();

  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("Gulberg III, Lahore");

  const locDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locDropdownRef.current &&
        !locDropdownRef.current.contains(event.target)
      ) {
        setIsLocDropdownOpen(false);
      }

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    logout();
    resetLocalCart();
    setIsProfileDropdownOpen(false);
    navigate("/login");
  };

  // Real order count from the backend (User.totalOrders).
  const ordersPlaced = user?.totalOrders ?? 0;
  const tierLabel = ordersPlaced >= 10 ? "VIP Foodie" : "Foodie";

  // Only admins should see the Admin Dashboard option.
  const isAdmin = user?.role === "admin";

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="h-20 max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between gap-4">
          {/* Brand Logo & Mobile Menu Button */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Open Menu"
              type="button"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Logo />

            {/* Location Dropdown Selector */}
            <div className="relative hidden sm:block" ref={locDropdownRef}>
              <button
                onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-full border border-slate-200 transition-all text-left focus:outline-none"
                type="button"
              >
                <svg
                  className="w-4 h-4 text-brand-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>

                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                    Deliver to
                  </span>

                  <span className="font-sans font-bold text-xs text-slate-800 leading-tight">
                    {currentLocation}
                  </span>
                </div>

                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isLocDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isLocDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Hub
                  </div>

                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setCurrentLocation(loc.name);
                        setIsLocDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                      type="button"
                    >
                      <span>{loc.name}</span>

                      <span className="text-[10px] bg-red-50 text-brand-600 px-1.5 py-0.5 rounded-full font-bold">
                        {loc.time}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8 font-sans font-semibold text-sm">
            <Link className={navLinkClass(pathname === "/")} to="/">
              Home
            </Link>

            <Link
              className={navLinkClass(pathname === "/restaurants")}
              to="/restaurants"
            >
              Restaurants
            </Link>

            <Link className={navLinkClass(pathname === "/offers")} to="/offers">
              Offers
            </Link>

            {user && (
              <Link
                className={navLinkClass(pathname === "/my-orders")}
                to="/my-orders"
              >
                My Orders
              </Link>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Cart */}
            <button
              onClick={() => navigate("/cart")}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 sm:px-4 py-2 rounded-full transition-all text-slate-800 font-sans font-semibold text-xs cursor-pointer"
              type="button"
            >
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>

              <span className="hidden xs:inline">
                Rs. {totalAmount.toLocaleString()}
              </span>

              <span className="bg-brand-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            </button>

            {/* Profile */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center gap-2 pl-1 cursor-pointer group focus:outline-none"
                  type="button"
                >
                  <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-brand-100 text-brand-600 font-bold text-xs ring-2 ring-brand-200">
                    {getInitials(user.fullName)}
                  </div>

                  <div className="hidden xl:flex flex-col text-left">
                    <span className="font-sans font-bold text-xs text-slate-800 leading-tight">
                      {user.fullName?.split(" ")[0]}{" "}
                      {user.fullName?.split(" ")[1]?.[0]}.
                    </span>

                    <span className="text-[10px] font-semibold text-brand-500 leading-none">
                      {tierLabel}
                    </span>
                  </div>

                  <svg
                    className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50">
                    {/* User Information */}
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-800">
                        {user.fullName}
                      </p>

                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>

                    {/* ADMIN DASHBOARD */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                          pathname === "/admin"
                            ? "bg-brand-50 text-brand-600"
                            : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/my-orders"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Orders &amp; Reorder
                    </Link>

                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700">
                      {ordersPlaced} order
                      {ordersPlaced === 1 ? "" : "s"} placed
                    </div>

                    <Link
                      to="/my-orders"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Saved Places
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 p-6 overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <span className="font-sans text-lg font-black tracking-tight text-slate-900 leading-none">
                Quick<span className="text-brand-500">Bite</span>
              </span>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Location */}
            <div className="py-4 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Deliver to Hub
              </span>

              <select
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl p-3 focus:outline-none"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.time})
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-2 py-6 font-sans font-semibold text-sm">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl transition-colors ${
                  pathname === "/"
                    ? "bg-brand-50 text-brand-600 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Home
              </Link>

              <Link
                to="/restaurants"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl transition-colors ${
                  pathname === "/restaurants"
                    ? "bg-brand-50 text-brand-600 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Restaurants
              </Link>

              <Link
                to="/offers"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-xl transition-colors ${
                  pathname === "/offers"
                    ? "bg-brand-50 text-brand-600 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Offers
              </Link>

              {user && (
                <Link
                  to="/my-orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-xl transition-colors ${
                    pathname === "/my-orders"
                      ? "bg-brand-50 text-brand-600 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  My Orders
                </Link>
              )}

              {/* ADMIN DASHBOARD - MOBILE */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-xl transition-colors font-bold ${
                    pathname === "/admin"
                      ? "bg-brand-50 text-brand-600"
                      : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>

            {/* Mobile Bottom Actions */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              {user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                  type="button"
                >
                  Sign Out
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 rounded-xl text-center text-sm font-bold text-slate-700 bg-slate-100"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 rounded-xl text-center text-sm font-bold text-white bg-brand-500"
                  >
                    Register
                  </Link>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center font-medium mt-4">
                QuickBite PK • Fresh &amp; Fast
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
