import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const AdminLayout = ({
  children,
  searchTerm,
  setSearchTerm,
  activePeriod,
  onPeriodChange,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleLogout = () => {
    setShowMobileSidebar(false);

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  const handleNavigate = () => {
    setShowMobileSidebar(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-900">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[225px] border-r border-slate-100 bg-white lg:flex lg:flex-col">
        <AdminSidebar
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* MOBILE SIDEBAR */}
      {showMobileSidebar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-white shadow-2xl lg:hidden">
            <AdminSidebar
              user={user}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          </aside>
        </>
      )}

      {/* MAIN */}
      <main className="min-w-0 lg:ml-[225px]">
        <AdminTopbar
          user={user}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activePeriod={activePeriod}
          onPeriodChange={onPeriodChange}
          onOpenMobileSidebar={() => setShowMobileSidebar(true)}
          onLogout={handleLogout}
        />

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
