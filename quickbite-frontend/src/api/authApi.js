import axiosClient from "./axiosClient";

export const registerApi = (payload) =>
  axiosClient.post("/auth/register", payload).then((r) => r.data);
export const verifyOtpApi = (payload) =>
  axiosClient.post("/auth/verify-otp", payload).then((r) => r.data);
export const resendOtpApi = (payload) =>
  axiosClient.post("/auth/resend-otp", payload).then((r) => r.data);
export const loginApi = (payload) =>
  axiosClient.post("/auth/login", payload).then((r) => r.data);
export const forgotPasswordApi = (payload) =>
  axiosClient.post("/auth/forgot-password", payload).then((r) => r.data);
export const resetPasswordApi = (payload) =>
  axiosClient.post("/auth/reset-password", payload).then((r) => r.data);
export const getMeApi = () => axiosClient.get("/auth/me").then((r) => r.data);
