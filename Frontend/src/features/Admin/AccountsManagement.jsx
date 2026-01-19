// src/pages/Admin/AccountManagement/AccountManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCcw,
  Shield,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

import PaginationBar from "../../Components/PaginationBar";
import ConfirmModal from "../../Components/ConfirmModal";
import ToggleSwitch from "../../Components/ToggleSwitch";
import CreateStaffAccountModal from "./components/CreateStaffAccountModal";
import AccountDetailModal from "./components/AccountDetailModal";
import { adminAccountApi } from "../../services/adminAccountApi";

/**
 * Theme học từ MenuManagement:
 * - container max-w-7xl px-4 py-8
 * - cards: rounded-2xl bg-white/5 border border-white/10
 * - panel: bg-neutral-900/60 border-white/10 p-4
 * - accent orange/red
 */

const ROLE_META = {
  superadmin: { label: "Super Admin", className: "bg-red-500/10 text-red-200 border-red-500/20" },
  admin: { label: "Admin", className: "bg-orange-500/10 text-orange-200 border-orange-500/20" },
  waiter: { label: "Waiter", className: "bg-blue-500/10 text-blue-200 border-blue-500/20" },
  kitchen: { label: "Kitchen", className: "bg-purple-500/10 text-purple-200 border-purple-500/20" },
  customer: { label: "Customer", className: "bg-white/5 text-gray-200 border-white/10" },
};

