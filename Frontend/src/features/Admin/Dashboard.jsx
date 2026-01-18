import React, { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Users, Table2, Wallet, Star } from "lucide-react";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import StatCard from "../../Components/StatCard";
import TopListCard from "../../Components/TopListCard";
import { formatInt, formatVND } from "../../utils/adminFormat";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

import { dashboardApi } from "../../services/dashboardApi";
import { toast } from "react-toastify";

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 50%)`;
}

function buildRange(period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const d = (start.getDay() + 6) % 7; // 0=Mon
    start.setDate(start.getDate() - d);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 7);
    end.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
  }

  const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  return { from: start.toISOString(), to: end.toISOString(), month };
}


export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  const today = new Date().toLocaleDateString("vi-VN");

  const PERIODS = [
    { value: "day", label: "Ngày" },
    { value: "week", label: "Tuần" },
    { value: "month", label: "Tháng" },
  ];

  const DarkTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-xl bg-neutral-900/95 border border-white/10 shadow-xl">
          <div className="text-white text-sm font-bold">
            {label}h
          </div>
          <div className="text-orange-300 text-xs mt-0.5">
            {payload[0].value} đơn
          </div>
        </div>
      );
    }
    return null;
  };

  // ✅ period riêng
  const [revenuePeriod, setRevenuePeriod] = useState("month");
  const [ordersDailyPeriod, setOrdersDailyPeriod] = useState("month");
  const [peakHoursPeriod, setPeakHoursPeriod] = useState("week");
  const [popularItemsPeriod, setPopularItemsPeriod] = useState("week");

  // ✅ revenue state riêng (để tự update)
  const [revenueValue, setRevenueValue] = useState(0);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // charts state
  const [ordersDaily, setOrdersDaily] = useState([]);
  const [ordersDailyLoading, setOrdersDailyLoading] = useState(false); // line: orders/day in month
  const [peakHours, setPeakHours] = useState([]);
  const [peakLoading, setPeakLoading] = useState(false); // bar: orders/hour
  const [popularItems, setPopularItems] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false); // pie: qty by item

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setRevenueLoading(true);
        const r = buildRange(revenuePeriod);

        // nếu backend bạn muốn from/to thì truyền from/to
        const res = await dashboardApi.getRevenue({
          period: revenuePeriod,
          from: r.from,
          to: r.to,
        });

        if (cancelled) return;
        setRevenueValue(Number(res?.total || 0));
      } catch (e) {
        if (cancelled) return;
        toast.error(e?.response?.data?.message || "Không tải được doanh thu");
        setRevenueValue(0);
      } finally {
        if (!cancelled) setRevenueLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [revenuePeriod]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setOrdersDailyLoading(true);
        const r = buildRange(ordersDailyPeriod);

        const res = await dashboardApi.getOrdersDaily({
          from: r.from,
          to: r.to,
          // hoặc month: r.month nếu backend bạn đang dùng month
        });

        if (cancelled) return;
        setOrdersDaily(res?.series || []);
      } catch (e) {
        if (cancelled) return;
        setOrdersDaily([]);
      } finally {
        if (!cancelled) setOrdersDailyLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [ordersDailyPeriod]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setPeakLoading(true);
        const r = buildRange(peakHoursPeriod);

        const res = await dashboardApi.getPeakHours({ from: r.from, to: r.to });

        if (cancelled) return;
        setPeakHours(res?.series || []);
      } catch (e) {
        if (cancelled) return;
        setPeakHours([]);
      } finally {
        if (!cancelled) setPeakLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [peakHoursPeriod]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setPopularLoading(true);
        const r = buildRange(popularItemsPeriod);

        const res = await dashboardApi.getPopularItems({
          from: r.from,
          to: r.to,
          limit: 8,
        });

        if (cancelled) return;
        setPopularItems(res?.items || []);
      } catch (e) {
        if (cancelled) return;
        setPopularItems([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [popularItemsPeriod]);

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
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              Lumière Bistro
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Thống kê nhanh + biểu đồ phân tích.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* period selector */}
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm ">
            <span className="text-gray-400">Doanh thu:</span>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
              className="bg-transparent outline-none text-white
              focus:outline-none focus:border-orange-500/40 transition [&>option]:bg-neutral-900 [&>option]:text-white"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value} className="text-black">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
            Dữ liệu ngày: <span className="text-white font-bold">{today}</span>
          </div>
        </div>
      </div>

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
          label={
            revenuePeriod === "day"
              ? "Doanh thu ngày"
              : revenuePeriod === "week"
                ? "Doanh thu tuần"
                : "Doanh thu tháng"
          }
          value={revenueLoading ? "—" : formatVND(revenueValue)}
          hint="Tổng doanh thu"
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
                value: `${Number(d.rating || 0).toFixed(1)} ★`,
                valueHint: `${formatInt(d.reviews)} reviews`,
              }))
          }
        />
      </div>

      {/* ✅ Analytics Charts */}
      <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-black text-xl">
              Biểu đồ phân tích
            </div>
          </div>
          {(ordersDailyLoading || peakLoading || popularLoading) ? (
            <div className="text-xs text-gray-400">Đang tải charts...</div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Line */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold">Số đơn theo ngày</div>
                <div className="text-xs text-gray-400 mt-1">
                  Theo {PERIODS.find((p) => p.value === ordersDailyPeriod)?.label?.toLowerCase()}
                </div>
              </div>
            </div>


            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersDaily}>
                  <defs>
                    <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<DarkTooltip />}
                    cursor={{
                      stroke: "rgba(251,146,60,0.3)",
                      strokeWidth: 1,
                    }}
                  />

                  {/* vùng bóng dưới line */}
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#fb923c"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#fb923c",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>

            </div>
          </div>

          {/* Pie */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold">Mặt hàng phổ biến</div>
                <div className="text-xs text-gray-400 mt-1">
                  Theo {PERIODS.find((p) => p.value === popularItemsPeriod)?.label?.toLowerCase()}
                </div>
              </div>

              <select
                value={popularItemsPeriod}
                onChange={(e) => setPopularItemsPeriod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm
                focus:outline-none focus:border-orange-500/40 transition [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value} className="text-black">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 h-90">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={popularItems}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={50}
                    paddingAngle={2}
                    label
                  >
                    {popularItems.map((item, index) => (
                      <Cell
                        key={`cell-${item.name}-${index}`}
                        fill={stringToColor(item.name)}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />

                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{
                      fontSize: 12,
                      color: "#e5e7eb",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 lg:col-span-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-bold">Giờ cao điểm</div>
                <div className="text-xs text-gray-400 mt-1">
                  Orders theo giờ (0–23) • Theo {PERIODS.find((p) => p.value === peakHoursPeriod)?.label?.toLowerCase()}
                </div>
              </div>

              <select
                value={peakHoursPeriod}
                onChange={(e) => setPeakHoursPeriod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm
                focus:outline-none focus:border-orange-500/40 transition [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value} className="text-black">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>


            <div className="mt-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peakHours}
                  barSize={22}
                >
                  {/* Gradient */}
                  <defs>
                    <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>

                  {/* Grid */}
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  {/* X */}
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(h) => `${h}h`}
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  {/* Y */}
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  {/* Tooltip */}
                  <Tooltip
                    content={<DarkTooltip />}
                    cursor={{
                      fill: "rgba(249, 115, 22, 0.2)"
                    }} />

                  {/* Bars */}
                  <Bar
                    dataKey="orders"
                    fill="url(#barGlow)"
                  >
                    {peakHours.map((_, i) => (
                      <Cell
                        key={i}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Footer tip */}
      <div className="mt-6 p-5 rounded-2xl bg-neutral-900/60 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Star className="text-orange-500" size={18} />
          </div>
          <div>
            <div className="text-white font-bold">Gợi ý</div>
            <p className="text-gray-400 text-sm mt-1">
              Nếu backend chưa có endpoint charts, hãy tạo: <b>/summary</b>, <b>/orders-daily</b>, <b>/peak-hours</b>, <b>/popular-items</b>.
            </p>
          </div>
        </div>
      </div>
    </div >
  );
}

function skeletonRows(type) {
  return Array.from({ length: 5 }).map((_, i) => ({
    key: `${type}-${i}`,
    title: "Loading...",
    subtitle: "—",
    value: "—",
    valueHint: "",
  }));
}
