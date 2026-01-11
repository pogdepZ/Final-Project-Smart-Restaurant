const dashboardRepo = require("../repositories/dashboardRepository");

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalTables,
      totalUsers,
      revenueThisMonth,
      topOrderedDishes,
      topRatedDishes,
    ] = await Promise.all([
      dashboardRepo.countTables(),
      dashboardRepo.countUsers(),
      dashboardRepo.revenueThisMonth(),
      dashboardRepo.topOrderedDishes(5),
      dashboardRepo.topRatedDishes(5),
    ]);

    res.json({
      stats: {
        totalTables,
        totalUsers,
        revenueThisMonth: Number(revenueThisMonth),
      },
      topOrderedDishes,
      topRatedDishes,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
};
