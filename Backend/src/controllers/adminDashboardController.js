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
