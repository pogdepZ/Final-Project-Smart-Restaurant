import React from 'react';
import { Outlet } from "react-router-dom";
import { ChefHat, Clock, Bell } from 'lucide-react';

const KitchenLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white font-sans overflow-hidden">
      
      {/* KITCHEN HEADER */}
      <header className="h-20 bg-neutral-900 border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-white">Kitchen Display</h1>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-2xl font-black font-mono text-white">19:42</p>
            <p className="text-xs text-gray-500 uppercase">Current Time</p>
          </div>
          <button className="p-3 bg-white/5 hover:bg-orange-500 hover:text-white rounded-full transition-all relative">
            <Bell size={24} />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900"></span>
          </button>
        </div>
      </header>

      {/* MAIN KITCHEN BOARD */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-[#0a0a0a]">
        {/* Layout này dành cho chế độ xem ngang (Horizontal Scroll) hoặc Grid */}
        <div className="h-full w-full">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default KitchenLayout;