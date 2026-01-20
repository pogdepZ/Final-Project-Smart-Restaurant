import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function OrderStatusNotification({ message, status, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIconAndColor = () => {
    switch (status) {
      case "ready":
        return {
          Icon: CheckCircle2,
          color: "text-green-500",
          bg: "bg-green-500/10",
        };
      case "preparing":
        return {
          Icon: Clock,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
        };
      case "rejected":
        return {
          Icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
        };
      default:
        return {
          Icon: CheckCircle2,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        };
    }
  };

  const { Icon, color, bg } = getIconAndColor();

  return (
    <div
      className={`fixed top-20 right-4 max-w-sm ${bg} border border-white/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top`}
    >
      <Icon size={24} className={color} />
      <p className="text-white text-sm font-medium">{message}</p>
    </div>
  );
}
