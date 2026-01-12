import React, { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCcw,
  Calendar,
  Tag,
} from "lucide-react";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import { formatVND } from "../../utils/adminFormat";
import OrderDetailModal from "../../Components/AdminOrderDetailModal";
import { useAdminOrderDetail } from "../../hooks/useAdminOrderDetail";

// ----- helpers -----
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
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-500/10 text-red-300 border-red-500/20",
  },
};

function safeLower(s) {
  return (s ?? "").toString().toLowerCase();
}

function parseYmdToLocalDate(ymd) {
  // input: "2026-01-12" -> Date at local midnight
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function startOfDay(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  // yyyy-mm-dd hh:mm
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

// ----- UI bits -----
function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status || "—", className: "bg-white/5 text-gray-200 border-white/10" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function SkeletonRow({ i }) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-3">
        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-16 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 pl-3 text-right">
        <div className="ml-auto h-4 w-24 bg-white/5 rounded animate-pulse" />
      </td>
    </tr>
  );
}

export default function OrderManagement() {
  const { data, isLoading, error, refetch } = useAdminOrders();

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState(""); // yyyy-mm-dd

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const {
    order: orderDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useAdminOrderDetail(selectedOrderId, !!selectedOrderId);

  const orders = data?.orders ?? [];

  const filtered = useMemo(() => {
    const query = safeLower(q).trim();

    const from = startOfDay(parseYmdToLocalDate(fromDate));
    const to = endOfDay(parseYmdToLocalDate(toDate));

    return orders
      .filter((o) => {
        // search by code
        if (!query) return true;
        return safeLower(o.code).includes(query);
      })
      .filter((o) => {
        // status filter
        if (status === "ALL") return true;
        return o.status === status;
      })
      .filter((o) => {
        // date range filter by createdAt
        if (!from && !to) return true;
        const t = new Date(o.createdAt).getTime();
        if (from && t < from.getTime()) return false;
        if (to && t > to.getTime()) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, q, status, fromDate, toDate]);

  const total = filtered.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <ClipboardList className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Order Management
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Quản lý{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              đơn hàng
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tìm theo mã • Lọc theo ngày • Lọc theo trạng thái
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
            Tổng: <span className="text-white font-bold">{isLoading ? "—" : total}</span> đơn
          </div>

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
            type="button"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
          {typeof error === "string" ? error : "Có lỗi khi tải danh sách order."}
        </div>
      ) : null}

      {/* Filters */}
      <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-full">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Filter className="text-orange-500" size={18} />
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="md:col-span-4">
                <label className="text-xs text-gray-400 mb-1 block">Tìm theo mã</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="VD: ORD-20260112-0008"
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-1">
                <label className="text-xs text-gray-400 mb-1 block">Trạng thái</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="received">Chờ xử lý</option>
                    <option value="preparing">Đang chuẩn bị</option>
                    <option value="ready">Sẵn sàng</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>

                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="mt-3 text-xs text-gray-400">
              Hiển thị <span className="text-white font-bold">{isLoading ? "—" : total}</span> /{" "}
              <span className="text-white font-bold">{isLoading ? "—" : orders.length}</span> đơn
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">Danh sách order</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-205">
            <thead className="bg-neutral-950/60 border-b border-white/10">
              <tr className="text-left text-xs text-gray-400">
                <th className="py-3 pr-3 pl-4 w-55">Mã / Bàn</th>
                <th className="py-3 px-3 w-55">Thời gian</th>
                <th className="py-3 px-3 w-40">Trạng thái</th>
                <th className="py-3 px-3 w-30">Items</th>
                <th className="py-3 pl-3 pr-4 text-right w-35">Tổng tiền</th>
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} i={i} />)
                : filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)} // ✅ click mở modal
                    className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                    title="Click để xem chi tiết"
                  >
                    <td className="py-3 pr-3 pl-4 align-top">
                      <div className="text-white font-bold">{o.code}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Bàn: <span className="text-gray-200 font-semibold">{o.tableName ?? "—"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="text-sm text-gray-200">{formatDateTime(o.createdAt)}</div>
                      {o.updatedAt ? (
                        <div className="text-xs text-gray-500 mt-1">
                          Update: {formatDateTime(o.updatedAt)}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-3 align-top">
                      <StatusPill status={o.status} />
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="text-sm text-gray-200 font-semibold">{o.totalItems ?? "—"}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {o.note ? `Note: ${o.note}` : "—"}
                      </div>
                    </td>

                    <td className="py-3 pl-3 pr-4 align-top text-right">
                      <div className="text-white font-bold">
                        {typeof o.totalAmount === "number" ? formatVND(o.totalAmount) : "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {o.paymentMethod ? `Pay: ${o.paymentMethod}` : "—"}
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="text-white font-bold">Không có đơn phù hợp</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Thử đổi trạng thái hoặc khoảng ngày, hoặc kiểm tra mã đơn.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {/* ✅ Modal */}
        <OrderDetailModal
          open={!!selectedOrderId}
          order={orderDetail}
          loading={isDetailLoading}
          error={detailError}
          onClose={() => setSelectedOrderId(null)}
        />
      </div>

      {/* Tip */}
      <div className="mt-6 p-5 rounded-2xl bg-neutral-900/60 border border-white/10">
        <div className="text-white font-bold">Gợi ý nối backend</div>
        <p className="text-gray-400 text-sm mt-1">
          Hook <code className="px-1 py-0.5 rounded bg-black/30 border border-white/10">useAdminOrders</code> chỉ cần trả
          về <b>orders</b> với các field: <b>id, code, status, createdAt, updatedAt, tableName, totalItems, totalAmount</b>.
          Sau đó UI tự search/filter/sort.
        </p>
      </div>
    </div>
  );
}
