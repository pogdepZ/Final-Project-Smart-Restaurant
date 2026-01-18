export function calcTotal(order) {
  return (order?.items || []).reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0);
}

export function formatMoneyVND(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + "₫";
}

export function formatTime(timestamp) {
  if (!timestamp) return "—";
  
  const date = new Date(timestamp);
  
  return date.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
}
