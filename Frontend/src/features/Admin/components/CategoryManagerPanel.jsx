import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../../Components/ConfirmModal";
import CreateCategoryModal from "./CreateCategoryModal";
import { adminMenuApi } from "../../../services/adminMenuApi";
import { Archive, RefreshCcw } from "lucide-react";

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

// ✅ Modal EDIT category (đúng chức năng)
function CategoryEditModal({ open, initial, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setDisplayOrder(Number(initial?.display_order ?? 0));
    setStatus(initial?.status || "active");
  }, [open, initial]);

  if (!open) return null;

  return (
    <ConfirmModal
      open={open}
      title="Sửa category"
      confirmText="Lưu"
      cancelText="Huỷ"
      loading={loading}
      description={
        <div className="space-y-3">
          <Field label="Tên">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
              focus:outline-none focus:border-orange-500/40"
            />
          </Field>

          <Field label="Mô tả">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
              focus:outline-none focus:border-orange-500/40"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Display order">
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value || 0))}
                className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                focus:outline-none focus:border-orange-500/40"
              />
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm
                           bg-neutral-950 text-white
                           border border-white/10
                           focus:outline-none focus:border-orange-500/40 transition
                           [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </Field>
          </div>
        </div>
      }
      onClose={() => {
        if (loading) return;
        onClose?.();
      }}
      onConfirm={async () => {
        try {
          if (!initial?.id) return toast.error("Thiếu category id");
          if (!name.trim()) return toast.error("Tên category không được rỗng");

          setLoading(true);

          const payload = {
            name: name.trim(),
            description: description?.trim() || null,
            displayOrder: Number(displayOrder) || 0,
            status,
          };

          await adminMenuApi.updateCategory(initial.id, payload);
          toast.success("Đã cập nhật category");
          onSuccess?.();
        } catch (e) {
          toast.error(e?.response?.data?.message || "Thao tác thất bại");
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

export default function CategoryManagerPanel({
  onReloadMenuItems,
  onReloadCategories,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // create/edit
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editCat, setEditCat] = useState(null);

  // delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCat, setDeleteCat] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [moveToCategoryId, setMoveToCategoryId] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminMenuApi.getListCategories({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setCategories(res?.categories || res || []);
    } catch (e) {
      toast.error("Không tải được categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return categories.filter((c) => {
      if (
        t &&
        !String(c.name || "")
          .toLowerCase()
          .includes(t)
      )
        return false;
      return true;
    });
  }, [categories, q]);

  return (
    <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 items-center">
          <div className="w-9 h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Archive className="text-orange-500" size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold leading-tight">Category</div>
            <div className="text-xs text-gray-400">
              {loading ? "Đang tải..." : `Có ${categories.length} categories`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search category..."
            className="bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/40"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white 
                       focus:outline-none focus:border-orange-500/40
                       [&>option]:bg-neutral-900 [&>option]:text-white"
          >
            <option value="ALL">ALL</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>

          <button
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition"
          >
            + Category
          </button>
          <button
            onClick={() => fetchCategories()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-gray-400 text-sm">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400 text-sm">Không có category</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-neutral-950/60 border border-white/10 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-bold">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.status} • order {c.display_order ?? 0}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                    onClick={() => {
                      setEditCat(c);
                      setOpenEdit(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20"
                    onClick={() => {
                      setDeleteCat(c);
                      setMoveToCategoryId("");
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

      {/* ✅ Create */}
      <CreateCategoryModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={() => {
          setOpenCreate(false);
          toast.success("Thêm category thành công");
          fetchCategories(); // reload list trong panel
          onReloadCategories?.(); // ✅ reload categories ở MenuManagement
          onReloadMenuItems?.(); // optional
        }}
      />

      {/* ✅ Edit */}
      <CategoryEditModal
        open={openEdit}
        initial={editCat}
        onClose={() => {
          setOpenEdit(false);
          setEditCat(null);
        }}
        onSuccess={() => {
          setOpenEdit(false);
          setEditCat(null);
          fetchCategories();
          onReloadMenuItems?.();
        }}
      />

      {/* ✅ Delete (có chuyển category) */}
      <ConfirmModal
        open={confirmOpen}
        danger
        title="Xoá category"
        confirmText="Xoá"
        cancelText="Huỷ"
        loading={deleting}
        description={
          <div className="space-y-3">
            <div className="text-gray-200">
              Bạn có chắc muốn xoá "<b>{deleteCat?.name}</b>" không?
            </div>

            <div className="text-xs text-gray-400">
              Nếu category này đang có menu items, hãy chọn category thay thế để
              chuyển món sang.
            </div>

            <select
              value={moveToCategoryId}
              onChange={(e) => setMoveToCategoryId(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-white/10 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:border-orange-500/40
                         [&>option]:bg-neutral-900 [&>option]:text-white"
            >
              <option value="">-- Chọn category thay thế --</option>
              {categories
                .filter((x) => x.id !== deleteCat?.id)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>
          </div>
        }
        onClose={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setDeleteCat(null);
          setMoveToCategoryId("");
        }}
        onConfirm={async () => {
          if (!deleteCat?.id) return;

          if (!moveToCategoryId) {
            toast.error("Bạn phải chọn category thay thế");
            return;
          }

          try {
            setDeleting(true);
            await adminMenuApi.deleteCategory(deleteCat.id, {
              moveToCategoryId,
            });

            toast.success("Đã xoá category & chuyển món");
            setConfirmOpen(false);
            setDeleteCat(null);
            setMoveToCategoryId("");

            fetchCategories();
            onReloadCategories?.(); // ✅
            onReloadMenuItems?.();
          } catch (e) {
            toast.error(e?.response?.data?.message || "Không thể xoá category");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
