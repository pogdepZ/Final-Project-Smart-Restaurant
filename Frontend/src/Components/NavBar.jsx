import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu as MenuIcon, X, MapPin } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Giả lập trạng thái (Sau này lấy từ Redux/Context)
  const isLoggedIn = false; // Chưa đăng nhập
  const tableNumber = null; // Chưa quét QR -> Chưa có bàn
  const cartCount = 0;

  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-900/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* 1. LOGO & BRAND */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-white font-bold text-lg tracking-wide">SMART RESTO</h1>
            <p className="text-xs text-gray-400">Taste the difference</p>
          </div>
        </Link>

        {/* 2. MIDDLE NAVIGATION (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" label="Trang chủ" />
          <NavLink to="/menu-preview" label="Thực đơn" />
          {/* Nút xem sơ đồ bàn / Đặt bàn */}
          <NavLink to="/booking" label="Đặt bàn / Sơ đồ" icon={<MapPin size={16} />} />
        </div>

        {/* 3. RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {/* Giỏ hàng (Luôn hiện) */}
          <Link to="/cart" className="relative p-2 text-gray-300 hover:text-orange-500 transition-colors">
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Logic Đăng nhập / User */}
          {isLoggedIn ? (
            // Đã đăng nhập -> Hiện Avatar
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
               {tableNumber && (
                  <span className="hidden lg:block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                    {tableNumber}
                  </span>
               )}
               <Link to="/profile" className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500 hover:bg-neutral-700">
                 <User size={20} />
               </Link>
            </div>
          ) : (
            // Chưa đăng nhập -> Hiện Sign In / Sign Up
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
              <Link 
                to="/signin" 
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* 4. MOBILE MENU (Dropdown) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-neutral-900 border-t border-white/10 px-4 py-4 flex flex-col gap-4">
          <MobileLink to="/" label="Trang chủ" />
          <MobileLink to="/menu-preview" label="Thực đơn" />
          <MobileLink to="/booking" label="Sơ đồ bàn / Đặt chỗ" />
          
          {!isLoggedIn && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
              <Link to="/signin" className="py-2.5 text-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5">
                Đăng nhập
              </Link>
              <Link to="/signup" className="py-2.5 text-center rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600">
                Đăng ký ngay
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// Component con cho Link Desktop
const NavLink = ({ to, label, icon }) => (
  <Link to={to} className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-orange-500 transition-colors">
    {icon}
    {label}
  </Link>
);

// Component con cho Link Mobile
const MobileLink = ({ to, label }) => (
  <Link to={to} className="block text-base font-medium text-gray-300 hover:text-orange-500">
    {label}
  </Link>
);

export default Navbar;