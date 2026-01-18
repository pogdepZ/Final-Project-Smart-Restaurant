import axios from "axios";
import { logout, setCredentials } from "./slices/authSlice";
import { startLoading, completeLoading } from "../context/LoadingBarContext";

let accessToken = null;

let store;

export const injectStore = (_store) => {
  store = _store;
  console.log("Store injected into axiosClient");
};

//setup baseURL và headers chung
const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Thêm interceptor để tự động gắn token vào header Authorization
// và hiển thị loading bar
axiosClient.interceptors.request.use(
  (config) => {
    // Bắt đầu loading bar (trừ khi config.skipLoading = true)
    if (!config.skipLoading) {
      startLoading();
    }

    console.log("Request interceptor called");
    console.log(store);
    if (store) {
      const accessToken = store.getState().auth.accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    completeLoading();
    return Promise.reject(error);
  },
);

// Thêm interceptor để xử lý lỗi 403 và làm mới token tự động
// và hoàn thành loading bar
axiosClient.interceptors.response.use(
  (response) => {
    // Hoàn thành loading bar khi response thành công
    if (!response.config?.skipLoading) {
      completeLoading();
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Hoàn thành loading bar khi có lỗi
    if (!originalRequest?.skipLoading) {
      completeLoading();
    }

    if (!store) return Promise.reject(error);
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        // Bắt đầu loading lại cho refresh request
        if (!originalRequest.skipLoading) {
          startLoading();
        }
        const result = await axiosClient.post("/auth/refresh", {}, {
          skipLoading: true,
        });
        const newAccessToken = result.accessToken;
        const user = result.user;
        store.dispatch(
          setCredentials({ accessToken: newAccessToken, user: user }),
        );
        axiosClient.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
