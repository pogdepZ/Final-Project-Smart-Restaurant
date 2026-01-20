import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { stripeApi } from "../services/stripeApi";
import { formatMoneyVND } from "../utils/orders";

const StripeCheckoutForm = ({
  amount,
  tableId,
  tableName,
  onSuccess,
  onCancel,
  paymentIntentId,
}) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle, processing, succeeded, failed
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      // Xác nhận thanh toán với Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentStatus("failed");
        setErrorMessage(error.message);
        toast.error(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Xác nhận với backend để cập nhật database
        const result = await stripeApi.confirmPayment(paymentIntent.id);

        if (result.success) {
          setPaymentStatus("succeeded");
          toast.success(t("bill.paymentSuccess"));

          setTimeout(() => {
            if (onSuccess) onSuccess(result);
          }, 1500);
        } else {
          throw new Error(result.message || t("stripe.confirmError"));
        }
      }
    } catch (err) {
      setPaymentStatus("failed");
      setErrorMessage(err.message || t("stripe.genericError"));
      toast.error(err.message || t("stripe.paymentError"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Render based on payment status
  if (paymentStatus === "succeeded") {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {t("bill.paymentSuccess")}
        </h3>
        <p className="text-gray-400">{t("stripe.thankYouMessage")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/10">
        <p className="text-gray-400 text-sm">
          {t("stripe.paymentFor")} {tableName}
        </p>
        <p className="text-3xl font-bold text-orange-500 mt-1">
          {formatMoneyVND(amount)}
        </p>
      </div>

      {/* Stripe Payment Element */}
      <div className="bg-white rounded-xl p-4">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <XCircle size={18} />
          {errorMessage}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-2 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            t("stripe.payAmount", { amount: formatMoneyVND(amount) })
          )}
        </button>
      </div>

      {/* Security Note */}
      <p className="text-center text-gray-500 text-xs">
        🔒 {t("stripe.securedByStripe")}
      </p>
    </form>
  );
};

export default StripeCheckoutForm;
