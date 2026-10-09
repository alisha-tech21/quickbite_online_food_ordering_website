import axiosClient from "./axiosClient";

// --------------------------------------------------
// CUSTOMER
// --------------------------------------------------

export const getActiveVouchersApi = () =>
  axiosClient.get("/vouchers/active").then((r) => r.data);

export const applyVoucherApi = (payload) =>
  axiosClient.post("/vouchers/apply", payload).then((r) => r.data);

// --------------------------------------------------
// ADMIN
// --------------------------------------------------

export const getAllVouchersAdminApi = () =>
  axiosClient.get("/admin/vouchers").then((r) => r.data);

export const createVoucherAdminApi = (payload) =>
  axiosClient.post("/admin/vouchers", payload).then((r) => r.data);

export const updateVoucherAdminApi = (id, payload) =>
  axiosClient.put(`/admin/vouchers/${id}`, payload).then((r) => r.data);

export const toggleVoucherActiveAdminApi = (id) =>
  axiosClient.patch(`/admin/vouchers/${id}/toggle-active`).then((r) => r.data);

export const deleteVoucherAdminApi = (id) =>
  axiosClient.delete(`/admin/vouchers/${id}`).then((r) => r.data);
