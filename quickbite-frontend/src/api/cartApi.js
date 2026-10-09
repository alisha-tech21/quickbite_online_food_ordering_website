import axiosClient from "./axiosClient";

export const getCartApi = () => axiosClient.get("/cart").then((r) => r.data);

export const addToCartApi = (payload) =>
  axiosClient.post("/cart/items", payload).then((r) => r.data);

export const updateCartItemApi = (menuItemId, quantity) =>
  axiosClient
    .patch(`/cart/items/${menuItemId}`, { quantity })
    .then((r) => r.data);

export const removeCartItemApi = (menuItemId) =>
  axiosClient.delete(`/cart/items/${menuItemId}`).then((r) => r.data);

export const clearCartApi = () =>
  axiosClient.delete("/cart").then((r) => r.data);
