import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, QrCode } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Background Image với lớp phủ tối */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
          alt="Restaurant Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
      </div>

      {/* Nội dung Hero */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
        
        <span className="inline-block py-1 px-3 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold tracking-wider mb-6 uppercase animate-fade-in">
          Premium Dining Experience
        </span>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          Thưởng thức <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">Tinh Hoa</span> <br />
          Ẩm Thực Việt
        </h1>

        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-10 font-light">
          Đặt bàn dễ dàng, gọi món nhanh chóng qua mã QR. Trải nghiệm phong cách phục vụ hiện đại ngay hôm nay.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Nút chính: Quét QR hoặc Xem Menu */}
          <Link 
            to="/menu-preview" 
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            Xem Thực Đơn
            <ArrowRight size={20} />
          </Link>

          {/* Nút phụ: Đăng ký / Đăng nhập */}
          <Link 
            to="/signup" 
            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Đăng ký thành viên
          </Link>
        </div>

        {/* Gợi ý quét QR */}
        <div className="mt-12 flex items-center gap-4 text-gray-400 text-sm p-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
          <div className="bg-white p-1 rounded">
             <QrCode size={24} className="text-black"/>
          </div>
          <div className="text-left">
            <p className="text-gray-200 font-bold">Đã có mặt tại quán?</p>
            <p>Vui lòng quét mã QR trên bàn để gọi món.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;