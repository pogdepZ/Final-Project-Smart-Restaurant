import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RequestBillButton from "../../Components/RequestBillButton";
import { formatMoneyVND } from "../../utils/orders";

const OrderStatus = () => {
  const { t } = useTranslation();
  const tableId = localStorage.getItem("tableId");
  const sessionId = localStorage.getItem("sessionId");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("order.tracking.title")}</h1>

      {/* ...existing code for order status display... */}

      {/* Footer Actions */}
      <div className="mt-8 space-y-4">
        {/* Nút quay lại menu */}
        <Link
          to="/menu"
          className="block w-full px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-gray-300 font-medium transition-all"
        >
          {t("order.tracking.viewMenu")}
        </Link>

        {/* Nút yêu cầu thanh toán */}
        {tableId && (
          <RequestBillButton
            tableId={tableId}
            sessionId={sessionId}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
