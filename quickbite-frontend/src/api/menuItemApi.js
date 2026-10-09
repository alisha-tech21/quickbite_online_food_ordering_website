import axiosClient from "./axiosClient";

// =====================================================
// USER SIDE
// =====================================================

export const getMenuItemsApi = (params = {}) =>
  axiosClient.get("/menu-items", { params }).then((r) => r.data);

export const getMenuCategoriesApi = () =>
  axiosClient.get("/menu-items/categories").then((r) => r.data);

export const getPopularMenuItemsApi = (limit = 4) =>
  axiosClient
    .get("/menu-items/popular", {
      params: { limit },
    })
    .then((r) => r.data);

export const getBestSellerMenuItemsApi = (limit = 4) =>
  axiosClient
    .get("/menu-items/best-sellers", {
      params: { limit },
    })
    .then((r) => r.data);
// =====================================================
// ADMIN SIDE
// =====================================================

export const getAdminMenuItemsApi = (params = {}) =>
  axiosClient.get("/admin/menu-items", { params }).then((r) => r.data);

export const createMenuItemApi = (data) =>
  axiosClient.post("/admin/menu-items", data).then((r) => r.data);

export const updateMenuItemApi = (id, data) =>
  axiosClient.put(`/admin/menu-items/${id}`, data).then((r) => r.data);

export const toggleMenuItemAvailabilityApi = (id) =>
  axiosClient.patch(`/admin/menu-items/${id}/availability`).then((r) => r.data);

export const deleteMenuItemApi = (id) =>
  axiosClient.delete(`/admin/menu-items/${id}`).then((r) => r.data);
