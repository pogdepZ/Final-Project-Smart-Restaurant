import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Components/NavBar';

const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Navbar luôn ở trên cùng */}
      <Navbar />

      {/* Nội dung chính */}
      <main className="flex-1 pt-16"> 
        <Outlet />
      </main>

      {/* Footer đơn giản (Màu tối) */}
      <footer className="bg-neutral-900 border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <div className="container mx-auto">
          <p className="mb-2">Smart Restaurant System © 2024</p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="#" className="hover:text-orange-500">Chính sách</a>
            <a href="#" className="hover:text-orange-500">Điều khoản</a>
            <a href="#" className="hover:text-orange-500">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;