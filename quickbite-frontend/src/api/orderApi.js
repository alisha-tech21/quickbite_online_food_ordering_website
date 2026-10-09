import axiosClient from "./axiosClient";

// ---------------------------------------------------------
// CREATE MULTI-RESTAURANT CHECKOUT
// ---------------------------------------------------------
export const createCheckoutApi = (payload) =>
  axiosClient.post("/orders/checkout", payload).then((r) => r.data);

// ---------------------------------------------------------
// CREATE ORDER - BACKWARD COMPATIBILITY
// ---------------------------------------------------------
export const createOrderApi = (payload) =>
  axiosClient.post("/orders", payload).then((r) => r.data);

// ---------------------------------------------------------
// GET CUSTOMER ORDERS
// ---------------------------------------------------------
export const getMyOrdersApi = (tab = "all") =>
  axiosClient
    .get("/orders/mine", {
      params: { tab },
    })
    .then((r) => r.data);

// ---------------------------------------------------------
// GET SINGLE ORDER
// ---------------------------------------------------------
export const getOrderByIdApi = (id) =>
  axiosClient.get(`/orders/${id}`).then((r) => r.data);

// ---------------------------------------------------------
// CANCEL ORDER
// ---------------------------------------------------------
export const cancelOrderApi = (id, reason) =>
  axiosClient.patch(`/orders/${id}/cancel`, { reason }).then((r) => r.data);

// ---------------------------------------------------------
// RATE / REVIEW ORDER
// ---------------------------------------------------------
export const rateOrderApi = (id, payload) =>
  axiosClient.post(`/orders/${id}/review`, payload).then((r) => r.data);

// =========================================================
// ADMIN ORDERS
// =========================================================

// ---------------------------------------------------------
// GET ALL ORDERS
// GET /api/admin/orders
// ---------------------------------------------------------
export const getAdminOrdersApi = (params = {}) =>
  axiosClient
    .get("/admin/orders", {
      params,
    })
    .then((r) => r.data);

// ---------------------------------------------------------
// UPDATE ORDER STATUS
// PATCH /api/admin/orders/:id/status
// ---------------------------------------------------------
export const updateAdminOrderStatusApi = (id, payload) =>
  axiosClient.patch(`/admin/orders/${id}/status`, payload).then((r) => r.data);
