import { useTranslation } from "react-i18next";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  danger = false,
  onConfirm,
  onClose,
  loading = false,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !loading && onClose?.()}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl">
          <div className="p-5">
            <div className="text-white font-black text-lg">
              {title || t("common.confirm")}
            </div>
            {description ? (
              <div className="text-gray-400 text-sm mt-2">{description}</div>
            ) : null}
          </div>

          <div className="px-5 pb-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            >
              {cancelText || t("common.cancel")}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-xl border ${
                danger
                  ? "bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
                  : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
              }`}
            >
              {loading
                ? t("common.processing")
                : confirmText || t("common.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
