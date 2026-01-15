import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  UtensilsCrossed,
  Search,
  Filter,
  RefreshCcw,
  Tag,
  ArrowUpDown,
  Star,
} from "lucide-react";

import { useAdminMenuItems } from "../../hooks/useAdminMenuItems";
import { useAdminMenuCategories } from "../../hooks/useAdminMenuCategories";
import { formatVND } from "../../utils/adminFormat";
import AdminMenuItemDetailModal from "./components/AdminMenuItemDetailModal";
import PaginationBar from "../../Components/PaginationBar";
import ToggleSwitch from "../../Components/ToggleSwitch";
import { useToggleChefRecommended } from "../../hooks/useToggleChefRecommended";
import CreateCategoryModal from "./components/CreateCategoryModal";
import CreateMenuItemModal from "./components/CreateMenuItemModal";
import EditMenuItemModal from "./components/EditMenuItemModal";
import ConfirmModal from "../../Components/ConfirmModal";
import CategoryManagerPanel from "./components/CategoryManagerPanel";
import ModifierManagerPanel from "./components/ModifierManagerPanel";
import { adminMenuApi } from "../../services/adminMenuApi";

const STATUS_META = {
  available: { label: "Available", className: "bg-green-500/10 text-green-300 border-green-500/20" },
  unavailable: { label: "Unavailable", className: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" },
  sold_out: { label: "Sold out", className: "bg-red-500/10 text-red-300 border-red-500/20" },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status || "—", className: "bg-white/5 text-gray-200 border-white/10" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-3 pl-4">
        <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-24 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <div className="ml-auto h-4 w-24 bg-white/5 rounded animate-pulse" />
      </td>
    </tr>
  );
}

