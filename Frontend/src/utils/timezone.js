// Utility để xử lý timezone cho Frontend

/**
 * Format timestamp từ DB sang giờ Việt Nam
 * @param {string|Date} timestamp - Timestamp từ database (UTC hoặc có timezone)
 * @param {object} options - Tùy chọn format
 * @returns {string} - Chuỗi đã format theo giờ VN
 */
export function formatVNTime(timestamp, options = {}) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  const defaultOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
    ...options,
  };

  return date.toLocaleString("vi-VN", defaultOptions);
}

/**
 * Format chỉ ngày (không có giờ)
 */
export function formatVNDate(timestamp) {
  return formatVNTime(timestamp, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format chỉ giờ:phút
 */
export function formatVNTimeOnly(timestamp) {
  return formatVNTime(timestamp, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format đầy đủ ngày giờ
 */
export function formatVNDateTime(timestamp) {
  return formatVNTime(timestamp, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Lấy thời gian hiện tại theo VN timezone
 */
export function nowVN() {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
}
