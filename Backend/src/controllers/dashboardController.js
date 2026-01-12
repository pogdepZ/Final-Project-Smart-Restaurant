const dashboardRepo = require("../repositories/dashboardRepository");

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalTables = await dashboardRepo.countTables();
    console.log("totalTables ok:", totalTables);

    const totalUsers = await dashboardRepo.countUsers();
    console.log("totalUsers ok:", totalUsers);

    const revenueThisMonth = await dashboardRepo.revenueThisMonth();
    console.log("revenueThisMonth ok:", revenueThisMonth);

    const topOrderedDishes = await dashboardRepo.topOrderedDishes(5);
    console.log("topOrderedDishes ok:", topOrderedDishes?.length);

    const topRatedDishes = await dashboardRepo.topRatedDishes(5);
    console.log("topRatedDishes ok:", topRatedDishes?.length);

    return res.json({
      stats: {
        totalTables,
        totalUsers,
        revenueThisMonth: Number(revenueThisMonth),
      },
      topOrderedDishes,
      topRatedDishes,
    });
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
