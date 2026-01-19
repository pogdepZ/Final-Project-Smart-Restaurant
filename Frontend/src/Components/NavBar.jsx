import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ShoppingBag,
  User,
  Menu as MenuIcon,
  X,
  MapPin,
  LogOut,
  ClipboardList,
} from "lucide-react";
// 1. Import useDispatch
import { useSelector, useDispatch } from "react-redux";
import { selectTotalItems } from "../store/slices/cartSlice";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  logout,
} from "../store/slices/authSlice";
import { IoRestaurant } from "react-icons/io5";
import Avatar from "../features/Customer/components/Avatar";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // 2. Khởi tạo dispatch và navigate
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Dùng để chuyển trang sau khi logout nếu cần

  const isLoggedIn = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  // Xác định role hiện tại
  const role = user?.role;
  const cartCount = useSelector(selectTotalItems);
  const tableNumber = localStorage.getItem("tableNumber");

  // Check qrToken in localStorage
  const [hasQrToken, setHasQrToken] = useState(false);
  // Thêm location.pathname vào dependency array
  useEffect(() => {
    // Kiểm tra kỹ hơn: Có token HOẶC có mã bàn thì coi như đã quét
    const token = localStorage.getItem("qrToken");
    const table = localStorage.getItem("tableNumber"); // Check thêm cái này cho chắc

    setHasQrToken(!!token || !!table);
  }, [location.pathname]); // <--- QUAN TRỌNG: Chạy lại mỗi khi đổi đường dẫn

  // --- HÀM ĐÓNG MENU ---
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // --- 3. HÀM XỬ LÝ ĐĂNG XUẤT ---
  const handleLogout = () => {
    dispatch(logout()); // Gọi Redux action logout
    closeMenu();
    navigate("/"); // (Tuỳ chọn) Chuyển về trang chủ sau khi đăng xuất
    toast.success("Đăng xuất thành công");
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* 1. LOGO */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 group z-50"
          >
            <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <IoRestaurant className="text-white font-black text-lg"></IoRestaurant>
            </div>
            <div className="md:block">
              <h1 className="text-white font-bold text-lg tracking-wide font-display">
                Lumière Bistro
              </h1>
            </div>
          </Link>

          {/* 2. DESKTOP MENU (Ẩn trên Mobile) */}
          <div className="hidden md:flex items-center gap-8">
            {/* Menu cho từng role */}
            {role === "waiter" && (
              <>
                <NavLink to="/waiter" label="Đơn phục vụ" />
              </>
            )}
            {role === "kitchen" && (
              <>
                <NavLink to="/kitchen" label="Đơn bếp" />
              </>
            )}
            {/* Mặc định cho customer */}
            {(!role || role === "customer") && (
              <>
                <NavLink to="/" label="Trang chủ" />
                <NavLink to="/menu" label="Thực đơn" />
                {!hasQrToken && (
                  <NavLink
                    to="/booking"
                    label="Sơ đồ bàn"
                    icon={<MapPin size={16} />}
                  />
                )}
                <NavLink
                  to="/order-tracking"
                  label="Theo dõi đơn"
                  icon={<ClipboardList size={16} />}
                />
              </>
            )}
          </div>

          {/* 3. RIGHT ACTIONS */}
          <div className="flex items-center gap-3 z-50">
            {/* Giỏ hàng */}
            {role != "admin" && role != "waiter" && role != "kitchen" && (
              <>
                <Link
                  to="/cart"
                  onClick={closeMenu}
                  className="relative p-2 text-gray-300 hover:text-orange-500 transition-colors"
                >
                  <ShoppingBag size={24} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* User Info / Login / Logout Desktop */}
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                {/* Link Profile */}
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="group flex items-center gap-2"
                >
                  <Avatar
                    url={user?.avatarUrl || user?.avatar_url}
                    name={user?.name}
                    size={36}
                    className="group-hover:ring-2 group-hover:ring-orange-500 transition"
                  />

                  <span className="max-w-30 truncate text-sm font-semibold text-gray-200 group-hover:text-white">
                    {user?.name}
                  </span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-white/5 rounded-full"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                <Link
                  to="/signin"
                  className="text-sm font-medium text-gray-300 hover:text-white"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Hamburger Button (Chỉ hiện Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-transform active:scale-90"
            >
              {isMobileMenuOpen ? (
                <X size={26} className="text-orange-500" />
              ) : (
                <MenuIcon size={26} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* --- 4. MOBILE MENU OVERLAY & DRAWER --- */}

      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 backdrop-blur-sm ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeMenu}
      ></div>

      <div
        className={`fixed top-0 right-0 h-full w-70 bg-neutral-900 z-40 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out pt-20 px-6 flex flex-col md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* User Info Mobile */}
        {isLoggedIn ? (
          <Link
            to="/profile"
            onClick={closeMenu}
            className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10"
          >
            <Avatar
              url={user?.avatarUrl || user?.avatar_url}
              name={user?.name}
              size={48}
            />

            <div>
              <p className="text-white font-bold truncate max-w-[160px]">
                {user?.name || "Khách hàng"}
              </p>

              {/* Chỉ hiện cho customer hoặc khi role chưa có */}
              {(role === "customer" || !role) && (
                <p className="text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                  {tableNumber ? `Đang ngồi ${tableNumber}` : "Chưa có bàn"}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <div className="mb-8 pb-6 border-b border-white/10">
            <p className="text-gray-400 text-sm mb-4">
              Chào mừng đến với Smart Resto!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/signin"
                onClick={closeMenu}
                className="py-2.5 text-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="py-2.5 text-center rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 text-sm"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        )}

        {/* Danh sách Link Mobile */}
        <div className="flex flex-col gap-2">
          {/* Menu cho từng role trên mobile */}
          {role === "waiter" && (
            <>
              <MobileLink
                to="/waiter"
                label="Đơn phục vụ"
                onClick={closeMenu}
              />
            </>
          )}
          {role === "kitchen" && (
            <>
              <MobileLink to="/kitchen" label="Đơn bếp" onClick={closeMenu} />
            </>
          )}
          {(!role || role === "customer") && (
            <>
              <MobileLink to="/" label="Trang chủ" onClick={closeMenu} />
              <MobileLink to="/menu" label="Thực đơn" onClick={closeMenu} />
              {!hasQrToken && (
                <MobileLink
                  to="/booking"
                  label="Sơ đồ bàn / Đặt chỗ"
                  onClick={closeMenu}
                />
              )}
              <MobileLink
                to="/cart"
                label="Giỏ hàng của bạn"
                onClick={closeMenu}
              />
              <MobileLink
                to="/order-tracking"
                label="Theo dõi đơn"
                onClick={closeMenu}
              />
              {isLoggedIn && (
                <MobileLink
                  to="/history"
                  label="Lịch sử đơn hàng"
                  onClick={closeMenu}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Mobile Menu */}
        <div className="mt-auto mb-8">
          {isLoggedIn && (
            // 5. Cập nhật nút đăng xuất Mobile gọi hàm handleLogout
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 font-medium hover:text-red-400 w-full py-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <LogOut size={20} /> Đăng xuất
            </button>
          )}
          <p className="text-xs text-gray-600 mt-6 text-center">
            Version 1.0.0
          </p>
        </div>
      </div>
    </>
  );
};

const NavLink = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={
        `flex items-center gap-2 text-sm font-medium transition-colors ` +
        (isActive
          ? "text-orange-500 font-bold"
          : "text-gray-400 hover:text-orange-500")
      }
    >
      {icon}
      {label}
    </Link>
  );
};

const MobileLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block py-3 px-4 rounded-xl text-base font-medium text-gray-300 hover:bg-white/5 hover:text-orange-500 transition-colors active:scale-95"
  >
    {label}
  </Link>
);

export default Navbar;
