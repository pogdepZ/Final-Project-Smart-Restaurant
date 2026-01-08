const prisma = require('../config/prisma');

exports.getStats = async (req, res) => {
  try {
    // 1. Tính tổng doanh thu & số đơn (của Session đã đóng)
    const sessions = await prisma.tableSession.findMany({
      where: { status: 'CLOSED' }
    });

    const totalRevenue = sessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalOrders = sessions.length;

    // 2. Tìm món bán chạy (Thống kê từ OrderItem)
    const items = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5 // Top 5 món
    });

    // Lấy tên món ăn từ ID
    const topItems = await Promise.all(items.map(async (i) => {
      const menu = await prisma.menuItem.findUnique({ where: { id: i.menuItemId } });
      return { name: menu?.name, quantity: i._sum.quantity };
    }));

    res.json({ totalRevenue, totalOrders, topItems });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};