const { resolveRange } = require("../utils/dateRange");
const repo = require("../repositories/adminDashboardRepository");

exports.getAdminDashboardData = async () => {
  const totalTables = await repo.countTables();
  const totalUsers = await repo.countUsers();
  const revenueThisMonth = await repo.revenueThisMonth();
  const topOrderedDishes = await repo.topOrderedDishes(5);
  const topRatedDishes = await repo.topRatedDishes(5);

  return {
    stats: {
      totalTables,
      totalUsers,
      revenueThisMonth: Number(revenueThisMonth) || 0,
    },
    topOrderedDishes: topOrderedDishes || [],
    topRatedDishes: topRatedDishes || [],
  };
};

// helper: tạo range from/to theo period
function buildRange({ period, date }) {
  // date: YYYY-MM-DD, nếu không có -> hôm nay theo server timezone
  const d = date ? new Date(date) : new Date();
  const start = new Date(d);
  const end = new Date(d);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    // week bắt đầu Monday
    const day = (start.getDay() + 6) % 7; // 0=Mon
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 7);
    end.setHours(0, 0, 0, 0);
  } else {
    // month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
  }

  const toISODateTime = (x) => x.toISOString(); // nếu DB dùng timestamptz ok
  return { from: toISODateTime(start), to: toISODateTime(end) };
}

exports.getSummary = async ({ period, date }) => {
  const range = buildRange({ period, date });

  const [totalTables, totalUsers, revenueAndOrders] = await Promise.all([
    repo.countTables(),
    repo.countUsers(),
    repo.revenueAndOrders(range),
  ]);

  return {
    period,
    range,
    stats: {
      totalTables: Number(totalTables) || 0,
      totalUsers: Number(totalUsers) || 0,
      revenue: Number(revenueAndOrders?.revenue || 0),
      orders: Number(revenueAndOrders?.orders || 0),
    },
  };
};

exports.getOrdersDaily = async ({ month }) => {
  // month: YYYY-MM
  // build from/to = first day of month -> next month
  const base = month ? new Date(`${month}-01`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);

  const from = start.toISOString();
  const to = end.toISOString();

  const rows = await repo.ordersDaily({ from, to });

  // optional: fill missing days = 0
  return {
    month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
      2,
      "0"
    )}`,
    series: rows,
  };
};

exports.getPeakHours = async ({ from, to }) => {
  const rows = await repo.peakHours({ from, to });
  return { series: rows };
};

exports.getPopularItems = async ({ from, to, limit }) => {
  const rows = await repo.popularItems({ from, to, limit });
  return { items: rows };
};

exports.getRevenue = async ({ period, from, to }) => {
  const range = resolveRange({ period, from, to });
  if (!range) {
    const err = new Error("from/to không hợp lệ");
    err.status = 400;
    throw err;
  }

  const total = await repo.getRevenue({
    fromISO: range.from,
    toISO: range.to,
    paymentStatus: "paid",
    statuses: ["completed"], // bạn muốn điều kiện nào thì sửa ở đây
  });

  return {
    period: period || null,
    from: range.from,
    to: range.to,
    total,
  };
};
