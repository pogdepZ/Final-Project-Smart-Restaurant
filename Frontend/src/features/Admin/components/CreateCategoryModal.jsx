import React, { useState } from "react";
import { X, Layers } from "lucide-react";
import { adminMenuApi } from "../../../services/adminMenuApi";
import { toast } from "react-toastify";

export default function CreateCategoryModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState("active");

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const reset = () => {
    setName("");
    setDescription("");
    setDisplayOrder(0);
    setStatus("active");
    setError("");
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên category.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await adminMenuApi.createCategory({
        name: trimmed,
        description,
        displayOrder: Number(displayOrder) || 0,
        status,
      });
      onSuccess?.();
      toast.success("Thêm category thành công");
      reset();
    } catch (e) {
      setError(e?.response?.data?.message || "Tạo category thất bại.");
      toast.error(e?.response?.data?.message || "Tạo category thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden">
          {/* header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Layers className="text-orange-500" size={18} />
              </div>
              <div>
                <div className="text-white font-black leading-tight">
                  Tạo Category
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Thêm nhóm món mới cho menu
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
              type="button"
              aria-label="Close"
              disabled={isLoading}
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="p-5 space-y-4">
            {error ? (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
                {error}
              </div>
            ) : null}

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Tên category *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Appetizers / Drinks..."
                className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn..."
                rows={3}
                className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Display order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition
                  [&>option]:bg-neutral-900 [&>option]:text-white"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
              type="button"
              disabled={isLoading}
            >
              Huỷ
            </button>

            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition disabled:opacity-60"
              type="button"
              disabled={isLoading}
            >
              {isLoading ? "Đang tạo..." : "Tạo category"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
