import React from "react";
import { X, ReceiptText } from "lucide-react";
import { formatVND } from "../../../utils/adminFormat";
import ScrollArea from "../../../Components/ScrollArea";

const STATUS_META = {
  received: {
    label: "Chờ xử lý",
    className: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  },
  preparing: {
    label: "Đang chuẩn bị",
    className: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  },
  ready: {
    label: "Sẵn sàng",
    className: "bg-green-500/10 text-green-300 border-green-500/20",
  },
  completed: {
    label: "Hoàn tất",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  rejected: {
    label: "Đã hủy",
    className: "bg-red-500/10 text-red-300 border-red-500/20",
  },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || {
    label: status || "—",
    className: "bg-white/5 text-gray-200 border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-100 font-semibold text-right">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function OrderDetailModal({
  open,
  order,
  loading = false,
  error = "",
  onClose,
}) {
  if (!open) return null;

  const items = order?.items ?? [];

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden">
          {/* header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ReceiptText className="text-orange-500" size={18} />
              </div>
              <div>
                <div className="text-white font-black leading-tight">
                  Chi tiết đơn{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                    {order?.code ?? "—"}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Xem thông tin & danh sách món trong order
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
              type="button"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* content states */}
          {loading ? (
            <div className="p-10 text-center">
              <div className="text-white font-bold">Đang tải chi tiết đơn...</div>
              <div className="text-gray-400 text-sm mt-1">Vui lòng chờ</div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
                {error}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  type="button"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* body */
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* left: meta */}
              <div className="lg:col-span-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white font-bold">Thông tin đơn</div>
                  <StatusPill status={order?.status} />
                </div>

                <div className="mt-3 divide-y divide-white/10">
                  <InfoRow label="Mã đơn" value={order?.code} />
                  <InfoRow label="Bàn" value={order?.tableName} />
                  <InfoRow label="Tạo lúc" value={formatDateTime(order?.createdAt)} />
                  <InfoRow
                    label="Cập nhật"
                    value={order?.updatedAt ? formatDateTime(order?.updatedAt) : "—"}
                  />
                  <InfoRow label="Số items" value={order?.totalItems} />
                  <InfoRow
                    label="Tổng tiền"
                    value={
                      typeof order?.totalAmount === "number"
                        ? formatVND(order.totalAmount)
                        : "—"
                    }
                  />
                  <InfoRow label="Thanh toán" value={order?.paymentMethod} />
                  <InfoRow label="Ghi chú" value={order?.note || "—"} />
                </div>
              </div>

              {/* right: items */}
              <div className="lg:col-span-7 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="text-white font-bold">Danh sách món</div>
                  <div className="text-xs text-gray-400">{items.length} món</div>
                </div>

                <ScrollArea>
                  <div className="max-h-105 overflow-auto">
                    {items.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="text-white font-bold">Chưa có item</div>
                        <div className="text-gray-400 text-sm mt-1">
                          API chưa trả về items hoặc order này không có món.
                        </div>
                      </div>
                    ) : (
                      <table className="w-full min-w-50">
                        <thead className="bg-neutral-950/60 border-b border-white/10">
                          <tr className="text-left text-xs text-gray-400">
                            <th className="py-3 pl-4 pr-3 w-[60%]">Món</th>
                            <th className="py-3 px-3 w-[12%]">Số lượng</th>
                          </tr>
                        </thead>

                        <tbody>
                          {items.map((it, idx) => {
                            const key = it.id ?? `${order?.id}-item-${idx}`;
                            const total =
                              typeof it.totalPrice === "number"
                                ? it.totalPrice
                                : typeof it.unitPrice === "number" && typeof it.quantity === "number"
                                  ? it.unitPrice * it.quantity
                                  : null;

                            return (
                              <React.Fragment key={key}>
                                {/* Row 1: tên món + qty */}
                                <tr className="border-b border-white/5">
                                  <td className="py-3 pl-4 pr-3 align-top">
                                    <div className="text-gray-100 font-semibold">
                                      {it.name ?? "—"}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {/* Note */}
                                      {it.note ? (
                                        <div className="text-xs text-gray-500 mt-1">Note: {it.note}</div>
                                      ) : null}

                                      {/* Modifiers */}
                                      {Array.isArray(it.modifiers) && it.modifiers.length > 0 ? (
                                        <div className="mt-2 space-y-1">
                                          <div className="text-xs text-gray-400 font-semibold">Modifiers đã chọn:</div>

                                          <div className="flex flex-wrap gap-2">
                                            {it.modifiers.map((m, mi) => {
                                              const mKey = m.id ?? `${key}-m-${mi}`;
                                              const price = typeof m.price === "number" ? m.price : Number(m.price || 0);

                                              return (
                                                <span
                                                  key={mKey}
                                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-200"
                                                >
                                                  <span className="font-semibold">{m.modifier_name || "—"}</span>
                                                  {price > 0 ? <span className="text-orange-300">+{formatVND(price)}</span> : null}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-600 mt-2">Không có modifiers</div>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 align-top text-center">
                                    <div className="text-gray-200 font-bold">
                                      {it.quantity ?? "—"}
                                    </div>
                                  </td>
                                </tr>

                                {/* Row 2: giá */}
                                <tr className="border-b border-white/50 bg-white/3 text-right">
                                  <td colSpan={3} className="py-2 pl-4 pr-4">
                                    <div className="text-sm text-gray-400 font-bold">
                                      {typeof it.unitPrice === "number" && typeof it.quantity === "number"
                                        ? `Giá: ${formatVND(total)}`
                                        : "Giá: —"}
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}

                        </tbody>
                      </table>
                    )}
                  </div>
                </ScrollArea>

                <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                    type="button"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
