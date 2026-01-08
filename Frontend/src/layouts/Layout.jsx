import React from 'react';
import { Outlet } from "react-router-dom";
import Header from "../Components/Header";
import BottomNav from "../Components/BottomNav";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header cố định ở trên */}
      <Header />

      {/* Main Content:
         - pt-16: Padding top 4rem (64px) để tránh bị Header che (Header h-16)
         - pb-20: Padding bottom 5rem (80px) để tránh bị BottomNav che (BottomNav h-[60px])
      */}
      <main className="flex-1 pt-16 pb-20 container mx-auto px-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* BottomNav cố định ở dưới (Chỉ hiện trên Mobile/Tablet) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <BottomNav />
      </div>

      {/* Footer cho Desktop (Optional - Ẩn trên mobile) */}
      <div className="hidden md:block bg-white py-4 text-center border-t">
        <p className="text-sm text-gray-500">© 2024 Smart Restaurant System</p>
      </div>
    </div>
  );
};

export default Layout;