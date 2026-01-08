import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu as MenuIcon, X, MapPin, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTotalItems } from '../store/slices/cartSlice';
// Đảm bảo import action logout
import { selectIsAuthenticated, selectCurrentUser, logout } from '../store/slices/authSlice'; 
import { IoRestaurant } from "react-icons/io5";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy trạng thái đăng nhập từ Redux
  const isLoggedIn = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const cartCount = useSelector(selectTotalItems);

  // --- HÀM ĐĂNG XUẤT ---
  const handleLogout = () => {
    // 1. Xóa storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 2. Dispatch Redux action
    dispatch(logout());
    // 3. Đóng menu mobile
    setIsMobileMenuOpen(false);
    // 4. Chuyển hướng
    navigate('/signin');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* ... (Phần Logo giữ nguyên) ... */}
        <Link to="/" className="flex items-center gap-2 group z-50">
            {/* Logo content */}
             <h1 className="text-white font-bold text-lg">Lumière Bistro</h1>
        </Link>

        {/* ... (Phần Desktop Menu giữ nguyên) ... */}

        {/* --- PHẦN QUAN TRỌNG: USER & LOGOUT --- */}
        <div className="flex items-center gap-3 z-50">
          
          {/* Giỏ hàng (Giữ nguyên) */}
          <Link to="/cart" className="relative p-2 text-gray-300">
             <ShoppingBag size={24} />
             {/* Badge count */}
          </Link>

          {/* CHECK TRẠNG THÁI ĐĂNG NHẬP */}
          {isLoggedIn ? (
            // === NẾU ĐÃ ĐĂNG NHẬP ===
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
              {/* Avatar User */}
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500">
                  <User size={20} />
                </div>
                <span className="text-sm font-medium text-white">{user?.name || 'User'}</span>
              </Link>

              {/* === NÚT LOGOUT (DESKTOP) === */}
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            // === NẾU CHƯA ĐĂNG NHẬP ===
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
              <Link to="/signin" className="text-sm font-medium text-gray-300">Đăng nhập</Link>
              <Link to="/signup" className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg">Đăng ký</Link>
            </div>
          )}

          {/* Nút Menu Mobile (Giữ nguyên) */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-300">
             {isMobileMenuOpen ? <X size={26} /> : <MenuIcon size={26} />}
          </button>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 right-0 h-full w-70 bg-neutral-900 z-40 pt-20 px-6 flex flex-col md:hidden border-l border-white/10">
            {/* Các link mobile... */}
            
            {/* === NÚT LOGOUT (MOBILE) === */}
            <div className="mt-auto mb-8">
              {isLoggedIn ? (
                <button 
                  onClick={handleLogout} 
                  className="w-full py-3 flex items-center justify-center gap-2 text-red-500 font-medium hover:bg-white/5 rounded-xl border border-red-500/20"
                >
                  <LogOut size={20} /> Đăng xuất
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                   <Link to="/signin" className="py-2.5 text-center border border-white/10 text-gray-300 rounded-lg">Login</Link>
                   <Link to="/signup" className="py-2.5 text-center bg-orange-500 text-white rounded-lg">Sign Up</Link>
                </div>
              )}
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;