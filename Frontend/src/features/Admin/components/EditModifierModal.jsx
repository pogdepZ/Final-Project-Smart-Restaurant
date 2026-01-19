import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { adminModifierApi } from "../../../services/adminModifierApi";

export default function EditModifierModal({ open, item, onClose, onUpdated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setName(item.name || "");
    setDescription(item.description || "");
    setSaving(false);
  }, [open, item]);

  if (!open || !item) return null;

  const submit = async () => {
    const n = name.trim();
    if (!n) return toast.error("Tên modifier không được trống");

    setSaving(true);
    try {
      const res = await adminModifierApi.updateModifier(item.id, {
        name: n,
        description: description.trim(),
      });
      toast.success("Đã cập nhật modifier");
      onUpdated?.(
        res?.item || { ...item, name: n, description: description.trim() },
      );
      onClose?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-950 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">Sửa Modifier</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5">
            <X size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            disabled={saving}
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
