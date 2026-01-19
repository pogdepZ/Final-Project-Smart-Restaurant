// src/pages/Admin/AccountManagement/components/CreateStaffAccountModal.jsx
import React, { useMemo, useState } from "react";
import { X, Shield, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { adminAccountApi } from "../../../services/adminAccountApi";

const STAFF_ROLE_OPTIONS = [
  { value: "waiter", label: "Waiter" },
  { value: "kitchen", label: "Kitchen" },
  { value: "admin", label: "Admin" },
  // Nếu bạn muốn tạo superadmin từ UI, mở dòng này (thường nên khoá)
  // { value: "superadmin", label: "Super Admin" },
];

export default function CreateStaffAccountModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("waiter");
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(true);

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim() && email.trim() && password.trim() && role;
  }, [name, email, password, role]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("waiter");
    setPassword("");
    setIsVerified(true);
  };

  const submit = async () => {
    if (!canSubmit) return toast.error("Vui lòng nhập đầy đủ thông tin");
    setLoading(true);
    try {
      await adminAccountApi.createStaffAccount({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        is_verified: isVerified,
      });
      toast.success("Tạo tài khoản staff/admin thành công");
      reset();
      onSuccess?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Tạo tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-950 border border-white/10 shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Shield className="text-orange-500" size={18} />
            </div>
            Tạo tài khoản Staff / Admin
          </div>

          <button
            onClick={() => !loading && onClose?.()}
            className="p-2 rounded-xl hover:bg-white/5 transition"
            type="button"
          >
            <X className="text-gray-300" size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
              placeholder="vd: a@company.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm
                          bg-neutral-900/50 text-white
                          border border-white/10
                          focus:outline-none focus:border-orange-500/40 transition
                          [&>option]:bg-neutral-950 [&>option]:text-white"
              >
                {STAFF_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Chọn <b>Admin</b> nếu bạn muốn tạo tài khoản quản trị.
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Mật khẩu
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                placeholder="••••••••"
                type="password"
              />
              <div className="text-xs text-gray-500 mt-1">
                Lưu ý: nên là password tạm → user đổi sau.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <div>
              <div className="text-white text-sm font-bold">Verified</div>
              <div className="text-gray-400 text-xs">
                Đánh dấu đã xác thực email
              </div>
            </div>
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
              disabled={loading}
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => !loading && onClose?.()}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            Huỷ
          </button>

          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={submit}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition border
              ${
                !canSubmit || loading
                  ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500/20 border-orange-500/30 text-orange-200 hover:bg-orange-500/30"
              }`}
          >
            <UserPlus size={16} />
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}
