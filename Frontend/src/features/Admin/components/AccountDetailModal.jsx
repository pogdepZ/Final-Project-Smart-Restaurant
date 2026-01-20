import React, { useEffect, useMemo, useState } from "react";
import { X, User, Shield, BadgeCheck, BadgeX, Pencil, Save, Ban } from "lucide-react";
import { toast } from "react-toastify";
import { adminAccountApi } from "../../../services/adminAccountApi";
import ToggleSwitch from "../../../Components/ToggleSwitch";

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
  const initial = useMemo(() => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord[0]?.toUpperCase() || "U";
  }, [name]);

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

const ROLE_OPTIONS = [
  { value: "admin", label: "admin" },
  { value: "waiter", label: "waiter" },
  { value: "kitchen", label: "kitchen" },
  // customer: không cho edit
];

export default function AccountDetailModal({ open, item, onClose, onUpdated }) {
  const [loadingActive, setLoadingActive] = useState(false);
  const [activeLocal, setActiveLocal] = useState(true);

  // ====== EDIT STATE ======
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState({ name: "", role: "" });

  const roleLower = String(item?.role || "").toLowerCase();
  const isCustomer = roleLower === "customer";
  const canEditRole = useMemo(() => roleLower !== "customer", [roleLower]);

  useEffect(() => {
    if (!item) return;
    // ✅ DB field: is_actived
    setActiveLocal(Boolean(item.is_actived));
    setDraft({
      name: item.name ?? "",
      role: item.role ?? "",
    });
    setEditing(false);
    setSaving(false);
  }, [item]);

  // lock scroll (an toàn hơn: lock cả html)
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;

    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtml || "";
      document.body.style.overflow = prevBody || "";
    };
  }, [open]);

  if (!open || !item) return null;

  const setActive = async (next) => {
    if (!item?.id) return;

    const prev = activeLocal;

    // optimistic
    setActiveLocal(next);
    setLoadingActive(true);

    try {
      // ✅ payload đúng DB field
      // Nếu service của bạn là setActived(id, nextBool) thì đổi lại cho đúng
      const res = await adminAccountApi.setActived(item.id, next);

      // tuỳ backend trả về {item} hay trả thẳng user
      const updated = res?.item || res || { ...item, is_actived: next };
      const finalValue = Boolean(updated?.is_actived);

      setActiveLocal(finalValue);
      toast.success(finalValue ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hoá tài khoản");

      onUpdated?.(updated);
    } catch (e) {
      setActiveLocal(prev);
      toast.error(e?.response?.data?.message || "Không thể đổi trạng thái. Vui lòng thử lại.");
    } finally {
      setLoadingActive(false);
    }
  };

  const startEdit = () => {
    if (isCustomer) return;
    setDraft({
      name: item.name ?? "",
      role: item.role ?? "",
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft({
      name: item.name ?? "",
      role: item.role ?? "",
    });
    setEditing(false);
  };

  const saveEdit = async () => {
    const nameTrim = String(draft.name || "").trim();
    if (!nameTrim) {
      toast.error("Tên không được để trống");
      return;
    }

    const payload = {
      name: nameTrim,
      ...(canEditRole ? { role: String(draft.role || "").toLowerCase() } : {}),
    };

    setSaving(true);
    try {
      const res = await adminAccountApi.updateAccount(item.id, payload);
      toast.success("Đã cập nhật tài khoản");
      setEditing(false);

      onUpdated?.(res?.item || { ...item, ...payload });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className="w-full max-w-xl rounded-2xl bg-neutral-950 border border-white/10 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()} // ✅ để click trong modal không bị overlay nuốt
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <User className="text-orange-500" size={18} />
              </div>
              Account detail
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 transition"
              type="button"
              aria-label="Close"
            >
              <X className="text-gray-300" size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            <AvatarBlock name={item.name} avatarUrl={item.avatar_url} />

            {/* Edit actions */}
            <div className="flex items-center justify-end gap-2">
              {!isCustomer &&
                (!editing ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-60"
                    >
                      <Ban size={16} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition disabled:opacity-60"
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                ))}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              {/* Name (editable) */}
              <Row
                label="Name"
                value={
                  editing ? (
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      className="w-64 max-w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                        focus:outline-none focus:border-orange-500/40"
                      placeholder="Tên..."
                      disabled={saving}
                    />
                  ) : (
                    item.name
                  )
                }
              />

              <Row label="Email" value={item.email} />

              {/* Role */}
              <Row
                label="Role"
                value={
                  editing ? (
                    <select
                      value={String(draft.role || "").toLowerCase()}
                      onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                      disabled={saving}
                      className="rounded-xl px-3 py-2 text-sm bg-neutral-950 text-white border border-white/10
                        focus:outline-none focus:border-orange-500/40 [&>option]:bg-neutral-950 [&>option]:text-white"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Shield size={14} className="text-orange-300" />
                      {item.role || "—"}
                    </span>
                  )
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

            {/* ✅ Active toggle (giống ngoài page) */}
            <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-3">
              <div>
                <div className="text-white font-bold text-sm">Active</div>
                <div className="text-xs text-gray-400">Bật/tắt tài khoản</div>
              </div>

              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={!!activeLocal}
                  disabled={loadingActive}
                  onChange={(next) => setActive(next)}
                  label="Active"
                />

                <span
                  className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold
                    ${activeLocal
                      ? "bg-green-500/10 text-green-200 border-green-500/20"
                      : "bg-red-500/10 text-red-200 border-red-500/20"
                    }`}
                >
                  {loadingActive ? "..." : activeLocal ? "Active" : "Inactive"}
                </span>
              </div>
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
    </div>
  );
}
