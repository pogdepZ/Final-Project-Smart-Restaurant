import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCcw,
  Tag,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";

import { useAdminOrders } from "../../hooks/useAdminOrders";
import { formatVND } from "../../utils/adminFormat";
import OrderDetailModal from "./components/AdminOrderDetailModal";
import { useAdminOrderDetail } from "../../hooks/useAdminOrderDetail";
import PaginationBar from "../../Components/PaginationBar";

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

function StatusPill({ status }) {
  const meta =
    STATUS_META[status] || {
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
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {/* Mã đơn */}
      <td className="py-3 pr-3 pl-4">
        <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-20 bg-white/5 rounded animate-pulse" />
      </td>

      {/* Thời gian – desktop only */}
      <td className="hidden sm:table-cell py-3 px-3">
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-36 bg-white/5 rounded animate-pulse" />
      </td>

      {/* Trạng thái */}
      <td className="py-3 px-3">
        <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse" />
      </td>

      {/* Items – desktop only */}
      <td className="hidden sm:table-cell py-3 px-3">
        <div className="h-4 w-14 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-28 bg-white/5 rounded animate-pulse" />
      </td>

      {/* Tổng tiền */}
      <td className="py-3 pl-3 pr-4 text-right">
        <div className="ml-auto h-4 w-24 bg-white/5 rounded animate-pulse" />
        <div className="hidden sm:block mt-2 ml-auto h-3 w-20 bg-white/5 rounded animate-pulse" />
      </td>
    </tr>
  );
}


export default function OrderManagement() {
  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState(""); // yyyy-mm-dd

  // paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const resetPage = () => setPage(1);

  // ✅ params gửi lên server
  const params = useMemo(
    () => ({
      q,
      status,
      from: fromDate || "",
      to: toDate || "",
      page,
      limit,
    }),
    [q, status, fromDate, toDate, page, limit]
  );

  const { data, isLoading, error, refetch } = useAdminOrders(params);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const orders = data?.orders ?? [];
  console.log(orders[0]);
  const pagination = data?.pagination ?? { page, limit, total: 0, totalPages: 1 };
  const totalPages = pagination.totalPages || 1;

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const {
    order: orderDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useAdminOrderDetail(selectedOrderId, !!selectedOrderId);

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
            Tìm theo mã • Lọc theo ngày • Lọc theo trạng thái • Pagination
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
            Tổng:{" "}
            <span className="text-white font-bold">
              {isLoading ? "—" : pagination.total}
            </span>{" "}
            đơn
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

      {/* Filters */}
      <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-full">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Filter className="text-orange-500" size={18} />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-15 gap-3">
              {/* Search */}
              <div className="md:col-span-7">
                <label className="text-xs text-gray-400 mb-1 block">Tìm theo mã</label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      resetPage();
                    }}
                    placeholder="Mã Đơn Hàng"
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>

              {/* From */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Từ ngày</label>
                <div className="relative">
                  <Calendar
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      resetPage();
                    }}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl
                 pl-3 pr-10 py-2.5 text-sm text-white
                 focus:outline-none focus:border-orange-500/40 transition
                 hover:border-white/20
                 [color-scheme:dark]
                 [&::-webkit-calendar-picker-indicator]:opacity-0
                 [&::-webkit-calendar-picker-indicator]:absolute
                 [&::-webkit-calendar-picker-indicator]:right-0
                 [&::-webkit-calendar-picker-indicator]:w-10
                 [&::-webkit-calendar-picker-indicator]:h-full
                 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              {/* To */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
                <div className="relative">
                  <Calendar
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      resetPage();
                    }}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl
                 pl-3 pr-10 py-2.5 text-sm text-white
                 focus:outline-none focus:border-orange-500/40 transition
                 hover:border-white/20
                 [color-scheme:dark]
                 [&::-webkit-calendar-picker-indicator]:opacity-0
                 [&::-webkit-calendar-picker-indicator]:absolute
                 [&::-webkit-calendar-picker-indicator]:right-0
                 [&::-webkit-calendar-picker-indicator]:w-10
                 [&::-webkit-calendar-picker-indicator]:h-full
                 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Trạng thái</label>
                <div className="relative">
                  <Tag
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      resetPage();
                    }}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-900 [&>option]:text-white"
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
              Page <span className="text-white font-bold">{pagination.page}</span> /{" "}
              <span className="text-white font-bold">{totalPages}</span> • Hiển thị{" "}
              <span className="text-white font-bold">{orders.length}</span> /{" "}
              <span className="text-white font-bold">{pagination.total}</span> đơn
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
          {/* mobile: không cần min-width lớn */}
          <table className="w-full min-w-0 sm:min-w-225">
            <thead className="bg-neutral-950/60 border-b border-white/10">
              <tr className="text-left text-xs text-gray-400">
                <th className="py-3 pr-3 pl-4 w-[55%] sm:w-40">Mã / Bàn</th>

                {/* Ẩn trên mobile */}
                <th className="hidden sm:table-cell py-3 px-3 w-55">Thời gian</th>

                <th className="py-3 px-3 w-[20%] sm:w-42.5">Trạng thái</th>

                {/* Ẩn trên mobile */}
                <th className="hidden sm:table-cell py-3 px-3 w-35">Items</th>

                <th className="py-3 pl-3 pr-4 text-right w-[25%] sm:w-45">
                  Tổng tiền
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                    title="Click để xem chi tiết"
                  >
                    {/* Mã đơn (mobile chỉ cần id + bàn nhỏ) */}
                    <td className="py-3 pr-3 pl-4 align-top">
                      <div className="text-white font-bold break-all sm:break-normal">
                        {o.id}
                      </div>

                      {/* bàn: vẫn cho hiện, nhưng nhỏ */}
                      <div className="text-xs text-gray-400 mt-1">
                        {o.tableName ?? "—"}
                      </div>
                    </td>

                    {/* Thời gian: desktop mới hiện */}
                    <td className="hidden sm:table-cell py-3 px-3 align-top">
                      <div className="text-sm text-gray-200">
                        {formatDateTime(o.createdAt)}
                      </div>
                      {o.updatedAt ? (
                        <div className="text-xs text-gray-500 mt-1">
                          Update: {formatDateTime(o.updatedAt)}
                        </div>
                      ) : null}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3 align-top">
                      <StatusPill status={o.status} />
                    </td>

                    {/* Items: desktop mới hiện */}
                    <td className="hidden sm:table-cell py-3 px-3 align-top">
                      <div className="text-sm text-gray-200 font-semibold">
                        {o.totalItems ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {o.note ? `Note: ${o.note}` : "—"}
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-3 pl-3 pr-4 align-top text-right">
                      <div className="text-white font-bold">
                        {typeof o.totalAmount === "number" ? formatVND(o.totalAmount) : "—"}
                      </div>

                      {/* Pay: ẩn trên mobile cho gọn */}
                      <div className="hidden sm:block text-xs text-gray-500 mt-1">
                        {o.paymentMethod ? `Pay: ${o.paymentMethod}` : "—"}
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="text-white font-bold">Không có đơn phù hợp</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Thử đổi filter hoặc khoảng ngày, hoặc kiểm tra mã đơn.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>


        {/* ✅ Pagination */}
        <PaginationBar
          page={pagination.page}
          totalPages={totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPrev={() => setPage((p) => Math.max(p - 1, 1))}
          onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
          onChangeLimit={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
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
  );
}
