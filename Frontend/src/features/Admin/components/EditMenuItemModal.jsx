import React, { useMemo, useEffect, useRef, useState } from "react";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { adminMenuApi } from "../../../services/adminMenuApi";
import MultiSelectCombobox from "../../../Components/MultiSelectCombobox";
import ScrollArea from "../../../Components/ScrollArea";
import { toast } from "react-toastify";
// import ScrollArea from "../../../Components/ScrollArea";

export default function EditMenuItemModal({
  open,
  item,
  categories = [],
  onClose,
  onUpdated,
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

  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // ✅ upload states
  const fileRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const modifierGroupOptions = useMemo(() => {
    return (modifierGroups || []).map((g) => ({
      value: g.id,
      label: g.name,
      subLabel: `${g.selectionType} • ${g.isRequired ? "required" : "optional"
        } • min ${g.minSelections} / max ${g.maxSelections}`,
    }));
  }, [modifierGroups]);

  // ✅ khóa scroll page ngoài khi mở modal
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !item?.id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        setLoadingGroups(true);

        const [groupsRes, detailRes] = await Promise.all([
          adminMenuApi.getModifierGroups({ status: "active" }),
          adminMenuApi.getMenuItemDetail(item.id),
        ]);

        if (cancelled) return;

        setModifierGroups(groupsRes?.groups || groupsRes?.data?.groups || []);

        const full = detailRes?.item;

        setForm({
          name: full?.name ?? "",
          categoryId: full?.categoryId ?? "",
          price: full?.price ?? "",
          prepTimeMinutes: full?.prepTimeMinutes ?? 0,
          status: full?.status ?? "available",
          description: full?.description ?? "",
          imageUrl: full?.imageUrl ?? "",
        });

        setSelectedGroupIds(
          Array.isArray(full?.modifierGroupIds) ? full.modifierGroupIds : []
        );
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.message || "Không tải được chi tiết món");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingGroups(false);
          setUploadingImage(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item?.id]);

  if (!open) return null;

  const disabledAll = loading || uploadingImage;

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG / PNG / WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");

      const res = await adminMenuApi.uploadMenuImage(file);

      // ⚠️ axiosClient của bạn có interceptor return response.data
      const data = res?.data ? res.data : res;

      // Cloudinary thường trả mấy field này
      const url =
        data?.imageUrl ||
        data?.url ||
        data?.secure_url ||
        data?.result?.secure_url;

      if (!url) {
        toast.error("Upload xong nhưng không nhận được URL ảnh");
        return;
      }

      setForm((s) => ({ ...s, imageUrl: url }));
      toast.success("Đã upload ảnh");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => setForm((s) => ({ ...s, imageUrl: "" }));

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
        imageUrl: form.imageUrl, // ✅ URL từ upload
      };

      await adminMenuApi.updateMenuItem(item.id, payload);
      await adminMenuApi.setMenuItemModifierGroups(item.id, selectedGroupIds);

      onUpdated?.({
        ...item,
        ...payload,
        modifierGroupIds: selectedGroupIds,
      });

      onClose?.();
      toast.success("Chỉnh sửa thành công");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Update thất bại");
      toast.error(
        e?.response?.data?.message || e?.message || "Chỉnh sửa thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => !disabledAll && onClose?.()}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-950 overflow-hidden">
          {/* header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-white font-black">Edit menu item</div>
            <button
              type="button"
              onClick={() => !disabledAll && onClose?.()}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* ✅ body scrollable */}
          <ScrollArea>
            {/* đặt max-height để chỉ cuộn trong modal */}
            <div className="max-h-[70vh] overflow-auto p-5 space-y-3">
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
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Category</label>
                  <select
                    className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white
                    [&>option]:bg-neutral-900 [&>option]:text-white"
                    value={form.categoryId ?? ""}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, categoryId: e.target.value }))
                    }
                    disabled={disabledAll}
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
                    className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white
                    [&>option]:bg-neutral-900 [&>option]:text-white"
                    value={form.status}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, status: e.target.value }))
                    }
                    disabled={disabledAll}
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
                    onChange={(e) =>
                      setForm((s) => ({ ...s, price: e.target.value }))
                    }
                    disabled={disabledAll}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Prep (phút)</label>
                  <input
                    type="number"
                    className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                    value={form.prepTimeMinutes}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, prepTimeMinutes: e.target.value }))
                    }
                    disabled={disabledAll}
                  />
                </div>
              </div>

              {/* Image preview + upload */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">Ảnh món</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Upload ảnh mới để thay đổi (JPG/PNG/WEBP, tối đa 5MB)
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFileChange}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onPickFile}
                      disabled={disabledAll}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl
                        bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition disabled:opacity-60"
                    >
                      <Upload size={16} />
                      {uploadingImage ? "Đang upload..." : "Upload"}
                    </button>

                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={disabledAll || !form.imageUrl}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl
                        bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-60"
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {form.imageUrl ? (
                    <div className="flex items-start gap-3">
                      <div className="w-24 h-24 rounded-2xl border border-white/10 bg-neutral-950 overflow-hidden shrink-0">
                        <img
                          src={form.imageUrl}
                          alt="menu"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-400">Preview</div>
                        <div className="mt-2 text-xs text-gray-500">
                          Upload ảnh mới sẽ tự thay thế.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-950/60 border border-white/10 flex items-center justify-center">
                        <ImageIcon size={18} className="text-gray-400" />
                      </div>
                      Chưa có ảnh. Bấm{" "}
                      <span className="text-gray-200 font-semibold">Upload</span>{" "}
                      để thêm.
                    </div>
                  )}
                </div>
              </div>

              {/* Modifiers */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">Modifiers cho món</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Chọn các nhóm tuỳ chọn (Size, Topping, Spicy…)
                    </div>
                  </div>
                  {loadingGroups ? (
                    <div className="text-xs text-gray-500">Đang tải...</div>
                  ) : null}
                </div>

                <div className="mt-3">
                  <MultiSelectCombobox
                    options={modifierGroupOptions}
                    value={selectedGroupIds}
                    onChange={setSelectedGroupIds}
                    placeholder="Chọn modifier groups..."
                    disabled={loadingGroups || disabledAll}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Description</label>
                <textarea
                  className="mt-1 w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-white"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </div>
            </div>
          </ScrollArea>

          {/* footer */}
          <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => !disabledAll && onClose?.()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200"
              disabled={disabledAll}
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-200"
              disabled={disabledAll}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
