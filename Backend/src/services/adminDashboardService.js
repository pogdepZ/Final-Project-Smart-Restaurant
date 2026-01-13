const dashboardRepo = require("../repositories/adminDashboardRepository");

exports.getAdminDashboardData = async () => {
  const totalTables = await dashboardRepo.countTables();
  const totalUsers = await dashboardRepo.countUsers();
  const revenueThisMonth = await dashboardRepo.revenueThisMonth();
  const topOrderedDishes = await dashboardRepo.topOrderedDishes(5);
  const topRatedDishes = await dashboardRepo.topRatedDishes(5);

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
