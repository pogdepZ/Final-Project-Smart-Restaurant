export function formatVND(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + "₫";
}

export function formatInt(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0);
}
