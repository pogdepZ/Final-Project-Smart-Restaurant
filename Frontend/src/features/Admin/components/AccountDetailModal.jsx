import React, { useEffect, useMemo, useState } from "react";
import { X, User, Shield, BadgeCheck, BadgeX } from "lucide-react";
import { toast } from "react-toastify";
import ToggleSwitch from "../../../Components/ToggleSwitch";
import { adminAccountApi } from "../../../services/adminAccountApi";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-white font-semibold text-right break-all">
        {value ?? "—"}
      </div>
    </div>
  );
}

function AvatarBlock({ name, avatarUrl }) {
  const initial = useMemo(() => (name?.trim()?.[0] || "U").toUpperCase(), [name]);
  const [imgOk, setImgOk] = useState(!!avatarUrl);

  useEffect(() => {
    setImgOk(!!avatarUrl);
  }, [avatarUrl]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-26 h-26 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
        {avatarUrl && imgOk ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-orange-200">
            {initial}
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-white font-black text-lg">{name || "—"}</div>
        <div className="text-gray-400 text-sm">{avatarUrl ? "Avatar" : "No avatar"}</div>
      </div>
    </div>
  );
}

export default function AccountDetailModal({ open, item, onClose, onUpdated }) {
  const [loadingActive, setLoadingActive] = useState(false);
  const [activeLocal, setActiveLocal] = useState(true);

  useEffect(() => {
    if (!item) return;
    setActiveLocal(item.is_active ?? true); // fallback true
  }, [item]);

  if (!open || !item) return null;

  const setActive = async (next) => {
    const prev = activeLocal;

    // optimistic
    setActiveLocal(next);
    setLoadingActive(true);

    try {
      const res = await adminAccountApi.setActive(item.id, next);
      toast.success(next ? "Đã set Active" : "Đã set Inactive");

      // báo ngược cho parent cập nhật uiItems nếu muốn
      onUpdated?.(res?.item || { ...item, is_active: next });
    } catch (e) {
      setActiveLocal(prev);
      toast.error(e?.response?.data?.message || "Đổi active thất bại");
    } finally {
      setLoadingActive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-950 border border-white/10 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <User className="text-orange-500" size={18} />
            </div>
            Account detail
          </div>

          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition" type="button">
            <X className="text-gray-300" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* ✅ Avatar on top */}
          <AvatarBlock name={item.name} avatarUrl={item.avatar_url} />

          {/* Detail rows */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <Row label="Email" value={item.email} />
            <Row
              label="Role"
              value={
                <span className="inline-flex items-center gap-2">
                  <Shield size={14} className="text-orange-300" />
                  {item.role || "—"}
                </span>
              }
            />
            <Row
              label="Verified"
              value={
                item.is_verified ? (
                  <span className="inline-flex items-center gap-2 text-green-200">
                    <BadgeCheck size={14} /> true
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-yellow-200">
                    <BadgeX size={14} /> false
                  </span>
                )
              }
            />
            <Row
              label="Created at"
              value={item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "—"}
            />
            <Row label="Preferences" value={item.preferences || "—"} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
