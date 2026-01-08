import React from 'react';
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed, Users, Settings, LogOut, Coffee, ChefHat } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xử lý logout (xóa token...)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/admin/categories', label: 'Danh mục món ăn', icon: UtensilsCrossed },
    { path: '/admin/menu', label: 'Thực đơn', icon: UtensilsCrossed },
    { path: '/admin/tables', label: 'Bàn ăn', icon: Coffee },
    { path: '/admin/staff', label: 'Nhân sự', icon: Users },
    { path: '/admin/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-neutral-900 border-r border-white/10 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="h-20 flex flex-col justify-center items-center border-b border-white/10">
           <span className="font-display text-3xl text-orange-400">Lumière</span>
           <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 font-bold">Admin Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] font-bold' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center font-bold">A</div>
            <div>
              <p className="text-sm font-bold text-white">Admin</p>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors text-sm"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (Hiện khi màn hình nhỏ) */}
        <div className="md:hidden h-16 bg-neutral-900 border-b border-white/10 flex items-center justify-between px-4">
           <span className="font-display text-xl text-orange-400">Lumière Admin</span>
           {/* Add Mobile Menu Toggle here if needed */}
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none z-0"></div>
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;