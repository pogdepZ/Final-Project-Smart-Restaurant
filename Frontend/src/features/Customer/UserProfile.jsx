import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Pencil, KeyRound, Camera, Save } from "lucide-react";
import { toast } from "react-toastify";

import { userApi } from "../../services/userApi";
import { orderApi } from "../../services/orderApi";
import EditProfileModal from "./popup/EditProfileModal";
import ChangePasswordModal from "./popup/ChangePasswordModal";
import { updateUser } from "../../store/slices/authSlice";
import Avatar from "./components/Avatar";


const UserProfile = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openPass, setOpenPass] = useState(false);
  const [changing, setChanging] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  // ===== Đồng bộ style theo Admin: chỉnh name + upload avatar ngay tại trang =====
  const [name, setName] = useState(user?.name || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const avatarUrlToShow = previewUrl || user?.avatarUrl || user?.avatar_url || "";

  const canSaveName = useMemo(() => {
    const n = name.trim();
    return !!user && n && n !== (user?.name || "");
  }, [name, user]);

  const pickFile = (f) => {
    if (!f) return;

    const okType = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
    if (!okType) return toast.error("Chỉ nhận PNG/JPG/WEBP");
    if (f.size > 5 * 1024 * 1024) return toast.error("File quá lớn (tối đa 5MB)");

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const saveNameInline = async () => {
    const n = name.trim();
    if (!n) return toast.error("Tên không được trống");

    setSaving(true);
    try {
      const updated = await userApi.updateMe({ name: n });
      const updatedUser = updated?.user || updated;

      dispatch(
        updateUser({
          name: updatedUser?.name || n,
          ...(updatedUser?.preferences ? { preferences: updatedUser.preferences } : {}),
          ...(updatedUser?.avatarUrl || updatedUser?.avatar_url
            ? { avatarUrl: updatedUser.avatarUrl || updatedUser.avatar_url, avatar_url: updatedUser.avatarUrl || updatedUser.avatar_url }
            : {}),
        })
      );

      toast.success("Đã cập nhật tên");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatarInline = async () => {
    if (!file) return toast.error("Chọn ảnh trước đã");

    setUploading(true);
    try {
      const up = await userApi.uploadAvatar(file);
      const upUser = up?.user || up;

      const avatarUrl =
        upUser?.avatarUrl || upUser?.avatar_url || up?.avatarUrl || up?.avatar_url;

      dispatch(
        updateUser({
          ...(avatarUrl ? { avatarUrl, avatar_url: avatarUrl } : {}),
        })
      );

      toast.success("Đã cập nhật avatar");
      setFile(null);
      setPreviewUrl("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  // ===== orders =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingOrders(true);
        setOrdersError("");
        const res = await orderApi.getMyOrders({ page: 1, limit: 5 });
        if (!mounted) return;
        setOrders(res?.data || []);
      } catch (e) {
        if (!mounted) return;
        setOrdersError(e?.response?.data?.message || "Không tải được lịch sử đơn");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin cá nhân</p>

        <Link
          to="/signin"
          className="px-6 py-2 rounded-lg bg-orange-500 text-white font-bold hover:opacity-90"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async ({ name, preferences, avatarFile }) => {
    setSaving(true);
    try {
      const updated = await userApi.updateMe({ name, preferences });
      const updatedUser = updated?.user || updated;

      let avatarUrl =
        updatedUser?.avatarUrl ||
        updatedUser?.avatar_url ||
        user?.avatarUrl ||
        user?.avatar_url;

      if (avatarFile) {
        const up = await userApi.uploadAvatar(avatarFile);
        const upUser = up?.user || up;
        avatarUrl =
          upUser?.avatarUrl ||
          upUser?.avatar_url ||
          up?.avatarUrl ||
          up?.avatar_url;
      }

      dispatch(
        updateUser({
          name,
          preferences,
          ...(avatarUrl ? { avatarUrl, avatar_url: avatarUrl } : {}),
        })
      );

      toast.success("Cập nhật hồ sơ thành công!");
      setOpenEdit(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    setChanging(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setOpenPass(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header (giống vibe Admin) */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              User Profile
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Thông tin{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              tài khoản
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenPass(true)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 flex items-center gap-2"
          >
            <KeyRound size={16} />
            Đổi mật khẩu
          </button>

          <button
            type="button"
            onClick={() => setOpenEdit(true)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 flex items-center gap-2"
          >
            <Pencil size={16} />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Main card giống Admin */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">Thông tin tài khoản</div>
          <div className="text-xs text-gray-400">{user?.email || ""}</div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Avatar */}
          <div className="lg:col-span-4 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar url={avatarUrlToShow} name={user?.name} size={112} />

              <div className="text-center">
                <div className="text-white font-black text-lg">{user?.name}</div>
                <div className="text-gray-400 text-sm">
                  {(user?.role || "user")} {user?.is_verified ? "• Verified" : ""}
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
                      disabled={uploading}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={uploadAvatarInline}
                    disabled={!file || uploading}
                    className={`px-4 py-2 rounded-xl border transition
                      ${(!file || uploading)
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

          {/* Right: Edit name inline (bỏ Reset theo ý bạn) */}
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
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email (readonly)</label>
                <input
                  value={user?.email || ""}
                  readOnly
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-400"
                />
              </div>
              
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              {/* Nếu bạn muốn giữ Reset thì mở comment block này ra */}
              {/* 
              <button
                type="button"
                onClick={() => {
                  setName(user?.name || "");
                  toast.info("Đã reset name theo user");
                }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
              >
                Reset
              </button> 
              */}

              <button
                type="button"
                onClick={saveNameInline}
                disabled={!canSaveName || saving}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition
                  ${(!canSaveName || saving)
                    ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
                  }`}
              >
                <Save size={16} />
                {saving ? "Đang lưu..." : "Lưu tên"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">Lịch sử đơn hàng</h2>
          <Link to="/history" className="text-xs text-orange-400 font-bold hover:underline">
            Xem tất cả
          </Link>
        </div>

        {loadingOrders ? (
          <div className="text-white/50 text-sm">Đang tải...</div>
        ) : ordersError ? (
          <div className="text-red-300 text-sm">{ordersError}</div>
        ) : orders.length === 0 ? (
          <div className="text-white/50 text-sm">Bạn chưa có đơn nào.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Bàn: {o.table_number || "—"}</p>
                    <p className="text-xs text-white/50">
                      {new Date(o.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase font-black text-orange-400">{o.status}</p>
                    <p className="text-sm font-black">
                      {Number(o.total_amount || 0).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {(o.items || []).slice(0, 2).map((it) => (
                    <div key={it.id} className="flex justify-between text-sm text-white/80">
                      <span className="truncate max-w-[70%]">
                        {it.quantity}x {it.item_name}
                      </span>
                      <span className="text-xs uppercase text-white/50">{it.status}</span>
                    </div>
                  ))}
                  {(o.items || []).length > 2 ? (
                    <p className="text-xs text-white/40 mt-1">+ {(o.items || []).length - 2} món nữa</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <EditProfileModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        initialUser={user}
        onSubmit={handleSaveProfile}
        isSubmitting={saving}
      />

      <ChangePasswordModal
        open={openPass}
        onClose={() => setOpenPass(false)}
        onSubmit={handleChangePassword}
        isSubmitting={changing}
      />
    </div>
  );
};

export default UserProfile;
  