import React from "react";
import { Clock, ChefHat, CheckCircle, Loader2, XCircle } from "lucide-react";

const statusConfig = {
  Queued: {
    icon: Clock,
    label: "Đang chờ",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/20",
    progressColor: "bg-gray-500",
    progressWidth: "33%",
  },
  Cooking: {
    icon: ChefHat,
    label: "Đang nấu",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/20",
    progressColor: "bg-orange-500",
    progressWidth: "66%",
  },
  Ready: {
    icon: CheckCircle,
    label: "Sẵn sàng",
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    borderColor: "border-green-500/20",
    progressColor: "bg-green-500",
    progressWidth: "100%",
  },
  Rejected: {
    icon: XCircle,
    label: "Từ chối",
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
    borderColor: "border-red-500/20",
    progressColor: "bg-red-500",
    progressWidth: "0%",
  },
};

const OrderItemStatus = ({ item }) => {
  const config = statusConfig[item.status] || statusConfig.Queued;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
      {/* Item Image */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 shrink-0">
            <ChefHat size={24} />
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-white truncate">{item.name}</h4>
          <span className="text-sm text-gray-400 ml-2">x{item.quantity}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full ${config.progressColor} transition-all duration-500 ease-out`}
            style={{ width: config.progressWidth }}
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
          >
            {item.status === "Cooking" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Icon size={12} />
            )}
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemStatus;
