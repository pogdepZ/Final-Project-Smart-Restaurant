const dashboardService = require("../services/adminDashboardService");

exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminDashboardData();
    return res.json(data);
  } catch (err) {
    console.error("Admin dashboard error detail:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      where: err?.where,
      table: err?.table,
      column: err?.column,
      constraint: err?.constraint,
    });
    return res.status(500).json({ message: "Dashboard error" });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { period = "month", date } = req.query;
    const data = await dashboardService.getSummary({ period, date });
    return res.json(data);
  } catch (e) {
    console.error("getSummary error:", e);
    return res.status(500).json({ message: "Dashboard error" });
  }
};

exports.getOrdersDaily = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const data = await dashboardService.getOrdersDaily({ month });
    return res.json(data);
  } catch (e) {
    console.error("getOrdersDaily error:", e);
    return res.status(500).json({ message: "Dashboard error" });
  }
};

exports.getPeakHours = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await dashboardService.getPeakHours({ from, to });
    return res.json(data);
  } catch (e) {
    console.error("getPeakHours error:", e);
    return res.status(500).json({ message: "Dashboard error" });
  }
};

exports.getPopularItems = async (req, res) => {
  try {
    const { from, to, limit = 8 } = req.query;
    const data = await dashboardService.getPopularItems({
      from,
      to,
      limit: Number(limit) || 8,
    });
    return res.json(data);
  } catch (e) {
    console.error("getPopularItems error:", e);
    return res.status(500).json({ message: "Dashboard error" });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const { period, from, to } = req.query;

    const result = await dashboardService.getRevenue({ period, from, to });
    return res.json(result);
  } catch (err) {
    console.error("getRevenue error:", err);

    const status = err.status || 500;
    const message = err.message || "Revenue error";
    return res.status(status).json({ message });
  }
};
