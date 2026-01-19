import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, LogOut, Menu as MenuIcon, X, User } from "lucide-react";

const waiterNavItems = [
  { to: "/waiter", label: "Đơn phục vụ", icon: ClipboardList },
  // Thêm các mục khác nếu cần
];

export default function WaiterNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    window.location.href = "/signin";
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 h-16">
        <div className="container mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
          {/* Brand */}
          <Link to="/waiter" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <User className="text-white" size={24} />
            </div>
            <div className="leading-tight">
              <div className="text-white font-black tracking-wide font-display">Lumière Bistro</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">Waiter</div>
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-2">
            {waiterNavItems.map((it) => (
              <WaiterNavLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all active:scale-95"
            >
              <LogOut size={18} className="text-orange-400" />
              Đăng xuất
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 active:scale-95"
            >
              {open ? <X size={22} className="text-orange-400" /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 backdrop-blur-sm ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-neutral-900 z-40 border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out pt-20 px-6 flex flex-col md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="mb-6">
          <div className="text-white font-black text-lg">Waiter Menu</div>
          <div className="text-gray-400 text-sm mt-1">Quản lý phục vụ</div>
        </div>
        <div className="flex flex-col gap-2">
          {waiterNavItems.map((it) => (
            <MobileWaiterLink key={it.to} to={it.to} label={it.label} icon={it.icon} onClick={() => setOpen(false)} />
          ))}
        </div>
        <div className="mt-auto mb-8">
          <button
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all active:scale-95"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
          <p className="text-xs text-gray-600 mt-6 text-center">Waiter Console v1.0.0</p>
        </div>
      </div>
    </>
  );
}

function WaiterNavLink({ to, label, icon: Icon }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/waiter" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={[
        "px-4 py-2 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2",
        active
          ? "bg-orange-500/15 border border-orange-500/20 text-orange-300"
          : "bg-white/0 border border-transparent text-gray-300 hover:bg-white/5 hover:border-white/10 hover:text-white",
      ].join(" ")}
    >
      <Icon size={16} className={active ? "text-orange-400" : "text-gray-400"} />
      {label}
    </Link>
  );
}

function MobileWaiterLink({ to, label, icon: Icon, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/waiter" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={[
        "px-4 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-3 border",
        active
          ? "bg-orange-500/15 border-orange-500/20 text-orange-300"
          : "bg-white/0 border-white/10 text-gray-200 hover:bg-white/5",
      ].join(" ")}
    >
      <Icon size={18} className={active ? "text-orange-400" : "text-gray-400"} />
      {label}
    </Link>
  );
}
