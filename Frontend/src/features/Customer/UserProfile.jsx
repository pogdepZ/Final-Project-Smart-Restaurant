import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Pencil, KeyRound, Camera, Save } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import { userApi } from "../../services/userApi";
import { orderApi } from "../../services/orderApi";
import EditProfileModal from "./popup/EditProfileModal";
import ChangePasswordModal from "./popup/ChangePasswordModal";
import { updateUser } from "../../store/slices/authSlice";
import Avatar from "./components/Avatar";

import { formatMoneyVND } from "../../utils/orders";

const UserProfile = () => {
  const { t } = useTranslation();
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

  const avatarUrlToShow =
    previewUrl || user?.avatarUrl || user?.avatar_url || "";

  const canSaveName = useMemo(() => {
    const n = name.trim();
    return !!user && n && n !== (user?.name || "");
  }, [name, user]);

  const pickFile = (f) => {
    if (!f) return;

    const okType = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
    if (!okType) return toast.error(t("profile.fileTypeError"));
    if (f.size > 5 * 1024 * 1024)
      return toast.error(t("profile.fileSizeError"));

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const saveNameInline = async () => {
    const n = name.trim();
    if (!n) return toast.error(t("profile.nameRequired"));

    setSaving(true);
    try {
      const updated = await userApi.updateMe({ name: n });
      const updatedUser = updated?.user || updated;

      dispatch(
        updateUser({
          name: updatedUser?.name || n,
          ...(updatedUser?.preferences
            ? { preferences: updatedUser.preferences }
            : {}),
          ...(updatedUser?.avatarUrl || updatedUser?.avatar_url
            ? {
                avatarUrl: updatedUser.avatarUrl || updatedUser.avatar_url,
                avatar_url: updatedUser.avatarUrl || updatedUser.avatar_url,
              }
            : {}),
        }),
      );

      toast.success(t("profile.nameUpdated"));
    } catch (e) {
      toast.error(e?.response?.data?.message || t("profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatarInline = async () => {
    if (!file) return toast.error(t("profile.selectPhotoFirst"));

    setUploading(true);
    try {
      const up = await userApi.uploadAvatar(file);
      const upUser = up?.user || up;

      const avatarUrl =
        upUser?.avatarUrl ||
        upUser?.avatar_url ||
        up?.avatarUrl ||
        up?.avatar_url;

      dispatch(
        updateUser({
          ...(avatarUrl ? { avatarUrl, avatar_url: avatarUrl } : {}),
        }),
      );

      toast.success(t("profile.avatarUpdated"));
      setFile(null);
      setPreviewUrl("");
    } catch (e) {
      toast.error(e?.response?.data?.message || t("profile.uploadFailed"));
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
        setOrdersError(
          e?.response?.data?.message || t("profile.loadOrdersFailed"),
        );
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">{t("profile.notLoggedIn")}</h1>
        <p className="text-gray-500">{t("profile.pleaseLogin")}</p>

        <Link
          to="/signin"
          className="px-6 py-2 rounded-lg bg-orange-500 text-white font-bold hover:opacity-90"
        >
          {t("profile.login")}
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
        }),
      );

      toast.success(t("profile.profileUpdated"));
      setOpenEdit(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || t("profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    setChanging(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      toast.success(t("profile.passwordChanged"));
      setOpenPass(false);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || t("profile.passwordChangeFailed"),
      );
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
            {t("profile.title").split(" ")[0]}{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              {t("profile.title").split(" ").slice(1).join(" ")}
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
            {t("profile.changePassword")}
          </button>

          <button
            type="button"
            onClick={() => setOpenEdit(true)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 flex items-center gap-2"
          >
            <Pencil size={16} />
            {t("profile.edit")}
          </button>
        </div>
      </div>

      {/* Main card giống Admin */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">{t("profile.accountInfo")}</div>
          <div className="text-xs text-gray-400">{user?.email || ""}</div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Avatar */}
          <div className="lg:col-span-4 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar url={avatarUrlToShow} name={user?.name} size={112} />

              <div className="text-center">
                <div className="text-white font-black text-lg">
                  {user?.name}
                </div>
                <div className="text-gray-400 text-sm">
                  {user?.role || "user"}{" "}
                  {user?.is_verified ? `• ${t("profile.verified")}` : ""}
                </div>
              </div>

              <div className="w-full mt-2">
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("profile.selectNewPhoto")}
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition">
                    <Camera size={16} />
                    {t("profile.selectPhoto")}
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
                      ${
                        !file || uploading
                          ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                          : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
                      }`}
                  >
                    {uploading ? t("profile.uploading") : t("profile.upload")}
                  </button>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  {t("profile.photoFormat")}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Edit name inline (bỏ Reset theo ý bạn) */}
          <div className="lg:col-span-8 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
            <div className="text-white font-bold">
              {t("profile.editSection")}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {t("profile.editHint")}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("profile.name")}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {t("profile.emailReadonly")}
                </label>
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
                  ${
                    !canSaveName || saving
                      ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                      : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
                  }`}
              >
                <Save size={16} />
                {saving ? t("profile.saving") : t("profile.saveName")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">{t("profile.orderHistory")}</h2>
          <Link
            to="/history"
            className="text-xs text-orange-400 font-bold hover:underline"
          >
            {t("profile.viewAll")}
          </Link>
        </div>

        {loadingOrders ? (
          <div className="text-white/50 text-sm">{t("profile.loading")}</div>
        ) : ordersError ? (
          <div className="text-red-300 text-sm">{ordersError}</div>
        ) : orders.length === 0 ? (
          <div className="text-white/50 text-sm">{t("profile.noOrders")}</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 mt-2"
              >
                {/* TOP: header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                  {/* Left */}
                  <div className="min-w-0">
                    <p className="text-white font-black text-lg sm:text-xl">
                      {t("profile.table")}: {o.table_number || "—"}
                    </p>
                    <p className="text-xs sm:text-sm text-white/50 mt-1">
                      {new Date(o.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  {/* Right */}
                  <div className="sm:text-right flex sm:block items-center justify-between gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-orange-500/10 text-orange-300 border border-orange-500/20">
                      {o.status}
                    </span>
                    <p className="text-base sm:text-lg font-black text-white mt-0 sm:mt-2">
                      {formatMoneyVND(Number(o.total_amount || 0))}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-4 sm:mt-5 border-t border-white/10" />

                {/* ITEMS */}
                <div className="mt-4 sm:mt-5 space-y-3">
                  {(o.items || []).map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 sm:gap-4"
                    >
                      {/* Image */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.item_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                            —
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 font-semibold truncate text-sm sm:text-base">
                          {it.quantity}x {it.item_name}
                        </p>
                        <p className="text-xs uppercase text-white/50 mt-0.5">
                          {it.status}
                        </p>
                      </div>
                    </div>
                  ))}
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
