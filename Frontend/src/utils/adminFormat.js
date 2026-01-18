export function formatVND(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + "₫";
}

export function formatInt(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0);
}

// Format VND không có ký hiệu (dùng khi cần ghép chuỗi)
export function formatVNDNumber(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0);
}
