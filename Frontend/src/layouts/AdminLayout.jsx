import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../Components/AdminNavbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <AdminNavbar />

      {/* chừa khoảng trống vì navbar fixed */}
      <div className="flex-1 pt-16">
        <Outlet />
      </div>

      {/* Footer đơn giản (Màu tối) */}
      <footer className="bg-neutral-900 border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <div className="container mx-auto">
          <p className="mb-2">Smart Restaurant System © 2024</p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="#" className="hover:text-orange-500">
              Chính sách
            </a>
            <a href="#" className="hover:text-orange-500">
              Điều khoản
            </a>
            <a href="#" className="hover:text-orange-500">
              Liên hệ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
