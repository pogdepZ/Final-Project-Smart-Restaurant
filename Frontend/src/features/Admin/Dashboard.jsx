import React from "react";
import { LayoutDashboard, Users, Table2, Wallet, Star } from "lucide-react";
// import { useAdminDashboardMock } from "../../hooks/useAdminDashboardMock";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import StatCard from "../../Components/StatCard";
import TopListCard from "../../Components/TopListCard";
import { formatInt, formatVND } from "../../utils/adminFormat";

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <LayoutDashboard className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Admin Dashboard
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Tổng quan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Lumière Bistro
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Thống kê nhanh theo tháng + danh sách top món ăn.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
          Dữ liệu hiện tại: <span className="text-white font-bold">API</span>
        </div>
      </div>

      {error ? (
        <div className="mt-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
          {error}
        </div>
      ) : null}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Table2}
          label="Số bàn"
          value={isLoading ? "—" : formatInt(data?.stats?.totalTables)}
          hint="Tổng số bàn đang quản lý"
        />
        <StatCard
          icon={Users}
          label="Người dùng"
          value={isLoading ? "—" : formatInt(data?.stats?.totalUsers)}
          hint="Tổng tài khoản đã đăng ký"
        />
        <StatCard
          icon={Wallet}
          label="Doanh thu tháng"
          value={isLoading ? "—" : formatVND(data?.stats?.revenueThisMonth)}
          hint="Tổng doanh thu trong tháng hiện tại"
        />
      </div>

      {/* Lists */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopListCard
          title="Top 5 món được gọi nhiều nhất"
          subtitle="Tính theo số lần gọi trong tháng"
          badge="Most Ordered"
          columns={[
            { label: "Món ăn", span: 8 },
            { label: "Số lượt", span: 4 },
          ]}
          rows={
            isLoading
              ? skeletonRows("orders")
              : (data?.topOrderedDishes || []).slice(0, 5).map((d) => ({
                key: d.id,
                title: d.name,
                subtitle: d.category,
                value: formatInt(d.orders),
                valueHint: "lượt",
              }))
          }
        />

        <TopListCard
          title="Top 5 món đánh giá cao nhất"
          subtitle="Dựa trên rating trung bình và số lượt review"
          badge="Top Rated"
          columns={[
            { label: "Món ăn", span: 8 },
            { label: "Rating", span: 4 },
          ]}
          rows={
            isLoading
              ? skeletonRows("rating")
              : (data?.topRatedDishes || []).slice(0, 5).map((d) => ({
                key: d.id,
                title: d.name,
                subtitle: d.category,
                value: `${d.rating.toFixed(1)} ★`,
                valueHint: `${formatInt(d.reviews)} reviews`,
              }))
          }
        />
      </div>

      {/* Footer tip */}
      <div className="mt-6 p-5 rounded-2xl bg-neutral-900/60 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Star className="text-orange-500" size={18} />
          </div>
          <div>
            <div className="text-white font-bold">Gợi ý nâng cấp</div>
            <p className="text-gray-400 text-sm mt-1">
              Khi nối backend, bạn chỉ cần thay hook mock bằng call API và map dữ liệu
              sang đúng format đang render (stats + top lists).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function skeletonRows(type) {
  // 5 dòng skeleton để nhìn đỡ trống
  return Array.from({ length: 5 }).map((_, i) => ({
    key: `${type}-${i}`,
    title: "Loading...",
    subtitle: "—",
    value: "—",
    valueHint: "",
  }));
}
