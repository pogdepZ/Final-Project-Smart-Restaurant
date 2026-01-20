import React, { useMemo, useState } from "react";
import { X, Eye, EyeOff, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChangePasswordModal({
  open,
  onClose,
  onSubmit, // async ({ currentPassword, newPassword }) => void
  isSubmitting = false,
}) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const canSave = useMemo(() => {
    if (!currentPassword) return false;
    if (!newPassword || newPassword.length < 6) return false;
    if (newPassword !== confirmNew) return false;
    if (currentPassword === newPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmNew]);

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
    // reset nhẹ để lần sau mở sạch
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNew("");
    setShowCur(false);
    setShowNew(false);
  };

  const handleSubmit = async () => {
    if (!canSave || isSubmitting) return;
    await onSubmit?.({ currentPassword, newPassword });
    // nếu submit ok thì parent sẽ close, nhưng cứ reset cho chắc
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNew("");
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
      />

      <div className="relative mx-auto mt-20 w-[92%] max-w-lg rounded-3xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-black text-lg">
              {t("profile.changePasswordTitle")}
            </h3>
            <p className="text-white/50 text-xs mt-1">
              {t("profile.changePasswordDesc")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/5 text-white/70"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              {t("profile.currentPassword")}
            </label>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/0">
              <Lock className="text-orange-400" size={18} />
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type={showCur ? "text" : "password"}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-white placeholder:text-gray-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCur((v) => !v)}
                className="text-white/60 hover:text-white"
              >
                {showCur ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              {t("profile.newPassword")}
            </label>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/0">
              <Lock className="text-orange-400" size={18} />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type={showNew ? "text" : "password"}
                placeholder={t("profile.passwordMinLength")}
                className="w-full bg-transparent outline-none text-white placeholder:text-gray-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="text-white/60 hover:text-white"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {newPassword && newPassword.length < 6 ? (
              <p className="text-xs text-red-300">
                {t("profile.passwordMinLength")}
              </p>
            ) : null}
            {currentPassword &&
            newPassword &&
            currentPassword === newPassword ? (
              <p className="text-xs text-red-300">
                {t("profile.passwordMismatch")}
              </p>
            ) : null}
          </div>

          {/* Confirm new */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              {t("profile.confirmPassword")}
            </label>

            <input
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/0 text-white outline-none placeholder:text-gray-500"
            />

            {confirmNew && newPassword !== confirmNew ? (
              <p className="text-xs text-red-300">
                {t("profile.passwordMismatch")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-1/3 py-3 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 font-bold"
          >
            {t("profile.cancel")}
          </button>

          <button
            type="button"
            disabled={!canSave || isSubmitting}
            onClick={handleSubmit}
            className={[
              "w-2/3 py-3 rounded-xl font-black flex items-center justify-center gap-2",
              "bg-linear-to-r from-orange-500 to-red-600 text-white",
              !canSave || isSubmitting
                ? "opacity-60 cursor-not-allowed"
                : "hover:opacity-95",
            ].join(" ")}
          >
            {isSubmitting ? t("profile.changing") : t("profile.changePassword")}
          </button>
        </div>
      </div>
    </div>
  );
}
