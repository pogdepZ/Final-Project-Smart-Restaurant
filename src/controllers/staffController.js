const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// 1. Lấy danh sách nhân viên (Trừ admin ra)
exports.getStaffs = async (req, res) => {
  try {
    const staffs = await prisma.user.findMany({
      where: {
        role: { in: ['WAITER', 'KITCHEN'] }
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true } // Không lấy password
    });
    res.json(staffs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Tạo nhân viên mới
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate
    if (!['WAITER', 'KITCHEN'].includes(role)) {
      return res.status(400).json({ error: "Chỉ được tạo Waiter hoặc Kitchen" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email đã tồn tại" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });

    res.json(newStaff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Xóa nhân viên
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Đã xóa nhân viên" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};