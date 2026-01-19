import React, { useMemo, useEffect, useRef, useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { adminMenuApi } from "../../../services/adminMenuApi";
import MultiSelectCombobox from "../../../Components/MultiSelectCombobox";
import ScrollArea from "../../../Components/ScrollArea";
import { toast } from "react-toastify";

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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Photos
  const fileRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [photos, setPhotos] = useState([]); // [{id,url,isPrimary,createdAt}]
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const modifierGroupOptions = useMemo(() => {
    return (modifierGroups || []).map((g) => ({
      value: g.id,
      label: g.name,
      subLabel: `${g.selectionType} • ${g.isRequired ? "required" : "optional"} • min ${g.minSelections} / max ${g.maxSelections}`,
    }));
  }, [modifierGroups]);

  // lock body scroll when modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // Load item detail + photos + modifier groups
  useEffect(() => {
    if (!open || !item?.id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setLoadingGroups(true);
        setLoadingPhotos(true);

        const [groupsRes, detailRes, photosRes] = await Promise.all([
          adminMenuApi.getModifierGroups({ status: "active" }),
          adminMenuApi.getMenuItemDetail(item.id),
          adminMenuApi.getMenuItemPhotos(item.id),
        ]);

        if (cancelled) return;

        setModifierGroups(groupsRes?.groups || groupsRes?.data?.groups || []);
        setPhotos(photosRes?.photos || []);

        const full = detailRes?.item;

        setForm({
          name: full?.name ?? "",
          categoryId: full?.categoryId ?? "",
          price: full?.price ?? "",
          prepTimeMinutes: full?.prepTimeMinutes ?? 0,
          status: full?.status ?? "available",
          description: full?.description ?? "",
        });

        setSelectedGroupIds(
          Array.isArray(full?.modifierGroupIds) ? full.modifierGroupIds : [],
        );
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Không tải được chi tiết món");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingGroups(false);
          setLoadingPhotos(false);
          setUploadingImage(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item?.id]);

  if (!open) return null;

  const disabledAll = loading || uploadingImage || loadingPhotos;

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    // validate types + size (each)
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const f of files) {
      if (!okTypes.includes(f.type)) {
        toast.error("Chỉ hỗ trợ JPG / PNG / WEBP");
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Mỗi ảnh tối đa 5MB");
        return;
      }
    }

    try {
      setUploadingImage(true);
      setError("");

      const res = await adminMenuApi.uploadMenuItemPhotos(item.id, files);
      setPhotos(res?.photos || []);
      toast.success("Upload ảnh thành công");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  };

  const setPrimary = async (photoId) => {
    try {
      const res = await adminMenuApi.setPrimaryMenuItemPhoto(item.id, photoId);
      setPhotos(res?.photos || []);
      toast.success("Đã đổi ảnh hiển thị");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không thể đổi ảnh hiển thị");
    }
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm("Xoá ảnh này?")) return;

    try {
      const res = await adminMenuApi.deleteMenuItemPhoto(item.id, photoId);
      setPhotos(res?.photos || []);
      toast.success("Đã xoá ảnh");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không thể xoá ảnh");
    }
  };

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
        // ❌ không gửi imageUrl nữa vì ảnh nằm ở menu_item_photos
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
        e?.response?.data?.message || e?.message || "Chỉnh sửa thất bại",
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

          {/* body */}
          <ScrollArea>
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
                      {item?.categoryName
                        ? `${item.categoryName}`
                        : "-- chọn --"}
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
                      setForm((s) => ({
                        ...s,
                        prepTimeMinutes: e.target.value,
                      }))
                    }
                    disabled={disabledAll}
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">Ảnh món</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Upload nhiều ảnh • chọn 1 ảnh làm ảnh hiển thị
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFileChange}
                  />

                  <button
                    type="button"
                    onClick={onPickFile}
                    disabled={disabledAll}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl
                      bg-orange-500/20 border border-orange-500/30 text-orange-200 disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {uploadingImage ? "Đang upload..." : "Upload"}
                  </button>
                </div>

                {loadingPhotos ? (
                  <div className="mt-4 text-sm text-gray-400">
                    Đang tải ảnh...
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className={`relative group rounded-xl overflow-hidden border
                        ${p.isPrimary ? "border-orange-500" : "border-white/10"}`}
                      >
                        <img
                          src={p.url}
                          alt=""
                          className="w-full h-24 object-cover"
                        />

                        {p.isPrimary && (
                          <div className="absolute top-1 left-1 text-[10px] bg-orange-500 text-black px-2 py-0.5 rounded">
                            PRIMARY
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition">
                          {!p.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimary(p.id)}
                              className="px-2 py-1 text-xs text-black bg-white rounded"
                              disabled={disabledAll}
                            >
                              Làm ảnh chính
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deletePhoto(p.id)}
                            className="p-1 bg-red-500 rounded"
                            disabled={disabledAll}
                            title="Xoá ảnh"
                          >
                            <Trash2 size={14} className="text-white" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {!photos.length && (
                      <div className="col-span-4 text-sm text-gray-400">
                        Chưa có ảnh. Bấm Upload để thêm ảnh.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modifiers */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">
                      Modifiers cho món
                    </div>
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
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 disabled:opacity-60"
              disabled={disabledAll}
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-200 disabled:opacity-60"
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
