import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import StripeCheckoutForm from "./StripeCheckoutForm";

// Component này sẽ được lazy load
const StripePaymentWrapper = ({
  stripePromise,
  clientSecret,
  amount,
  tableId,
  tableName,
  onSuccess,
  onCancel,
}) => {
  // Kiểm tra đồng bộ - không cần state
  const isReady = stripePromise && clientSecret;

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-purple-500" />
        <span className="ml-2 text-gray-400">Đang tải thanh toán...</span>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#f97316",
            colorBackground: "#171717",
            colorText: "#ffffff",
            colorDanger: "#ef4444",
            borderRadius: "12px",
          },
        },
      }}
    >
      <StripeCheckoutForm
        amount={amount}
        tableId={tableId}
        tableName={tableName}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

export default StripePaymentWrapper;