export default function MenuManagement() {
  // filters (server-side)
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [chefOnly, setChefOnly] = useState(false);
  const [sort, setSort] = useState("NEWEST");

  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [openCreateItem, setOpenCreateItem] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);     // xem chi tiết
  const [deleteItem, setDeleteItem] = useState(null);     // confirm xoá
  const [deleting, setDeleting] = useState(false);


  // paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { toggle: toggleChef, isLoading: toggleLoading } = useToggleChefRecommended();

  const toggleStatus = async (it, nextChecked) => {
    const id = it.id;
    const prevStatus = it.status; // "available" | "unavailable" | "sold_out"
    const nextStatus = nextChecked ? "available" : "unavailable";

    // optimistic
    setUiItems((cur) =>
      cur.map((x) => (x.id === id ? { ...x, status: nextStatus } : x))
    );
    setStatusMap((m) => ({ ...m, [id]: true }));

    try {
      // ✅ Option A: nếu bạn có endpoint updateMenuItem
      // await adminMenuApi.updateMenuItem(id, { status: nextStatus });

      // ✅ Option B: nếu bạn có endpoint riêng
      // await adminMenuApi.updateStatus(id, nextStatus);

      // ✅ Option C: nếu BE đang dùng PUT/PATCH chung:
      await adminMenuApi.updateMenuItem(id, { status: nextStatus });

      toast.success(`Đã đổi status: ${nextStatus}`);
    } catch (err) {
      // rollback
      setUiItems((cur) =>
        cur.map((x) => (x.id === id ? { ...x, status: prevStatus } : x))
      );
      toast.error(err?.response?.data?.message || "Đổi status thất bại");
    } finally {
      setStatusMap((m) => {
        const clone = { ...m };
        delete clone[id];
        return clone;
      });
    }
  };


  const params = useMemo(
    () => ({
      q,
      categoryId,
      status,
      chef: chefOnly ? "true" : "",
      sort,
      page,
      limit,
    }),
    [q, categoryId, status, chefOnly, sort, page, limit]
  );

  const {
    categories,
    isLoading: catLoading,
    refetch: refetchCategories,
  } = useAdminMenuCategories();
  const { data, isLoading, error, refetch } = useAdminMenuItems(params);

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page, limit, total: 0, totalPages: 1 };

  // ✅ local UI items để optimistic
  const [uiItems, setUiItems] = useState([]);
  useEffect(() => {
    setUiItems(items);
  }, [items]);

  useEffect(() => {
    if (categoryId === "ALL") return;
    const exists = categories.some((c) => c.id === categoryId);
    if (!exists) setCategoryId("ALL");
  }, [categories, categoryId]);

  // ✅ loading theo từng item
  const [togglingMap, setTogglingMap] = useState({}); // { [id]: true/false }
  const [statusMap, setStatusMap] = useState({});

  const totalPages = pagination.totalPages || 1;

  const refreshAll = () => {
    refetch();
  };

  // Khi đổi filter => reset về page 1
  const resetPage = () => setPage(1);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Menu Management
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Quản lý{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              menu
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Search • Filter • Sort • Pagination
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
            Tổng:{" "}
            <span className="text-white font-bold">
              {isLoading ? "—" : pagination.total}
            </span>{" "}
            món
          </div>

          <button
            onClick={() => setOpenCreateCategory(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
               bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            + Category
          </button>

          <button
            onClick={() => setOpenCreateItem(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
               bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition"
          >
            + New item
          </button>

          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
               bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

      </div>

      {/* Filters */}
      <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-full">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Filter className="text-orange-500" size={18} />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search */}
              <div className="md:col-span-4">
                <label className="text-xs text-gray-400 mb-1 block">Tìm theo tên</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      resetPage();
                    }}
                    placeholder="VD: Pasta / Mojito..."
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      resetPage();
                    }}
                    className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm
                              bg-neutral-950 text-white
                              border border-white/10
                              focus:outline-none focus:border-orange-500/40 transition
                              [&>option]:bg-neutral-950 [&>option]:text-white"
                  >
                    <option value="ALL">Tất cả</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      resetPage();
                    }}
                    className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm
                              bg-neutral-950 text-white
                              border border-white/10
                              focus:outline-none focus:border-orange-500/40 transition
                              [&>option]:bg-neutral-950 [&>option]:text-white"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="sold_out">Sold out</option>
                  </select>
                </div>
              </div>

              {/* Sort */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Sort</label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value);
                      resetPage();
                    }}
                    className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm
                              bg-neutral-950 text-white
                              border border-white/10
                              focus:outline-none focus:border-orange-500/40 transition
                              [&>option]:bg-neutral-950 [&>option]:text-white"
                  >
                    <option value="NEWEST">Mới nhất</option>
                    <option value="OLDEST">Cũ nhất</option>
                    <option value="PRICE_ASC">Giá tăng dần</option>
                    <option value="PRICE_DESC">Giá giảm dần</option>
                    <option value="NAME_ASC">Tên A → Z</option>
                    <option value="NAME_DESC">Tên Z → A</option>
                    <option value="POPULAR">Phổ biến</option>
                  </select>
                </div>
              </div>

              {/* Chef */}
              <div className="md:col-span-12 flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setChefOnly((v) => !v);
                    resetPage();
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition
                    ${chefOnly
                      ? "bg-orange-500/15 border-orange-500/30 text-orange-200"
                      : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"}`}
                >
                  <Star size={16} className={chefOnly ? "text-orange-400" : "text-gray-400"} />
                  Chef recommended
                </button>

                <div className="text-xs text-gray-400">
                  {catLoading ? "Đang tải categories..." : `Có ${categories.length} categories`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">Danh sách menu items</div>
          <div className="text-xs text-gray-400">Click 1 dòng để xem chi tiết</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-245">
            <thead className="bg-neutral-950/60 border-b border-white/10">
              <tr className="text-left text-xs text-gray-400">
                <th className="py-3 pr-3 pl-4 w-[45%]">Món / Category</th>
                <th className="py-3 px-3 w-[15%]">Status</th>
                <th className="py-3 px-3 w-[15%]">Chef</th>
                <th className="py-3 px-3 w-[15%]">Actions</th>
                <th className="py-3 pl-3 pr-4 text-right w-[25%]">Giá</th>
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: limit }).slice(0, 8).map((_, i) => <SkeletonRow key={i} />)
                : uiItems.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => setDetailItem(it)}
                    className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                  >
                    <td className="py-3 pr-3 pl-4 align-top">
                      <div className="text-white font-bold">{it.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{it.categoryName || "—"}</div>
                    </td>

                    <td
                      className="py-3 px-3 align-top"
                      onClick={(e) => e.stopPropagation()} // ✅ không mở detail modal khi toggle
                    >
                      <div className="flex items-center gap-3">

                        <div className="flex items-center gap-2">
                          <ToggleSwitch
                            checked={it.status === "available"}
                            disabled={!!statusMap[it.id] || it.status === "sold_out"} // sold_out thì khoá
                            onChange={(nextChecked) => toggleStatus(it, nextChecked)}
                            label="Status"
                          />
                          <StatusPill status={it.status} />
                        </div>
                      </div>
                    </td>


                    {/* ✅ cột Chef = toggle mượt */}
                    <td className="py-3 px-3 align-top">
                      <div
                        className="inline-flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()} // không mở modal
                      >
                        <ToggleSwitch
                          checked={!!it.isChefRecommended}
                          disabled={!!togglingMap[it.id]}
                          onChange={async (next) => {
                            const id = it.id;
                            const prev = !!it.isChefRecommended;

                            // optimistic UI
                            setUiItems((cur) =>
                              cur.map((x) =>
                                x.id === id ? { ...x, isChefRecommended: next } : x
                              )
                            );
                            setTogglingMap((m) => ({ ...m, [id]: true }));

                            try {
                              await toggleChef(id, next);
                              // success: giữ state như hiện tại
                            } catch (err) {
                              // rollback nếu fail
                              setUiItems((cur) =>
                                cur.map((x) =>
                                  x.id === id ? { ...x, isChefRecommended: prev } : x
                                )
                              );
                            } finally {
                              setTogglingMap((m) => {
                                const clone = { ...m };
                                delete clone[id];
                                return clone;
                              });
                            }
                          }}
                          label="Chef recommended"
                        />

                        <span
                          className={`text-xs ${it.isChefRecommended ? "text-orange-300" : "text-gray-500"
                            }`}
                        >
                          {it.isChefRecommended ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>

                    <td
                      className="py-3 px-3 align-top"
                      onClick={(e) => e.stopPropagation()} // ✅ không mở detail modal
                    >
                      <div className="inline-flex items-center gap-2 justify-end"
                        onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                          onClick={() => {
                            setEditItem(it);   // mở modal edit
                            setEditOpen(true);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20"
                          onClick={() => {
                            setDeleteItem(it);
                            setConfirmOpen(true);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>


                    <td className="py-3 pl-3 pr-4 align-top text-right">
                      <div className="text-white font-bold">
                        {typeof it.price === "number" ? formatVND(it.price) : "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Prep: {it.prepTimeMinutes ?? 0} phút
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <div className="text-white font-bold">Không có món phù hợp</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Thử đổi filter hoặc từ khóa tìm kiếm.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination */}
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

      <CategoryManagerPanel
        onReloadMenuItems={refetch}
        onReloadCategories={refetchCategories}
      />

      <ModifierManagerPanel onReload={refetch} />

      {/* Modal */}
      <AdminMenuItemDetailModal
        open={!!detailItem}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />


      <CreateCategoryModal
        open={openCreateCategory}
        onClose={() => setOpenCreateCategory(false)}
        onSuccess={async () => {
          setOpenCreateCategory(false);
          await refetchCategories(); // ✅ reload categories (filter + create item)
          refetch();                 // ✅ reload menu items nếu bạn muốn
        }}
      />


      <CreateMenuItemModal
        open={openCreateItem}
        categories={categories}
        onClose={() => setOpenCreateItem(false)}
        onSuccess={() => {
          setOpenCreateItem(false);
          refetch();
        }}
      />

      <EditMenuItemModal
        open={editOpen}
        item={editItem}
        categories={categories}
        onClose={() => { setEditOpen(false); setEditItem(null); }}
        onUpdated={(updated) => {
          setUiItems((cur) => cur.map((x) => x.id === updated.id ? { ...x, ...updated } : x));
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        danger
        title="Xoá món ăn"
        description={`Bạn có chắc muốn xoá món "${deleteItem?.name}" không?`}
        confirmText="Xoá"
        cancelText="Huỷ"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={async () => {
          try {
            setDeleting(true);
            await adminMenuApi.deleteMenuItem(deleteItem.id);
            setUiItems((cur) => cur.filter((x) => x.id !== deleteItem.id));
            toast.success("Đã xoá món");
            setConfirmOpen(false);
            setDeleteItem(null);     // ✅ reset đúng
          } catch (e) {
            toast.error(e?.response?.data?.message || "Xoá thất bại");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
