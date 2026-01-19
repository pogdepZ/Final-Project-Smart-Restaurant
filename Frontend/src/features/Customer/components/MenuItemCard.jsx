import React from "react";
import { Flame, Check, ShoppingBag } from "lucide-react";
import { formatMoneyVND } from "../../../utils/orders";

export default function MenuItemCard({ item, onSelect, onAddToCart, added }) {
  return (
    <div
      onClick={() => onSelect(item)}
      className="group flex gap-4 bg-transparent hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5 cursor-pointer"
    >
      <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden relative bg-white/5">
        <img
          src={
            item.image || "https://via.placeholder.com/400x400?text=No+Image"
          }
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {item.status && item.status !== "available" && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-xs font-bold">
            {item.status}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">
              {item.name}
            </h3>
            {item.is_chef_recommended && (
              <Flame
                size={14}
                className="text-orange-500 fill-orange-500 ml-2 shrink-0"
              />
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {item.description}
          </p>
        </div>

        <div className="flex justify-between items-end mt-2">
          <span className="text-xl font-black text-white">
            {formatMoneyVND(Number(item.price))}
          </span>
        </div>
      </div>
    </div>
  );
}
