import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UtensilsCrossed, Star, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Input from '../../../Components/Input';
import axiosClient from '../../../services/axiosClient';

const SignIn = () => {
  const navigate = useNavigate();

  // 1. State quản lý dữ liệu và trạng thái
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Xử lý nhập liệu
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Xóa lỗi khi người dùng gõ lại
    if (error) setError('');
  };

  // 3. Xử lý Đăng Nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Gọi API Login
      const response = await axiosClient.post('/auth/login', formData);
      const { token, user } = response.data;

      // --- QUAN TRỌNG: LƯU TRỮ PHIÊN ĐĂNG NHẬP ---
      // Lưu token để axiosClient tự động gắn vào header các request sau
      localStorage.setItem('token', token);
      
      // Lưu thông tin user để hiển thị (VD: Xin chào, Admin...)
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Login Success:', user);

      // Chuyển hướng dựa trên quyền (Role)
      if (user.role === 'admin') {
        navigate('/admin/tables'); // Nếu là quản lý
      } else if (user.role === 'kitchen') {
        navigate('/kitchen'); // Nếu là bếp
      } else if(user.role === 'waiter') {
        navigate('/waiter')
      } else {
        navigate('/'); // Nếu là khách hàng hoặc nhân viên phục vụ
      }

    } catch (err) {
      console.error("Login Error:", err);
      // Lấy thông báo lỗi từ Backend trả về
      const message = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-neutral-950">

      {/* Background Image (Giữ nguyên) */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80"
          alt="Restaurant Interior"
          className="w-full h-full object-cover shadow-2xl opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-r from-neutral-950/80 via-neutral-950/40 to-transparent"></div>
      </div>

      {/* CỘT TRÁI (Giữ nguyên logic hiển thị) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 z-10 overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col leading-none">
            <span className="font-display text-5xl text-orange-400">Lumière</span>
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase mt-2 text-white/60 font-black">Bistro</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <h2 className="text-4xl font-black text-white font-sans leading-tight">
            Nơi hương vị <span className="text-orange-500">Châu Âu</span> <br />
            gặp gỡ tâm hồn Việt.
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Star size={20} /></div>
              <p className="text-sm">Trải nghiệm Fine Dining 5 sao với đầu bếp quốc tế.</p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><UtensilsCrossed size={20} /></div>
              <p className="text-sm">Thực đơn đa dạng từ Steak đến Pasta thủ công.</p>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Clock size={20} /></div>
              <p className="text-sm">Mở cửa hàng ngày: 09:00 AM - 10:00 PM.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-[10px] tracking-widest uppercase italic">
          High Quality Hospitality — Since 2026
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/3 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white leading-tight">
              Chào mừng <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">đến với</span>
            </h2>
            <p className="text-gray-400 text-xl mt-2 font-light tracking-wide italic font-display">
              Lumière Bistro
            </p>
          </div>

          {/* HIỂN THỊ LỖI */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold animate-pulse">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>

            <Input
              label="Email Address"
              type="email"
              name="email" // Quan trọng
              value={formData.email} // Quan trọng
              onChange={handleChange} // Quan trọng
              placeholder="chef@lumiere.com"
              icon={Mail}
            />

            <Input
              label="Password"
              type="password"
              name="password" // Quan trọng
              value={formData.password} // Quan trọng
              onChange={handleChange} // Quan trọng
              placeholder="••••••••"
              icon={Lock}
            />

            <div className="flex justify-end">
              <Link to="/forgot" className="text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-tighter">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Nút Submit có Loading */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang kiểm tra...
                </>
              ) : (
                <>
                  Đăng Nhập <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="px-3 text-gray-400 tracking-[0.3em]">Hoặc đăng nhập với</span></div>
            </div>

            {/* Social Logins (Mockup - chưa có logic) */}
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl transition-all">
               {/* Icon Google */}
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl transition-all">
                {/* Icon Facebook */}
                Facebook
              </button>
            </div>
          </form>

          <p className="text-center text-gray-500 text-[13px] mt-8">
            Chưa có tài khoản?
            <Link to="/signup" className="text-white ml-2 font-bold hover:text-orange-400 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;