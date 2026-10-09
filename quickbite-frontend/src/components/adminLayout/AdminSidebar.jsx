import React from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  TicketPercent,
  Star,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const SidebarItem = ({ to, icon: Icon, children, active = false, onClick }) => {
  const content = (
    <div
      className={`flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
        active
          ? "bg-[#f4dfd2] text-[#65453a]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon size={19} />
      {children}
    </div>
  );

  // Navigation item
  if (to) {
    return (
      <Link to={to} onClick={onClick} className="block w-full">
        {content}
      </Link>
    );
  }

  // Action item like Logout
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
};

const AdminSidebar = ({ user, onLogout, onNavigate }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* LOGO */}
      <div className="flex h-[82px] items-center gap-3 border-b border-slate-50 px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6247] text-white shadow-sm">
          <UtensilsCrossed size={21} />
        </div>

        <div>
          <p className="text-base font-extrabold leading-none text-slate-900">
            QuickBite
          </p>

          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#8b6659]">
            Admin Portal
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        <SidebarItem
          to="/admin"
          icon={LayoutDashboard}
          active={isActive("/admin")}
          onClick={onNavigate}
        >
          Dashboard
        </SidebarItem>

        <SidebarItem
          to="/admin/menu-items"
          icon={UtensilsCrossed}
          active={isActive("/admin/menu-items")}
          onClick={onNavigate}
        >
          Menu Items
        </SidebarItem>

        <SidebarItem
          to="/admin/orders"
          icon={ClipboardList}
          active={isActive("/admin/orders")}
          onClick={onNavigate}
        >
          Orders
        </SidebarItem>

        <SidebarItem
          to="/admin/reviews"
          icon={Star}
          active={isActive("/admin/reviews")}
          onClick={onNavigate}
        >
          Reviews
        </SidebarItem>

        {user?.role === "admin" && (
          <SidebarItem
            to="/admin/offers"
            icon={TicketPercent}
            active={isActive("/admin/offers")}
            onClick={onNavigate}
          >
            Offers & Vouchers
          </SidebarItem>
        )}

        {user?.role === "admin" && (
          <SidebarItem
            to="/admin/users"
            icon={Users}
            active={isActive("/admin/users")}
            onClick={onNavigate}
          >
            Users & Staff
          </SidebarItem>
        )}
      </nav>

      {/* BOTTOM */}
      <div className="space-y-2 border-t border-slate-50 px-4 py-6">
        {user?.role === "admin" && (
          <SidebarItem
            to="/admin/settings"
            icon={Settings}
            active={isActive("/admin/settings")}
            onClick={onNavigate}
          >
            Settings
          </SidebarItem>
        )}

        <SidebarItem icon={LogOut} onClick={onLogout}>
          Log Out
        </SidebarItem>
      </div>
    </>
  );
};

export default AdminSidebar;
