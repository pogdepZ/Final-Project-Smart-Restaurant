import React from "react";
import { NavLink } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBag,
  Receipt,
  User,
  History,
} from "lucide-react";
import { useSelector } from "react-redux";
import { selectTotalItems } from "../store/slices/cartSlice";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const { t } = useTranslation();
  // Lấy số lượng trong giỏ hàng từ Redux
  const cartItemCount = useSelector(selectTotalItems);

  const navItems = [
    {
      path: "/",
      icon: <UtensilsCrossed size={22} />,
      label: t("navbar.menu"),
      key: "menu",
    },
    {
      path: "/order/status",
      icon: <History size={22} />,
      label: t("navbar.orderTracking"),
      key: "orderTracking",
    },
    {
      path: "/cart",
      icon: <ShoppingBag size={22} />,
      label: t("navbar.cart"),
      badge: cartItemCount,
      key: "cart",
    },
    {
      path: "/bill",
      icon: <Receipt size={22} />,
      label: t("bill.title"),
      key: "bill",
    },
    {
      path: "/profile",
      icon: <User size={22} />,
      label: t("profile.me"),
      key: "profile",
    },
  ];

  return (
    <nav className="h-15 bg-white border-t border-gray-200 flex justify-around items-center px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center w-full h-full transition-colors duration-200 
            ${isActive ? "text-orange-500 font-medium" : "text-gray-400 hover:text-gray-600"}`
          }
        >
          {/* Icon container */}
          <div className="relative">
            {item.icon}

            {/* Badge thông báo số lượng (Chỉ hiện cho Giỏ hàng nếu > 0) */}
            {item.key === "cart" && item.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {item.badge}
              </span>
            )}
          </div>

          {/* Label */}
          <span className="text-[10px] mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
