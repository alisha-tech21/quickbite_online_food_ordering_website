import axiosClient from "./axiosClient";

// =========================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard?range=today|week|month|all
// =========================================================

export const getAdminDashboardApi = (range = "today") =>
  axiosClient
    .get("/admin/dashboard", {
      params: { range },
    })
    .then((response) => response.data);
