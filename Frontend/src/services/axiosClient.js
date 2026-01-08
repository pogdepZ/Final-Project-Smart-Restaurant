// client/src/api/axiosClient.js
import axios from "axios";

// Cấu hình URL cơ sở
// Nếu bạn deploy, chỉ cần sửa biến môi trường VITE_API_URL là xong
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // paramsSerializer giúp xử lý các tham số trên URL tốt hơn (tùy chọn)
});

// --- 1. REQUEST INTERCEPTOR (Xử lý trước khi gửi đi) ---
axiosClient.interceptors.request.use(
  async (config) => {
    // Lấy token từ LocalStorage
    const token = localStorage.getItem("token");

    // Nếu có token, gắn vào Header "Authorization"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Nếu gửi Form Data (Upload ảnh), xóa Content-Type để trình duyệt tự set
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 2. RESPONSE INTERCEPTOR (Xử lý khi nhận phản hồi) ---
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về toàn bộ response (gồm data, status, headers...)
    return response;
  },
  (error) => {
    const { response } = error;

    // Xử lý lỗi 401 (Unauthorized - Hết hạn token hoặc Token đểu)
    if (response && response.status === 401) {
      // Chỉ logout nếu không phải đang ở trang login (tránh lặp vô tận)
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Đá về trang login
        window.location.href = "/login";
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
      }
    }

    // Ném lỗi ra để component (ví dụ: Login Page) tự xử lý hiển thị thông báo riêng
    return Promise.reject(error);
  }
);

export default axiosClient;