function RolePill({ role }) {
  const meta = ROLE_META[role] || { label: role || "—", className: "bg-white/5 text-gray-200 border-white/10" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function VerifyPill({ isVerified }) {
  return isVerified ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold bg-green-500/10 text-green-200 border-green-500/20">
      <BadgeCheck size={14} />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold bg-yellow-500/10 text-yellow-200 border-yellow-500/20">
      <BadgeX size={14} />
      Unverified
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-3 pl-4">
        <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-28 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-28 bg-white/5 rounded-full animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <div className="ml-auto h-4 w-24 bg-white/5 rounded animate-pulse" />
      </td>
    </tr>
  );
}

const STAFF_ROLES = ["admin", "waiter", "kitchen", "superadmin"];
const USER_ROLES = ["customer"];

export default function AccountsManagement() {
  // tabs: "USER" | "STAFF"
  const [tab, setTab] = useState("USER");

  // filters
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [verified, setVerified] = useState("ALL"); // ALL | true | false
  const [sort, setSort] = useState("NEWEST"); // NEWEST | OLDEST | NAME_ASC | NAME_DESC

  // paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // modals
  const [openCreateStaff, setOpenCreateStaff] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // optimistic UI list
  const [uiAccounts, setUiAccounts] = useState([]);

  const params = useMemo(() => {
    const roleScope = tab === "STAFF" ? "STAFF" : "USER";
    return {
      scope: roleScope, // backend có thể dùng scope này để filter
      q,
      role: role === "ALL" ? "" : role,
      verified: verified === "ALL" ? "" : verified, // "true" | "false"
      sort,
      page,
      limit,
    };
  }, [tab, q, role, verified, sort, page, limit]);

  const resetPage = () => setPage(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAccountApi.getAccounts(params);
      setData(res);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Không thể tải danh sách account";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const accounts = data?.items ?? [];
  const pagination = data?.pagination ?? { page, limit, total: 0, totalPages: 1 };
  const totalPages = pagination.totalPages || 1;

  useEffect(() => {
    setUiAccounts(accounts);
  }, [accounts]);

  // Khi đổi tab => reset filters hợp lý
  useEffect(() => {
    setRole("ALL");
    setVerified("ALL");
    setQ("");
    setSort("NEWEST");
    setPage(1);
  }, [tab]);

  const roleOptions = useMemo(() => {
    const list = tab === "STAFF" ? STAFF_ROLES : USER_ROLES;
    return list;
  }, [tab]);

  const [togglingActiveMap, setTogglingActiveMap] = useState({}); // { [id]: true }

  const toggleActive = async (u, nextChecked) => {
    const id = u.id;
    const prev = !!u.is_actived;

    // optimistic
    setUiAccounts((cur) =>
      cur.map((x) => (x.id === id ? { ...x, is_actived: nextChecked } : x))
    );
    setTogglingActiveMap((m) => ({ ...m, [id]: true }));

    try {
      await adminAccountApi.setActived(id, nextChecked);
      toast.success(nextChecked ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hoá tài khoản");
    } catch (e) {
      // rollback
      setUiAccounts((cur) =>
        cur.map((x) => (x.id === id ? { ...x, is_actived: prev } : x))
      );
      toast.error(e?.response?.data?.message || "Đổi trạng thái thất bại");
    } finally {
      setTogglingActiveMap((m) => {
        const clone = { ...m };
        delete clone[id];
        return clone;
      });
    }
  };


  // Delete (optional): chỉ gợi ý vì staff/admin cần cẩn thận
  const requestDelete = (u) => {
    setConfirmTarget(u);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!confirmTarget?.id) return;
    setConfirmLoading(true);
    try {
      await adminAccountApi.deleteAccount(confirmTarget.id);
      setUiAccounts((cur) => cur.filter((x) => x.id !== confirmTarget.id));
      toast.success("Đã xoá tài khoản");
      setConfirmOpen(false);
      setConfirmTarget(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Xoá thất bại");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Users className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Account Management
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Quản lý{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              tài khoản
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
            Tổng:{" "}
            <span className="text-white font-bold">
              {loading ? "—" : pagination.total}
            </span>{" "}
            accounts
          </div>

          {tab === "STAFF" && (
            <button
              onClick={() => setOpenCreateStaff(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
               bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition"
            >
              <UserPlus size={16} />
              + Add staff
            </button>
          )}

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
               bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("USER")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition
            ${tab === "USER"
              ? "bg-orange-500/15 border-orange-500/30 text-orange-200"
              : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
            }`}
        >
          <Users size={16} />
          Customers
        </button>

        <button
          type="button"
          onClick={() => setTab("STAFF")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition
            ${tab === "STAFF"
              ? "bg-orange-500/15 border-orange-500/30 text-orange-200"
              : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
            }`}
        >
          <Shield size={16} />
          Staffs
        </button>

        {error ? (
          <div className="ml-auto text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            {error}
          </div>
        ) : null}
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-full">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Filter className="text-orange-500" size={18} />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-5">
                <label className="text-xs text-gray-400 mb-1 block">Tìm theo tên / email</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      resetPage();
                    }}
                    placeholder="VD: nguyen van a / a@gmail.com..."
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    resetPage();
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-sm
                            bg-neutral-950 text-white
                            border border-white/10
                            focus:outline-none focus:border-orange-500/40 transition
                            [&>option]:bg-neutral-950 [&>option]:text-white"
                >
                  <option value="ALL">Tất cả</option>
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_META[r]?.label || r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Verified</label>
                <select
                  value={verified}
                  onChange={(e) => {
                    setVerified(e.target.value);
                    resetPage();
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-sm
                            bg-neutral-950 text-white
                            border border-white/10
                            focus:outline-none focus:border-orange-500/40 transition
                            [&>option]:bg-neutral-950 [&>option]:text-white"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>

              {/* Sort */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    resetPage();
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-sm
                            bg-neutral-950 text-white
                            border border-white/10
                            focus:outline-none focus:border-orange-500/40 transition
                            [&>option]:bg-neutral-950 [&>option]:text-white"
                >
                  <option value="NEWEST">Mới nhất</option>
                  <option value="OLDEST">Cũ nhất</option>
                  <option value="NAME_ASC">Tên A → Z</option>
                  <option value="NAME_DESC">Tên Z → A</option>
                </select>
              </div>

              <div className="md:col-span-12 text-xs text-gray-500">
                Tip: Click 1 dòng để xem chi tiết. Với Staff, bạn có thể tạo tài khoản <b>Admin</b> ngay trong modal.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">
            {tab === "USER" ? "Danh sách Users (Customer)" : "Danh sách Staff"}
          </div>
          <div className="text-xs text-gray-400">Click 1 dòng để xem chi tiết</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-950/60 border-b border-white/10">
              <tr className="text-left text-xs text-gray-400">
                <th className="py-3 pr-3 pl-4 w-[40%] sm:w-[25%]">User</th>

                {/* ẩn mobile */}
                <th className="hidden sm:table-cell py-3 px-3 w-[15%]">Role</th>

                {/* ẩn mobile */}
                <th className="hidden sm:table-cell py-3 px-3 w-[15%]">Verified</th>

                <th className="py-3 px-3 w-[15%] sm:w-[15%]">Active</th>

                {/* ẩn mobile */}
                <th className="py-3 px-3 w-[15%]">Actions</th>

                <th className="hidden sm:table-cell py-3 pl-3 pr-4 text-right w-[15%]">Created</th>
              </tr>
            </thead>


            <tbody>
              {loading
                ? Array.from({ length: limit }).slice(0, 8).map((_, i) => <SkeletonRow key={i} />)
                : uiAccounts.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setDetailUser(u)}
                    className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                  >
                    <td className="py-3 pr-3 pl-4 align-top">
                      <div className="text-white font-bold">{u.name}</div>
                      <div className="text-xs text-gray-400 mt-1 break-all sm:break-normal">{u.email}</div>
                    </td>

                    <td className="hidden sm:table-cell py-3 px-3 align-top">
                      <RolePill role={u.role} />
                    </td>

                    <td className="hidden sm:table-cell py-3 px-3 align-top">
                      <VerifyPill isVerified={!!u.is_verified} />
                    </td>


                    <td className="py-3 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <ToggleSwitch
                          checked={!!u.is_actived}
                          disabled={!!togglingActiveMap[u.id]}
                          onChange={(next) => toggleActive(u, next)}
                          label="Active"
                        />
                        <span
                          className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold
                          ${u.is_actived
                              ? "bg-green-500/10 text-green-200 border-green-500/20"
                              : "bg-red-500/10 text-red-200 border-red-500/20"
                            }`}
                        >
                          {u.is_actived ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>


                    <td className="py-3 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20"
                          onClick={() => requestDelete(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                    <td className="hidden sm:table-cell py-3 pl-3 pr-4 align-top text-right">
                      <div className="text-gray-300 text-sm">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && uiAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="text-white font-bold">Không có account phù hợp</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Thử đổi filter hoặc từ khóa tìm kiếm.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={pagination.page}
          totalPages={totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPrev={() => setPage((p) => Math.max(p - 1, 1))}
          onNext={() => setPage((p) => Math.min(p + 1, totalPages))}
          onChangeLimit={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />
      </div>

      {/* Modals */}
      <CreateStaffAccountModal
        open={openCreateStaff}
        onClose={() => setOpenCreateStaff(false)}
        onSuccess={() => {
          setOpenCreateStaff(false);
          refetch();
        }}
      />

      <AccountDetailModal
        open={!!detailUser}
        item={detailUser}
        onClose={() => setDetailUser(null)}
        onUpdated={(updated) => {
          setDetailUser(updated);
          setUiAccounts((cur) => cur.map((x) => x.id === updated.id ? { ...x, ...updated } : x));
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        danger
        title="Xoá tài khoản"
        description={`Bạn có chắc muốn xoá account "${confirmTarget?.email}" không?`}
        confirmText="Xoá"
        cancelText="Huỷ"
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}
