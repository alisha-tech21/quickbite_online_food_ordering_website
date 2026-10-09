import axiosClient from "./axiosClient";

export const getRestaurantsApi = (params) =>
  axiosClient.get("/restaurants", { params }).then((r) => r.data);

export const getRestaurantByIdApi = (id) =>
  axiosClient.get(`/restaurants/${id}`).then((r) => r.data);

export const getRestaurantReviewsApi = (id) =>
  axiosClient.get(`/restaurants/${id}/reviews`).then((r) => r.data);

// Admin restaurant APIs
export const createRestaurantApi = (data) =>
  axiosClient.post("/admin/restaurants", data).then((r) => r.data);

export const updateRestaurantApi = (id, data) =>
  axiosClient.put(`/admin/restaurants/${id}`, data).then((r) => r.data);

export const toggleRestaurantActiveApi = (id) =>
  axiosClient
    .patch(`/admin/restaurants/${id}/toggle-active`)
    .then((r) => r.data);

export const deleteRestaurantApi = (id) =>
  axiosClient.delete(`/admin/restaurants/${id}`).then((r) => r.data);
