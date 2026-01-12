import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../Components/AdminNavbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <AdminNavbar />

      {/* chừa khoảng trống vì navbar fixed */}
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}
