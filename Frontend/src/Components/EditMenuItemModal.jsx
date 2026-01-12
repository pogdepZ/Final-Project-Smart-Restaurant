import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { adminMenuApi } from "../services/adminMenuApi";

export default function EditMenuItemModal({
  open,
  item,
  categories = [],
  onClose,
  onUpdated, // (updatedItem) => void
}) {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    price: "",
    prepTimeMinutes: 0,
    status: "available",
    description: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !item?.id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        // ✅ lấy chi tiết item từ backend
        const res = await adminMenuApi.getMenuItemDetail(item.id);
        const full = res?.item;

        if (cancelled) return;

        setForm({
          name: full?.name ?? "",
          categoryId: full?.categoryId ?? "",
          price: full?.price ?? "",
          prepTimeMinutes: full?.prepTimeMinutes ?? 0,
          status: full?.status ?? "available",
          description: full?.description ?? "",
          imageUrl: full?.imageUrl ?? "",
        });
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || "Không tải được chi tiết món");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item?.id]);


  if (!open) return null;

  const submit = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        price: Number(form.price),
        prepTimeMinutes: Number(form.prepTimeMinutes || 0),
        status: form.status,
        description: form.description,
        imageUrl: form.imageUrl,
      };

      await adminMenuApi.updateMenuItem(item.id, payload);

      onUpdated?.({ ...item, ...payload });
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || "Update thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={() => !loading && onClose?.()} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-950 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-white font-black">Edit menu item</div>
            <button
              type="button"
              onClick={() => !loading && onClose?.()}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-3">
            {error ? (
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
                {error}
              </div>
            ) : null}

            <div>
              <label className="text-xs text-gray-400">Tên món</label>
              <input
                className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Category</label>
                <select
                  className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                  value={form.categoryId ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
                >
                  <option value="">
                    {item?.categoryName ? `${item.categoryName}` : "-- chọn --"}
                  </option>

                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400">Status</label>
                <select
                  className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                  value={form.status}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                >
                  <option value="available">available</option>
                  <option value="unavailable">unavailable</option>
                  <option value="sold_out">sold_out</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Giá</label>
                <input
                  type="number"
                  className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                  value={form.price}
                  onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Prep (phút)</label>
                <input
                  type="number"
                  className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                  value={form.prepTimeMinutes}
                  onChange={(e) => setForm((s) => ({ ...s, prepTimeMinutes: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Description</label>
              <textarea
                className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400">Image URL</label>
              <input
                className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                value={form.imageUrl}
                onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => !loading && onClose?.()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200"
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-200"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
