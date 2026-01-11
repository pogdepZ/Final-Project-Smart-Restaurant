// src/controllers/authController.js
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Thư viện mã hóa

// 1. ĐĂNG KÝ TÀI KHOẢN MỚI
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate đơn giản
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên, email và mật khẩu' });
  }

  try {
    // Bước 1: Kiểm tra email đã tồn tại chưa
    const userExist = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    // Bước 2: Mã hóa mật khẩu (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Bước 3: Lưu vào Database
    // Nếu không gửi role lên thì mặc định là 'waiter' (nhân viên)
    const userRole = role || 'waiter'; 

    const newUser = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );

    // Bước 4: Trả về kết quả thành công
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};

// 2. ĐĂNG NHẬP (Cập nhật để dùng bcrypt)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Bước 1: Tìm user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }

    const user = result.rows[0];

    // Bước 2: So sánh mật khẩu (Input vs Hash trong DB)
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    // Bước 3: Tạo Token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi Server' });
  }
};