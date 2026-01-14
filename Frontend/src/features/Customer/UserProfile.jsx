import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Pencil, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

import { userApi } from "../../services/userApi";
import EditProfileModal from "./popup/EditProfileModal";
import ChangePasswordModal from "./popup/ChangePasswordModal";
import { updateUser } from "../../store/slices/authSlice";
import { orderApi } from "../../services/orderApi";

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
          e?.response?.data?.message || "Không tải được lịch sử đơn"
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
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="text-gray-500">
          Vui lòng đăng nhập để xem thông tin cá nhân
        </p>

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

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">Lịch sử đơn hàng</h2>
          <Link
            to="/history"
            className="text-xs text-orange-400 font-bold hover:underline"
          >
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
              <div
                key={o.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">
                      Bàn: {o.table_number || "—"}
                    </p>
                    <p className="text-xs text-white/50">
                      {new Date(o.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase font-black text-orange-400">
                      {o.status}
                    </p>
                    <p className="text-sm font-black">
                      {Number(o.total_amount || 0).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>

                {/* items preview */}
                <div className="mt-3 space-y-1">
                  {(o.items || []).slice(0, 2).map((it) => (
                    <div
                      key={it.id}
                      className="flex justify-between text-sm text-white/80"
                    >
                      <span className="truncate max-w-[70%]">
                        {it.quantity}x {it.item_name}
                      </span>
                      <span className="text-xs uppercase text-white/50">
                        {it.status}
                      </span>
                    </div>
                  ))}
                  {(o.items || []).length > 2 ? (
                    <p className="text-xs text-white/40 mt-1">
                      + {(o.items || []).length - 2} món nữa
                    </p>
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
