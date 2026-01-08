import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Mail, Lock, ArrowRight, User, ShieldCheck, Star, Utensils, AlertCircle, Loader2 } from 'lucide-react';
import Input from '../../../Components/Input';
import axiosClient from '../../../services/axiosClient'; // Đảm bảo đường dẫn đúng

const SignUp = () => {
  const navigate = useNavigate();

  // 1. State lưu dữ liệu form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // State xử lý lỗi và loading
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Hàm xử lý khi người dùng nhập liệu
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value // Cập nhật field tương ứng dựa trên 'name' input
    });
    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (error) setError('');
  };

  // 3. Hàm xử lý Submit Form
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate: Kiểm tra mật khẩu xác nhận
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      setIsLoading(false);
      return;
    }

    try {
      // Gọi API Register (Backend bạn đã viết: POST /auth/register)
      const response = await axiosClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
        // Không gửi confirmPassword lên server
      });

      console.log("Đăng ký thành công:", response.data);
      
      // Thông báo hoặc chuyển hướng
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/signin'); 

    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      // Lấy message lỗi từ Backend trả về (nếu có)
      const mess = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.';
      setError(mess);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-neutral-950">

      {/* 1. Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80"
          alt="Fine Dining"
          className="w-full h-full object-cover opacity-30 lg:opacity-50"
        />
        <div className="absolute inset-0 bg-neutral-950/80 lg:bg-linear-to-r lg:from-neutral-950/80 lg:via-neutral-950/40 lg:to-transparent"></div>
      </div>

      {/* 2. CỘT TRÁI (Giữ nguyên) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-48 z-10 overflow-hidden">
        <div className="flex flex-col leading-none">
          <span className="font-display text-5xl text-orange-400">Lumière</span>
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase mt-2 text-white/60 font-black">Bistro</span>
        </div>
        <div className="max-w-md space-y-8">
          <h2 className="text-4xl font-black text-white leading-tight">
            Trở thành <span className="text-orange-500">Hội Viên</span> <br />
            Nhận ngay ưu đãi đặc quyền.
          </h2>
          {/* ... (Phần nội dung ưu đãi giữ nguyên) ... */}
           <div className="space-y-5 text-white/80">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 mt-1"><Star size={20} /></div>
              <div>
                <p className="font-bold text-white italic">Giảm 10% cho lần đặt bàn đầu tiên</p>
                <p className="text-xs text-white/50">Áp dụng cho toàn bộ menu tại nhà hàng.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 mt-1"><Utensils size={20} /></div>
              <div>
                <p className="font-bold text-white italic">Tích điểm đổi quà</p>
                <p className="text-xs text-white/50">Mỗi bữa ăn đều mang lại giá trị tích lũy lâu dài.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-white/30 text-[10px] tracking-widest uppercase italic">
          Join the Elite Taste — Since 2026
        </div>
      </div>

      {/* 3. CỘT PHẢI: FORM ĐĂNG KÝ */}
      <div className="relative z-10 w-full lg:w-1/2 flex justify-center items-center px-4 py-10">
        <div className="w-full max-w-md bg-white/3 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tighter">
              Tạo Tài <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">Khoản</span>
            </h2>
            <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-light">Bắt đầu hành trình ẩm thực của bạn</p>
          </div>

          {/* HIỂN THỊ LỖI NẾU CÓ */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Họ và Tên */}
            {/* Lưu ý: Phải truyền đúng props name, value, onChange vào Input Component */}
            <Input 
              label="Full Name" 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A" 
              icon={User} 
            />

            {/* Email */}
            <Input 
              label="Email Address" 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@lumiere.com" 
              icon={Mail} 
            />

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Password" 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••" 
                icon={Lock} 
              />
              <Input 
                label="Confirm" 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••" 
                icon={ShieldCheck} 
              />
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" id="terms" required className="w-4 h-4 accent-orange-500 rounded border-white/10" />
              <label htmlFor="terms" className="text-[11px] text-gray-400 leading-none">
                Tôi đồng ý với <span className="text-white underline cursor-pointer">Điều khoản & Chính sách</span>.
              </label>
            </div>

            {/* Nút Đăng Ký */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang xử lý...
                </>
              ) : (
                <>
                  Đăng Ký Thành Viên <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* ... (Phần Social Login & Link Login giữ nguyên) ... */}
             <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase text-gray-500 tracking-[0.2em]"><span className="bg-[#080808] px-2 lg:bg-transparent">Hoặc nhanh hơn với</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white text-[12px] font-bold rounded-xl hover:bg-white/10 transition-all">
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-white text-[12px] font-bold rounded-xl hover:bg-white/10 transition-all">
                Facebook
              </button>
            </div>
          </form>

          <p className="text-center text-gray-500 text-xs mt-8 uppercase tracking-wider">
            Đã có tài khoản?
            <Link to="/signin" className="text-white ml-2 font-black hover:text-orange-400 transition-colors border-b border-orange-500/30">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;