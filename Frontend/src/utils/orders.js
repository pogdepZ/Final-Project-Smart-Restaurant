export function calcTotal(order) {
  return (order?.items || []).reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0);
}

export function formatMoneyVND(v) {
  return new Intl.NumberFormat("vi-VN").format(v || 0) + "₫";
}

export function formatTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${hh}:${mm} • ${dd}/${mo}`;
}
