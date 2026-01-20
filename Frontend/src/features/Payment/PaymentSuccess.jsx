import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Auto redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-neutral-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 rounded-3xl border border-green-500/30 p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle size={64} className="text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">
          {t("payment.success")}
        </h1>

        <p className="text-gray-400 mb-6">{t("payment.successMessage")}</p>

        {sessionId && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">
              {t("payment.transactionId")}
            </p>
            <p className="text-sm text-gray-300 font-mono break-all">
              {sessionId}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>{t("payment.autoRedirect")}</span>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
        >
          {t("payment.backNow")}
        </button>
      </div>
    </div>
  );
}
