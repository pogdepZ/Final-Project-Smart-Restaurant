import React, { useEffect, useMemo, useState } from "react";
import { X, PlusSquare } from "lucide-react";
import { adminMenuApi } from "../../../services/adminMenuApi";
import { formatVND } from "../../../utils/adminFormat";
import ScrollArea from "../../../Components/ScrollArea";
import MultiSelectCombobox from "../../../Components/MultiSelectCombobox";
import { toast } from "react-toastify";

const ITEM_STATUS = [
  { value: "available", label: "available" },
  { value: "unavailable", label: "unavailable" },
  { value: "sold_out", label: "sold_out" },
];

export default function CreateMenuItemModal({
  open,
  onClose,
  onSuccess,
  categories = [],
}) {
  const firstCat = useMemo(() => categories?.[0]?.id || "ALL", [categories]);

  const [categoryId, setCategoryId] = useState(firstCat);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(0);
  const [status, setStatus] = useState("available");
  const [isChefRecommended, setChefRecommended] = useState(false);

  // ✅ ảnh: chỉ chọn file + preview local (không upload trước)
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [isLoading, setLoading] = useState(false);

  const modifierGroupOptions = useMemo(() => {
    return (modifierGroups || []).map((g) => ({
      value: g.id,
      label: g.name,
      subLabel: `${g.selectionType} • ${g.isRequired ? "required" : "optional"} • min ${g.minSelections} / max ${g.maxSelections}`,
    }));
  }, [modifierGroups]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [open]);

  // load modifier groups
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoadingGroups(true);
        const res = await adminMenuApi.getModifierGroups({ status: "active" });
        setModifierGroups(res?.groups || res?.data?.groups || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, [open]);

  // preview URL cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    setCategoryId(firstCat);
    setName("");
    setDescription("");
    setPrice("");
    setPrepTimeMinutes(0);
    setStatus("available");
    setChefRecommended(false);
    setSelectedGroupIds([]);
    setModifierGroups([]);

    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose?.();
    }
  };

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmed = name.trim();
    const numPrice = Number(price);

    if (!categoryId || categoryId === "ALL")
      return toast.error("Vui lòng chọn category.");
    if (!trimmed) return toast.error("Vui lòng nhập tên món.");
    if (!Number.isFinite(numPrice) || numPrice <= 0)
      return toast.error("Giá phải là số > 0.");
    if (!status) return toast.error("Vui lòng chọn trạng thái.");
    if (!imageFile) return toast.error("Vui lòng chọn ảnh món ăn.");

    try {
      setLoading(true);

      // 1) ✅ tạo menu item trước để có ID
      const created = await adminMenuApi.createMenuItem({
        categoryId,
        name: trimmed,
        description: description?.trim() || null,
        price: numPrice,
        prepTimeMinutes: Number(prepTimeMinutes) || 0,
        status,
        isChefRecommended,
        // ⚠️ KHÔNG gửi imageUrl ở đây nữa (vì ảnh quản lý bằng menu_item_photos)
      });

      // tuỳ BE trả: { item: {...} } / { id } / { data: { item } }...
      const newId =
        created?.item?.id ||
        created?.data?.item?.id ||
        created?.id ||
        created?.data?.id;

      if (!newId) throw new Error("Tạo món thành công nhưng không nhận được ID.");

      // 2) ✅ upload ảnh vào menu_item_photos
      // BE nên dùng multer.array("images")
      const upRes = await adminMenuApi.uploadMenuItemPhotos(newId, [imageFile]);

      // optional: nếu BE trả lại photos/url để preview
      const firstPhotoUrl =
        upRes?.photos?.[0]?.url ||
        upRes?.data?.photos?.[0]?.url ||
        upRes?.data?.url ||
        upRes?.url;

      // 3) set modifier groups (nếu có)
      if (selectedGroupIds?.length) {
        await adminMenuApi.setMenuItemModifierGroups(newId, selectedGroupIds);
      }

      toast.success("Thêm món thành công");

      // nếu muốn update UI ngay không cần refetch: có thể trả về item + photos
      onSuccess?.();

      reset();
      onClose?.();

      // optional log preview
      if (firstPhotoUrl) {
        // console.log("Uploaded photo url:", firstPhotoUrl);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Tạo món thất bại.");
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
        <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col">
          {/* header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <PlusSquare className="text-orange-500" size={18} />
              </div>
              <div>
                <div className="text-white font-black leading-tight">
                  Thêm món mới
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Tạo menu item và chọn category
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

          <ScrollArea>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-900 [&>option]:text-white"
                  >
                    <option value="ALL">Chọn category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-900 [&>option]:text-white"
                  >
                    {ITEM_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Tên món *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Pasta Carbonara..."
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả món..."
                  rows={3}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">
                    Giá (VND) *
                  </label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="VD: 89000"
                    inputMode="numeric"
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Preview:{" "}
                    <span className="text-gray-200 font-semibold">
                      {Number.isFinite(Number(price))
                        ? formatVND(Number(price))
                        : "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Prep (phút)
                  </label>
                  <input
                    type="number"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(e.target.value)}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>

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
                    disabled={loadingGroups || isLoading}
                  />
                </div>

                {selectedGroupIds.length ? (
                  <div className="mt-3 text-xs text-gray-500">
                    Đã chọn:{" "}
                    <span className="text-gray-200">
                      {modifierGroupOptions
                        .filter((o) => selectedGroupIds.includes(o.value))
                        .map((o) => o.label)
                        .join(", ")}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* ✅ Ảnh: chọn file + preview */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Ảnh món ăn *
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;

                    // cleanup preview cũ
                    if (previewUrl) URL.revokeObjectURL(previewUrl);

                    setImageFile(f);

                    if (f) {
                      setPreviewUrl(URL.createObjectURL(f));
                    } else {
                      setPreviewUrl("");
                    }
                  }}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
                />

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="mt-3 w-full h-40 object-cover rounded-2xl border border-white/10"
                  />
                ) : (
                  <div className="mt-2 text-xs text-gray-500">Chưa chọn ảnh</div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="text-white font-bold">Chef recommended</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Đánh dấu món nổi bật
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setChefRecommended((v) => !v)}
                  className={`px-4 py-2 rounded-xl border transition ${isChefRecommended
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-200"
                      : "bg-neutral-950/40 border-white/10 text-gray-200 hover:bg-white/10"
                    }`}
                >
                  {isChefRecommended ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </ScrollArea>

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
              {isLoading ? "Đang tạo..." : "Tạo món"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
