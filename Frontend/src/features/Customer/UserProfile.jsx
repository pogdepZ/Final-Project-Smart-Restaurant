import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Pencil, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

import { userApi } from "../../services/userApi";
import EditProfileModal from "./popup/EditProfileModal";
import ChangePasswordModal from "./popup/ChangePasswordModal";
import { updateUser } from "../../store/slices/authSlice";

const UserProfile = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openPass, setOpenPass] = useState(false);
  const [changing, setChanging] = useState(false);

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
      // 1) update name/preferences
      const updated = await userApi.updateMe({ name, preferences });
      const updatedUser = updated?.user || updated;

      // 2) upload avatar nếu có
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

      // 3) update redux (và localStorage)
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
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold mb-0">User Profile</h1>

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

      <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full overflow-hidden border border-white/10 bg-white/5">
            {user.avatarUrl || user.avatar_url ? (
              <img
                src={user.avatarUrl || user.avatar_url}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">
                No Avatar
              </div>
            )}
          </div>

          <div className="flex-1">
            <span className="text-gray-400 text-sm">Họ tên</span>
            <p className="font-semibold">{user.name}</p>
          </div>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Email</span>
          <p>{user.email}</p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Vai trò</span>
          <p className="uppercase text-xs font-bold">{user.role}</p>
        </div>

        {user.preferences ? (
          <div>
            <span className="text-gray-400 text-sm">Sở thích</span>
            <p className="text-white/80">{user.preferences}</p>
          </div>
        ) : null}
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
