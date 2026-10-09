import { Routes, Route } from "react-router-dom";

import SignIn from "../pages/auth/SignIn";
import Register from "../pages/auth/Register";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Home from "../pages/customer/Home";
import Restaurants from "../pages/customer/Restaurants";
import RestaurantDetail from "../pages/customer/RestaurantDetail";
import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";
import MyOrders from "../pages/customer/MyOrders";
import Offers from "../pages/customer/Offers";

import Dashboard from "../pages/admin/Dashboard";
import UsersStaff from "../pages/admin/UsersStaff";
import MenuItems from "../pages/admin/MenuItems";
import AdminOrders from "../pages/admin/Orders";
import AdminReviews from "../pages/admin/Reviews";
import AdminSettings from "../pages/admin/Settings";
import AdminOffers from "../pages/admin/Offers";

import NotFound from "../pages/NotFound";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/" element={<Home />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/restaurants/:id" element={<RestaurantDetail />} />
      <Route path="/offers" element={<Offers />} />

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin", "branch_manager"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <UsersStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menu-items"
        element={
          <ProtectedRoute roles={["admin", "branch_manager", "kitchen_staff"]}>
            <MenuItems />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute roles={["admin", "branch_manager", "kitchen_staff"]}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/offers"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminOffers />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
