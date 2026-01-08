import React from 'react';
import { Outlet, NavLink } from "react-router-dom";
import { ClipboardList, LayoutGrid, Bell, User } from 'lucide-react';

const WaiterLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white font-sans">
      
      {/* WAITER HEADER */}
      <header className="h-16 bg-neutral-900 border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-50">
        <span className="font-display text-xl text-orange-400">Lumière <span className="text-xs font-sans text-gray-500 tracking-widest uppercase ml-1">Staff</span></span>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-1">
            <span className="text-sm font-bold">Nam Nguyen</span>
            <span className="text-[10px] text-green-400">● Available</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <User size={18} />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-20 p-4">
        <Outlet />
      </main>

      {/* BOTTOM NAVIGATION (Mobile Friendly) */}
      <nav className="h-16 bg-neutral-900 border-t border-white/10 fixed bottom-0 w-full z-50 flex justify-around items-center px-2">
        <NavLink 
          to="/waiter/tables" 
          className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <LayoutGrid size={22} />
          <span className="text-[10px] font-bold uppercase">Bàn</span>
        </NavLink>

        <NavLink 
          to="/waiter/orders" 
          className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <div className="relative">
            <ClipboardList size={22} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white border border-neutral-900">3</span>
          </div>
          <span className="text-[10px] font-bold uppercase">Đơn</span>
        </NavLink>

        <NavLink 
          to="/waiter/notifications" 
          className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-orange-500' : 'text-gray-500'}`}
        >
          <Bell size={22} />
          <span className="text-[10px] font-bold uppercase">TBáo</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default WaiterLayout;