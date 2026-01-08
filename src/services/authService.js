const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

class AuthService {
  async login(email, password) {
    // 1. Tìm user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // 2. Kiểm tra mật khẩu (so sánh mật khẩu nhập vào với mật khẩu đã mã hóa)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // 3. Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );

    // 4. Trả về thông tin (không kèm password)
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async register(fullName, email, password) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email này đã được sử dụng');
    }

    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Lưu vào database
    const newUser = await userRepository.create({
      full_name: fullName,
      email: email,
      password: hashedPassword,
      role: 'admin' // Mặc định người đăng ký đầu tiên là admin
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();