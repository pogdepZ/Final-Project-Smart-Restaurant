import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItems,
  selectTotalItems,
  clearCartLocal,
  removeFromCartLocal,
  incrementLocal,
  decrementLocal,
  syncCartToDb,
  buildLineKey,
  updateCartLineLocal,
} from "../../store/slices/cartSlice";

import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  X,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import FoodDetailPopup from "./DetailFoodPopup";
import tableApi from "../../services/tableApi";
import { formatMoneyVND } from "../../utils/orders";

const calcModifierExtra = (modifiers = []) =>
  (modifiers || []).reduce(
    (sum, m) => sum + Number(m.price || m.price_adjustment || 0),
    0,
  );

const Cart = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tableCode } = useParams();

  const cartItems = useSelector(selectCartItems);
  const totalItems = useSelector(selectTotalItems);

  // ✅ state mở popup edit
  const [editingItem, setEditingItem] = useState(null);

  const handleRemoveItem = (e, item) => {
    e.stopPropagation();
    const lineKey = item.lineKey || buildLineKey(item.id, item.modifiers);
    dispatch(removeFromCartLocal({ lineKey }));
    toast.info(t("cart.removeItem"));
  };

  const handleIncrement = (e, item) => {
    e.stopPropagation();
    const lineKey = item.lineKey || buildLineKey(item.id, item.modifiers);
    dispatch(incrementLocal({ lineKey }));
  };

  const handleDecrement = (e, item) => {
    e.stopPropagation();
    const lineKey = item.lineKey || buildLineKey(item.id, item.modifiers);
    dispatch(decrementLocal({ lineKey }));
  };

  const handleClearCart = () => {
    if (window.confirm(t("cart.clearCartConfirm"))) {
      dispatch(clearCartLocal());
      toast.success(t("cart.clearCart"));
    }
  };

  const handleCheckout = async () => {
    const qrToken = localStorage.getItem("qrToken");
    if (!qrToken) {
      toast.warning(t("cart.scanQRFirst"));
      navigate(`/menu/`);
      return;
    }

    const sessionToken = localStorage.getItem("sessionToken");
    const tableCode = localStorage.getItem("tableCode");

    const isValidSession = await tableApi.validateSession(
      tableCode,
      sessionToken,
    );

    if (isValidSession && isValidSession.data.valid === false) {
      localStorage.removeItem("qrToken");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("tableSessionId");
      localStorage.removeItem("tableCode");
      localStorage.removeItem("tableNumber");
      localStorage.removeItem("tableSession");
      toast.warning(t("cart.sessionExpired"));
      navigate(tableCode ? `/menu/${tableCode}` : "/scan");
      return;
    }

    console.log("Session validation:", isValidSession);

    if (!sessionToken) {
      toast.warning(t("cart.sessionExpired"));
      navigate(tableCode ? `/menu/${tableCode}` : "/scan");
      return;
    }

    const sessionId = localStorage.getItem("tableSessionId");

    // Lấy userId từ localStorage hoặc Redux store (nếu user đã đăng nhập)
    const userId = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")).id
      : null;

    console.log("Checking out with:", { qrToken, sessionId, userId });

    try {
      await dispatch(
        syncCartToDb({
          qrToken,
          sessionId: sessionId,
          userId,
        }),
      ).unwrap();
      toast.success(t("cart.orderSuccess"));
      navigate("/menu");
    } catch (e) {
      toast.error(e?.message || t("cart.orderFailed"));
    }
  };

  const computed = useMemo(() => {
    const items = (cartItems || []).map((it) => {
      const base = Number(it.price || 0);
      const extra = calcModifierExtra(it.modifiers);
      const unit = base + extra;
      const qty = Number(it.quantity || 0);
      return {
        ...it,
        extra,
        unit,
        lineTotal: unit * qty,
        lineKey: it.lineKey || buildLineKey(it.id, it.modifiers),
      };
    });

    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    return { items, subtotal };
  }, [cartItems]);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-neutral-900 flex items-center justify-center">
            <ShoppingCart size={64} className="text-gray-600" />
          </div>
          <h2 className="text-3xl font-black mb-3 text-gray-300">
            {t("cart.empty")}
          </h2>
          <p className="text-gray-500 mb-8">{t("cart.emptyDescription")}</p>
          <Link
            to={tableCode ? `/menu/${tableCode}` : "/menu"}
            className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-all shadow-lg shadow-orange-500/20 hover:scale-105"
          >
            <ShoppingBag size={20} />
            {t("cart.goToMenu")}
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = computed.subtotal;
  const serviceFee = subtotal * 0.1;
  const grandTotal = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-32">
      <div className="sticky top-0 z-20 bg-neutral-950/98 backdrop-blur-2xl border-b border-white/10 py-6">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                {t("cart.title").toUpperCase()}
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {t("cart.items", { count: totalItems })}
              </p>
            </div>

            <button
              onClick={handleClearCart}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 size={16} />
              Xóa tất cả
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pt-6">
        <div className="space-y-4">
          {computed.items.map((item) => (
            <div
              key={item.lineKey}
              onClick={() => setEditingItem(item)} // ✅ click mở popup sửa
              className="cursor-pointer group bg-neutral-900 hover:bg-neutral-800 rounded-2xl p-4 transition-all duration-300 border border-white/5 hover:border-orange-500/20"
              title={t("cart.clickToEdit")}
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-neutral-800">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">
                        {item.name}
                      </h3>

                      <button
                        onClick={(e) => handleRemoveItem(e, item)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {Array.isArray(item.modifiers) &&
                    item.modifiers.length > 0 ? (
                      <div className="mt-2 text-xs text-gray-300 space-y-1">
                        {item.modifiers.map((m, i) => (
                          <div
                            key={`${item.lineKey}-m-${i}`}
                            className="flex justify-between gap-2"
                          >
                            <span className="text-gray-400">
                              • {m.group_name ? `${m.group_name}: ` : ""}
                              <span className="text-gray-200 font-semibold">
                                {m.name}
                              </span>
                            </span>
                            <span className="text-orange-300 font-bold">
                              {Number(m.price || 0) > 0
                                ? `+${formatMoneyVND(m.price)}`
                                : "+0₫"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-500 italic">
                        (Nhấn để chọn tuỳ chọn)
                      </div>
                    )}

                    {item.note ? (
                      <div className="mt-2 text-[11px] text-gray-500 italic">
                        Ghi chú: {item.note}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-orange-500">
                        {formatMoneyVND(item.lineTotal)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMoneyVND(item.unit)} × {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-neutral-800 rounded-full p-1">
                      <button
                        onClick={(e) => handleDecrement(e, item)}
                        className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-orange-500 text-white flex items-center justify-center transition-all active:scale-90"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="text-lg font-bold w-8 text-center">
                        {item.quantity}
                      </span>

                      <button
                        onClick={(e) => handleIncrement(e, item)}
                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-neutral-900 rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold mb-4 text-gray-300">
            {t("cart.orderDetails")}
          </h3>

          <div className="flex justify-between text-gray-400">
            <span>{t("cart.itemsTotal", { count: totalItems })}</span>
            <span className="font-semibold">{formatMoneyVND(subtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-400 mt-2">
            <span>{t("cart.serviceFee")}</span>
            <span className="font-semibold">{formatMoneyVND(serviceFee)}</span>
          </div>

          <div className="h-px bg-white/10 my-3" />

          <div className="flex justify-between text-xl font-black">
            <span className="text-white">{t("cart.total")}</span>
            <span className="text-orange-500">
              {formatMoneyVND(grandTotal)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full mt-6 flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95"
          >
            <span>{t("cart.placeOrder")}</span>
            <ArrowRight size={20} />
          </button>

          <Link
            to={tableCode ? `/menu/${tableCode}` : "/menu"}
            className="block text-center mt-4 text-sm text-gray-400 hover:text-orange-500 transition-colors"
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      </div>

      {/* ✅ Popup edit modifiers */}
      {editingItem && (
        <FoodDetailPopup
          food={{
            id: editingItem.id,
            name: editingItem.name,
            price: editingItem.price,
            image: editingItem.image,
            status: "available",
          }}
          mode="edit"
          initial={{
            quantity: editingItem.quantity,
            note: editingItem.note || "",
            modifiers: editingItem.modifiers || [],
          }}
          onClose={() => setEditingItem(null)}
          onConfirm={(payload) => {
            dispatch(
              updateCartLineLocal({
                fromLineKey: editingItem.lineKey,
                next: payload,
              }),
            );
            setEditingItem(null);
            toast.success(t("cart.optionsUpdated"));
          }}
        />
      )}
    </div>
  );
};

export default Cart;
