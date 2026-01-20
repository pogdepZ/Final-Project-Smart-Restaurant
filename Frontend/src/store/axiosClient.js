// src/store/axiosClient.js (đổi path cho đúng project bạn)
import axios from "axios";
import { logout, setCredentials } from "./slices/authSlice";
import { startLoading, completeLoading } from "../context/LoadingBarContext";

let store;

export const injectStore = (_store) => {
  store = _store;
  console.log("Store injected into axiosClient");
};

// setup baseURL và headers chung
const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_APP_BASE_URL}/api` || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ===== Request interceptor: gắn token + loading =====
axiosClient.interceptors.request.use(
  (config) => {
    if (!config.skipLoading) startLoading();

    if (store) {
      const token = store.getState().auth.accessToken;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    completeLoading();
    return Promise.reject(error);
  }
);

// ===== Response interceptor: unwrap data + refresh token khi 401 =====
let isRefreshing = false;
let refreshPromise = null;

axiosClient.interceptors.response.use(
  (response) => {
    if (!response.config?.skipLoading) completeLoading();
    return response.data;
  },
  async (error) => {
    const originalRequest = error?.config;

    if (!originalRequest?.skipLoading) completeLoading();
    if (!store || !originalRequest) return Promise.reject(error);

    const status = error?.response?.status;

    // Chỉ refresh khi 401 và KHÔNG phải các endpoint auth sau
    const shouldTryRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register");

    if (!shouldTryRefresh) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      // Nếu đang refresh rồi, các request khác chờ refreshPromise
      if (isRefreshing && refreshPromise) {
        const result = await refreshPromise; // interceptor trả response.data
        const newAccessToken = result?.accessToken;

        if (!newAccessToken) return Promise.reject(error);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry nhưng KHÔNG nhảy loading bar lần nữa
        return axiosClient({ ...originalRequest, skipLoading: true });
      }

      // Bắt đầu refresh mới
      isRefreshing = true;
      refreshPromise = axiosClient.post("/auth/refresh", {}, { skipLoading: true });

      const result = await refreshPromise;
      const newAccessToken = result?.accessToken;
      const user = result?.user;

      if (!newAccessToken) return Promise.reject(error);

      // Cập nhật Redux/localStorage
      store.dispatch(setCredentials({ accessToken: newAccessToken, user }));

      // Set mặc định cho các request sau
      axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      // Retry request hiện tại (skipLoading để tránh nháy/kẹt bar)
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return axiosClient({ ...originalRequest, skipLoading: true });
    } catch (refreshError) {
      const st = refreshError?.response?.status;
      const url = refreshError?.config?.url || "";

      // CHỈ logout khi refresh endpoint báo refresh token invalid/hết hạn
      if (url.includes("/auth/refresh") && (st === 401 || st === 403)) {
        store.dispatch(logout());
      }

      // Network/timeout/5xx: không logout
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }
);

export default axiosClient;
