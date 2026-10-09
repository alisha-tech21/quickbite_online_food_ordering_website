import axiosClient from "./axiosClient";

// Public read-only settings — delivery fee threshold, packaging fee, tax %.
export const getPublicSettingsApi = () =>
  axiosClient.get("/settings").then((r) => r.data);

// Admin: get complete QuickBite settings
export const getAdminSettingsApi = () =>
  axiosClient.get("/admin/settings").then((r) => r.data);

// Admin: update complete QuickBite settings
export const updateAdminSettingsApi = (payload) =>
  axiosClient.put("/admin/settings", payload).then((r) => r.data);
