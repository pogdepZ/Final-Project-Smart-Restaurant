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
  const [modifierGroups, setModifierGroups] = useState([]); // list group
  const [selectedGroupIds, setSelectedGroupIds] = useState([]); // mảng uuid
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(0);
  const [status, setStatus] = useState("available");
  const [imageUrl, setImageUrl] = useState("");
  const [isChefRecommended, setChefRecommended] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setUploading] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const modifierGroupOptions = useMemo(() => {
    return (modifierGroups || []).map((g) => ({
      value: g.id,
      label: g.name,
      subLabel: `${g.selectionType} • ${g.isRequired ? "required" : "optional"} • min ${g.minSelections} / max ${g.maxSelections}`,
    }));
  }, [modifierGroups]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoadingGroups(true);
        // API này bạn tạo ở adminMenuApi / adminModifierApi
        const res = await adminMenuApi.getModifierGroups({ status: "active" });
        setModifierGroups(res?.groups || res?.data?.groups || []);
      } catch (e) {
        console.error(e);
        // không chặn tạo món, nhưng bạn có thể setError nếu muốn
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, [open]);

  if (!open) return null;

  const handleUploadImage = async () => {
    if (!imageFile) return setError("Vui lòng chọn file ảnh.");

    try {
      setUploading(true);
      setError("");

      const res = await adminMenuApi.uploadMenuImage(imageFile);

      // tùy BE trả về: { url } hoặc { secure_url }...
      const url =
        res?.url || res?.secure_url || res?.data?.url || res?.data?.secure_url;

      if (!url)
        throw new Error("Upload thành công nhưng không nhận được URL ảnh.");

      setImageUrl(url);
    } catch (e) {
      setError(
        e?.response?.data?.message || e?.message || "Upload ảnh thất bại.",
      );
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setCategoryId(firstCat);
    setName("");
    setDescription("");
    setPrice("");
    setPrepTimeMinutes(0);
    setStatus("available");
    setImageUrl("");
    setChefRecommended(false);
    setSelectedGroupIds([]);
    setModifierGroups([]);
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
    const numPrice = Number(price);

    if (!categoryId || categoryId === "ALL")
      return setError("Vui lòng chọn category.");
    if (!trimmed) return setError("Vui lòng nhập tên món.");
    if (!Number.isFinite(numPrice) || numPrice <= 0)
      return setError("Giá phải là số > 0.");
    if (!status) return setError("Vui lòng chọn trạng thái.");
    if (isUploading) return setError("Ảnh đang upload, vui lòng chờ.");
    if (!imageUrl) return setError("Vui lòng upload ảnh món ăn trước khi tạo.");

    try {
      setLoading(true);
      setError("");

      // ✅ 1) tạo món trước để có ID
      const created = await adminMenuApi.createMenuItem({
        categoryId,
        name: trimmed,
        description,
        price: numPrice,
        prepTimeMinutes: Number(prepTimeMinutes) || 0,
        status,
        imageUrl,
        isChefRecommended,
      });

      // ✅ 2) lấy ID (tuỳ axios interceptor)
      const newId = created?.id || created?.data?.id;
      if (!newId)
        throw new Error("Tạo món thành công nhưng không nhận được ID.");

      // ✅ 3) gắn modifier groups
      if (selectedGroupIds?.length) {
        await adminMenuApi.setMenuItemModifierGroups(newId, selectedGroupIds);
      }

      onSuccess?.();
      toast.success("Thêm món thành công");
      reset();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Tạo món thất bại.");
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
            {/* body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {error ? (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
                  {error}
                </div>
              ) : null}

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

                {/* Optional: preview danh sách đã chọn */}
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

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Ảnh món ăn
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImageFile(f);
                    if (!f) return;
                    // optional: reset imageUrl nếu chọn ảnh mới
                    // setImageUrl("");
                  }}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40 transition"
                />

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={!imageFile || isUploading || isLoading}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-60"
                  >
                    {isUploading ? "Đang upload..." : "Upload ảnh"}
                  </button>

                  {imageUrl ? (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-orange-300 hover:text-orange-200 underline"
                    >
                      Xem ảnh
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">Chưa có URL</span>
                  )}
                </div>

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="mt-3 w-full h-40 object-cover rounded-2xl border border-white/10"
                  />
                ) : null}
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
                  className={`px-4 py-2 rounded-xl border transition ${
                    isChefRecommended
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-200"
                      : "bg-neutral-950/40 border-white/10 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  {isChefRecommended ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </ScrollArea>

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
              disabled={isLoading || isUploading}
            >
              {isLoading ? "Đang tạo..." : "Tạo món"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
