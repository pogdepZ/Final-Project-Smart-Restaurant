import React, { useEffect, useMemo, useState } from "react";
import { X, Camera, Save } from "lucide-react";

export default function EditProfileModal({
  open,
  onClose,
  initialUser,
  onSubmit, // async ({ name, preferences, avatarFile }) => void
  isSubmitting = false,
}) {
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // reset form khi mở modal
  useEffect(() => {
    if (!open) return;
    setName(initialUser?.name || "");
    setPreferences(initialUser?.preferences || "");
    setAvatarFile(null);
    setPreviewUrl(initialUser?.avatarUrl || initialUser?.avatar_url || "");
  }, [open, initialUser]);

  // tạo preview khi chọn file
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const canSave = useMemo(() => {
    const validName = String(name || "").trim().length >= 2;
    const validPref = String(preferences || "").length <= 255;
    return validName && validPref;
  }, [name, preferences]);

  if (!open) return null;

  const handleSave = async () => {
    if (!canSave || isSubmitting) return;
    await onSubmit?.({
      name: name.trim(),
      preferences: preferences.trim(),
      avatarFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
      />

      {/* modal */}
      <div className="relative mx-auto mt-20 w-[92%] max-w-lg rounded-3xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-black text-lg">Chỉnh sửa hồ sơ</h3>
            <p className="text-white/50 text-xs mt-1">
              Cập nhật tên, sở thích và ảnh đại diện
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-white/70"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-white/5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">
                    No Avatar
                  </div>
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    // giới hạn nhẹ: 2MB
                    if (f.size > 2 * 1024 * 1024) return;
                    setAvatarFile(f);
                  }}
                />
                <div className="h-9 w-9 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:opacity-90">
                  <Camera size={16} />
                </div>
              </label>
            </div>

            <div className="text-white/70 text-xs leading-relaxed">
              <p className="font-bold text-white">Ảnh đại diện</p>
              <p>Chọn ảnh .jpg/.png, tối đa ~2MB</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Họ tên
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/0 text-white outline-none placeholder:text-gray-500"
            />
            {String(name || "").trim().length > 0 &&
            String(name || "").trim().length < 2 ? (
              <p className="text-xs text-red-300">Tên tối thiểu 2 ký tự.</p>
            ) : null}
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Sở thích
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Ví dụ: không cay, ăn chay, dị ứng hải sản..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/0 text-white outline-none placeholder:text-gray-500 resize-none"
            />
            {String(preferences || "").length > 255 ? (
              <p className="text-xs text-red-300">
                Sở thích tối đa 255 ký tự.
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 font-bold"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={!canSave || isSubmitting}
            onClick={handleSave}
            className={[
              "w-2/3 py-3 rounded-xl font-black flex items-center justify-center gap-2",
              "bg-linear-to-r from-orange-500 to-red-600 text-white",
              !canSave || isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-95",
            ].join(" ")}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"} <Save size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
