import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu as MenuIcon, X, MapPin, LogOut } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation(); // Hook để biết đang ở trang nào

  // Giả lập trạng thái (Sau này lấy từ Redux/Context)
  const isLoggedIn = false; 
  const tableNumber = "T05"; 
  const cartCount = 2;

  // --- HÀM ĐÓNG MENU ---
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Tự động đóng menu khi đường dẫn thay đổi (Phòng trường hợp navigate bằng cách khác)
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // Ngăn cuộn trang khi mở menu mobile (UX tốt hơn)
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          {/* 1. LOGO */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2 group z-50">
            <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-white font-bold text-lg tracking-wide">SMART RESTO</h1>
            </div>
          </Link>

          {/* 2. DESKTOP MENU (Ẩn trên Mobile) */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" label="Trang chủ" />
            <NavLink to="/menu" label="Thực đơn" />
            <NavLink to="/booking" label="Sơ đồ bàn" icon={<MapPin size={16} />} />
          </div>

          {/* 3. RIGHT ACTIONS */}
          <div className="flex items-center gap-3 z-50">
            {/* Giỏ hàng */}
            <Link to="/cart" onClick={closeMenu} className="relative p-2 text-gray-300 hover:text-orange-500 transition-colors">
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Info / Login */}
            {isLoggedIn ? (
              <Link to="/profile" onClick={closeMenu} className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                 <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500">
                   <User size={20} />
                 </div>
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                <Link to="/signin" className="text-sm font-medium text-gray-300 hover:text-white">Đăng nhập</Link>
                <Link to="/signup" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-all">Đăng ký</Link>
              </div>
            )}

            {/* Hamburger Button (Chỉ hiện Mobile) */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-transform active:scale-90"
            >
              {isMobileMenuOpen ? <X size={26} className="text-orange-500" /> : <MenuIcon size={26} />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- 4. MOBILE MENU OVERLAY & DRAWER --- */}
      
      {/* Lớp phủ đen mờ (Bấm vào đây cũng tắt menu) */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 backdrop-blur-sm ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeMenu}
      ></div>

      {/* Menu trượt từ phải sang */}
      <div 
        className={`fixed top-0 right-0 h-full w-70 bg-neutral-900 z-40 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out pt-20 px-6 flex flex-col md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* User Info Mobile */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <User size={24} />
            </div>
            <div>
              <p className="text-white font-bold">Khách hàng</p>
              <p className="text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                {tableNumber ? `Đang ngồi ${tableNumber}` : 'Chưa có bàn'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-8 pb-6 border-b border-white/10">
            <p className="text-gray-400 text-sm mb-4">Chào mừng đến với Smart Resto!</p>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/signin" onClick={closeMenu} className="py-2.5 text-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium">
                Đăng nhập
              </Link>
              <Link to="/signup" onClick={closeMenu} className="py-2.5 text-center rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 text-sm">
                Đăng ký
              </Link>
            </div>
          </div>
        )}

        {/* Danh sách Link Mobile */}
        <div className="flex flex-col gap-2">
          {/* QUAN TRỌNG: Truyền hàm closeMenu vào đây */}
          <MobileLink to="/" label="Trang chủ" onClick={closeMenu} />
          <MobileLink to="/menu-preview" label="Thực đơn" onClick={closeMenu} />
          <MobileLink to="/booking" label="Sơ đồ bàn / Đặt chỗ" onClick={closeMenu} />
          <MobileLink to="/cart" label="Giỏ hàng của bạn" onClick={closeMenu} />
          {isLoggedIn && <MobileLink to="/history" label="Lịch sử đơn hàng" onClick={closeMenu} />}
        </div>

        {/* Footer Mobile Menu */}
        <div className="mt-auto mb-8">
           {isLoggedIn && (
             <button onClick={() => { console.log('Logout'); closeMenu(); }} className="flex items-center gap-2 text-red-500 font-medium hover:text-red-400">
               <LogOut size={20} /> Đăng xuất
             </button>
           )}
           <p className="text-xs text-gray-600 mt-6 text-center">Version 1.0.0</p>
        </div>
      </div>
    </>
  );
};

// Component con Link Desktop
const NavLink = ({ to, label, icon }) => (
  <Link to={to} className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-orange-500 transition-colors">
    {icon}
    {label}
  </Link>
);

// Component con Link Mobile (Đã thêm onClick)
const MobileLink = ({ to, label, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick} // <-- Đây là mấu chốt: Bấm xong thì gọi hàm đóng menu
    className="block py-3 px-4 rounded-xl text-base font-medium text-gray-300 hover:bg-white/5 hover:text-orange-500 transition-colors active:scale-95"
  >
    {label}
  </Link>
);

export default Navbar;