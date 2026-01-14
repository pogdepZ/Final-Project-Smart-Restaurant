// src/pages/Admin/Profile/AdminProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { User, Camera, Save, RefreshCcw } from "lucide-react";
import { adminProfileApi } from "../../services/adminProfileApi";

function Avatar({ url, name }) {
  const initial = useMemo(() => (name?.trim()?.[0] || "A").toUpperCase(), [name]);
  const [ok, setOk] = useState(!!url);

  useEffect(() => setOk(!!url), [url]);

  return (
    <div className="w-28 h-28 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
      {url && ok ? (
        <img
          src={url}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="text-3xl font-black text-orange-200">{initial}</div>
      )}
    </div>
  );
}

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(""); // local preview
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // nếu axiosClient interceptor đã return response.data:
      // res = { item: {...} }
      const res = await adminProfileApi.getMyProfile();
      const item = res?.item || res?.data?.item || res;

      setProfile(item);
      setName(item?.name || "");
      setPreviewUrl("");
      setFile(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không thể tải profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSaveName = useMemo(() => {
    const n = name.trim();
    return !!profile && n && n !== (profile.name || "");
  }, [name, profile]);

  const pickFile = (f) => {
    if (!f) return;

    const okType = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
    if (!okType) return toast.error("Chỉ nhận PNG/JPG/WEBP");

    if (f.size > 5 * 1024 * 1024) return toast.error("File quá lớn (tối đa 5MB)");

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const saveName = async () => {
    const n = name.trim();
    if (!n) return toast.error("Tên không được trống");

    setSavingName(true);
    try {
      const res = await adminProfileApi.updateMyProfile({ name: n });
      const item = res?.item || res?.data?.item || res;

      setProfile(item);
      toast.success("Đã cập nhật tên");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSavingName(false);
    }
  };

  const uploadAvatar = async () => {
    if (!file) return toast.error("Chọn ảnh trước đã");

    setUploading(true);
    try {
      const res = await adminProfileApi.uploadAvatar(file);
      const item = res?.item || res?.data?.item || res;

      setProfile(item);
      toast.success("Đã cập nhật avatar");
      setFile(null);
      setPreviewUrl("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const avatarUrlToShow = previewUrl || profile?.avatar_url || "";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <User className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Admin Profile
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Thông tin{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              tài khoản
            </span>
          </h1>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          disabled={loading}
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* Main */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">Thông tin tài khoản</div>
          <div className="text-xs text-gray-400">{loading ? "Đang tải..." : profile?.email || ""}</div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Avatar */}
          <div className="lg:col-span-4 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar url={avatarUrlToShow} name={profile?.name} />

              <div className="text-center">
                <div className="text-white font-black text-lg">{loading ? "—" : profile?.name}</div>
                <div className="text-gray-400 text-sm">
                  {loading ? "" : `${profile?.role || "admin"} • ${profile?.is_verified ? "Verified" : "Unverified"}`}
                </div>
              </div>

              <div className="w-full mt-2">
                <label className="text-xs text-gray-400 mb-1 block">Chọn ảnh mới</label>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition">
                    <Camera size={16} />
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                      disabled={uploading || loading}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={uploadAvatar}
                    disabled={!file || uploading || loading}
                    className={`px-4 py-2 rounded-xl border transition
                      ${(!file || uploading || loading)
                        ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                        : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
                      }`}
                  >
                    {uploading ? "Đang up..." : "Upload"}
                  </button>
                </div>

                <div className="text-xs text-gray-500 mt-2">PNG/JPG/WEBP • tối đa 5MB</div>
              </div>
            </div>
          </div>

          {/* Right: Edit name */}
          <div className="lg:col-span-8 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
            <div className="text-white font-bold">Chỉnh sửa</div>
            <div className="text-xs text-gray-400 mt-1">Bạn có thể đổi tên hiển thị.</div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  placeholder="Nhập tên..."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email (readonly)</label>
                <input
                  value={loading ? "" : profile?.email || ""}
                  readOnly
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-400"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setName(profile?.name || "");
                  toast.info("Đã reset name theo profile");
                }}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={saveName}
                disabled={!canSaveName || savingName || loading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition
                  ${(!canSaveName || savingName || loading)
                    ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
                  }`}
              >
                <Save size={16} />
                {savingName ? "Đang lưu..." : "Lưu tên"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
