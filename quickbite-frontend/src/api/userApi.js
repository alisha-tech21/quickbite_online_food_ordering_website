import axiosClient from "./axiosClient";

export const updateMyProfileApi = (payload) =>
  axiosClient.put("/users/me", payload).then((r) => r.data);

export const addAddressApi = (payload) =>
  axiosClient.post("/users/me/addresses", payload).then((r) => r.data);

export const updateAddressApi = (addressId, payload) =>
  axiosClient
    .put(`/users/me/addresses/${addressId}`, payload)
    .then((r) => r.data);

export const deleteAddressApi = (addressId) =>
  axiosClient.delete(`/users/me/addresses/${addressId}`).then((r) => r.data);

// =========================================================
// ADMIN — USERS & STAFF MANAGEMENT
// =========================================================

// GET /api/admin/users
export const getAdminUsersApi = (params = {}) =>
  axiosClient
    .get("/admin/users", {
      params,
    })
    .then((r) => r.data);

// GET /api/admin/users/stats
export const getAdminUserStatsApi = () =>
  axiosClient.get("/admin/users/stats").then((r) => r.data);

// POST /api/admin/users
export const createAdminMemberApi = (payload) =>
  axiosClient.post("/admin/users", payload).then((r) => r.data);

// PUT /api/admin/users/:id
export const updateAdminMemberApi = (id, payload) =>
  axiosClient.put(`/admin/users/${id}`, payload).then((r) => r.data);

// PATCH /api/admin/users/:id/status
export const updateAdminMemberStatusApi = (id, status) =>
  axiosClient
    .patch(`/admin/users/${id}/status`, { status })
    .then((r) => r.data);

// DELETE /api/admin/users/:id
export const deleteAdminMemberApi = (id) =>
  axiosClient.delete(`/admin/users/${id}`).then((r) => r.data);
