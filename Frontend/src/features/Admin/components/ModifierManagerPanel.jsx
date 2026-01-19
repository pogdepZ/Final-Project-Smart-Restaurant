import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { SlidersHorizontal, RefreshCcw, Search } from "lucide-react";

import ConfirmModal from "../../../Components/ConfirmModal";
import CreateModifierModal from "./CreateModifierModal";
import ModifierGroupDetailModal from "./ModifierGroupDetailModal";
import { adminModifierApi } from "../../../services/adminModifierApi";

function SkeletonItem() {
  return (
    <div className="py-3 flex items-start justify-between gap-3 border-b border-white/5">
      <div className="min-w-0 flex-1">
        <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-72 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="h-8 w-28 bg-white/5 rounded-xl animate-pulse" />
    </div>
  );
}

export default function ModifierManagerPanel({ onReload }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [openCreate, setOpenCreate] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminModifierApi.getGroups({
        page: 1,
        limit: 200,
        sort: "NAME_ASC",
      });
      const data = res?.items ? res : res?.data; // tuỳ interceptor
      setItems(data?.items ?? []);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Không thể tải modifier groups",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // console.log("ModifierManagerPanel mounted");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((x) => (x.name || "").toLowerCase().includes(keyword));
  }, [items, q]);

  return (
    <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <SlidersHorizontal className="text-orange-500" size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold leading-tight">
              Modifier groups
            </div>
            <div className="text-xs text-gray-400">
              {loading ? "Đang tải..." : `Có ${items.length} groups`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên group..."
                className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm
              text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
              />
            </div>
          </div>
          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition"
          >
            + New Modifier
          </button>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {loading ? (
          <div className="py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-white font-bold">Không có group phù hợp</div>
            <div className="text-gray-400 text-sm mt-1">Thử đổi keyword.</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((it) => (
              <div
                key={it.id}
                className="py-3 flex items-start justify-between gap-3"
                onClick={() => {
                  setDetailGroup(it);
                  setDetailOpen(true);
                }}
              >
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">{it.name}</div>

                  <div className="text-xs text-gray-400 mt-1">
                    {it.selection_type === "single"
                      ? "Single choice"
                      : "Multiple choice"}{" "}
                    • {it.is_required ? "Required" : "Optional"} • Min{" "}
                    {it.min_selections ?? 0} / Max {it.max_selections ?? 0} •{" "}
                    <span
                      className={
                        it.status === "active"
                          ? "text-green-300"
                          : "text-yellow-300"
                      }
                    >
                      {it.status}
                    </span>
                    {typeof it.options_count === "number" ? (
                      <> • {it.options_count} options</>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteItem(it);
                      setConfirmOpen(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateModifierModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={async () => {
          setOpenCreate(false);
          await load();
          onReload?.();
        }}
      />

      <ModifierGroupDetailModal
        open={detailOpen}
        group={detailGroup}
        onClose={() => {
          setDetailOpen(false);
          setDetailGroup(null);
        }}
        onChanged={async () => {
          // reload panel để cập nhật options_count nếu bạn muốn
          await load();
          onReload?.();
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        danger
        title="Xoá modifier group"
        description={`Bạn có chắc muốn xoá "${deleteItem?.name}" không? (options sẽ bị xoá theo)`}
        confirmText="Xoá"
        cancelText="Huỷ"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={async () => {
          if (!deleteItem?.id) return;
          try {
            setDeleting(true);
            await adminModifierApi.deleteGroup(deleteItem.id); // ✅ FIX
            setItems((cur) => cur.filter((x) => x.id !== deleteItem.id));
            toast.success("Đã xoá group");
            setConfirmOpen(false);
            setDeleteItem(null);
            onReload?.();
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
