import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, RefreshCcw } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmModal from "../../../Components/ConfirmModal";
import ToggleSwitch from "../../../Components/ToggleSwitch";
import { adminModifierApi } from "../../../services/adminModifierApi";
import ScrollArea from "../../../Components/ScrollArea";

function Pill({ status }) {
  const cls =
    status === "active"
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <input
        {...props}
        className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
          placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <select
        {...props}
        className="w-full rounded-xl px-3 py-2.5 text-sm
          bg-neutral-950 text-white border border-white/10
          focus:outline-none focus:border-orange-500/40 transition
          [&>option]:bg-neutral-950 [&>option]:text-white"
      >
        {children}
      </select>
    </label>
  );
}

export default function ModifierGroupDetailModal({ open, group, onClose, onChanged }) {
  const groupId = group?.id;

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null); // { group, options }
  const options = detail?.options ?? [];

  // Create option form
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("0");
  const [createStatus, setCreateStatus] = useState("active");
  const [creating, setCreating] = useState(false);

  // Inline edit option
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", price_adjustment: 0, status: "active" });
  const [savingMap, setSavingMap] = useState({}); // { optionId: true }
  const [togglingMap, setTogglingMap] = useState({}); // toggle active/inactive per option

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canShow = open && !!groupId;

  const load = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await adminModifierApi.getGroupDetail(groupId);
      const data = res?.group ? res : res?.data;
      setDetail(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không thể tải chi tiết group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [open]);

  useEffect(() => {
    if (!canShow) return;
    load();
    // reset create form each open
    setCreateName("");
    setCreatePrice("0");
    setCreateStatus("active");
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShow, groupId]);

  const startEdit = (opt) => {
    setEditingId(opt.id);
    setEditDraft({
      name: opt.name ?? "",
      price_adjustment: Number(opt.price_adjustment ?? 0),
      status: opt.status ?? "active",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (optId) => {
    const name = (editDraft.name || "").trim();
    if (!name) return toast.error("Tên option không được rỗng");

    const price = Number(editDraft.price_adjustment);
    if (!Number.isFinite(price) || price < 0) return toast.error("Giá điều chỉnh phải >= 0");

    setSavingMap((m) => ({ ...m, [optId]: true }));
    try {
      const res = await adminModifierApi.updateOption(optId, {
        name,
        price_adjustment: price,
        status: editDraft.status,
      });
      const updated = res?.item || res?.data?.item || res; // tuỳ BE response
      setDetail((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          options: cur.options.map((x) => (x.id === optId ? { ...x, ...updated } : x)),
        };
      });
      toast.success("Đã cập nhật option");
      setEditingId(null);
      onChanged?.(); // notify parent if needed
    } catch (e) {
      toast.error(e?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSavingMap((m) => {
        const c = { ...m };
        delete c[optId];
        return c;
      });
    }
  };

  const createOption = async () => {
    const name = (createName || "").trim();
    if (!name) return toast.error("Tên option không được rỗng");

    const price = Number(createPrice);
    if (!Number.isFinite(price) || price < 0) return toast.error("Giá điều chỉnh phải >= 0");

    setCreating(true);
    try {
      const res = await adminModifierApi.createOption({
        group_id: groupId,
        name,
        price_adjustment: price,
        status: createStatus,
      });
      const item = res?.item || res?.data?.item || res;
      setDetail((cur) => {
        if (!cur) return cur;
        return { ...cur, options: [item, ...(cur.options || [])] };
      });
      toast.success("Đã thêm option");
      setCreateName("");
      setCreatePrice("0");
      setCreateStatus("active");
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Thêm option thất bại");
    } finally {
      setCreating(false);
    }
  };

  const toggleOptionStatus = async (opt, nextActive) => {
    const nextStatus = nextActive ? "active" : "inactive";
    setTogglingMap((m) => ({ ...m, [opt.id]: true }));

    // optimistic
    setDetail((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        options: cur.options.map((x) => (x.id === opt.id ? { ...x, status: nextStatus } : x)),
      };
    });

    try {
      const res = await adminModifierApi.updateOption(opt.id, { status: nextStatus });
      const updated = res?.item || res?.data?.item || res;
      setDetail((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          options: cur.options.map((x) => (x.id === opt.id ? { ...x, ...updated } : x)),
        };
      });
      onChanged?.();
    } catch (e) {
      // rollback
      setDetail((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          options: cur.options.map((x) => (x.id === opt.id ? { ...x, status: opt.status } : x)),
        };
      });
      toast.error(e?.response?.data?.message || "Đổi trạng thái thất bại");
    } finally {
      setTogglingMap((m) => {
        const c = { ...m };
        delete c[opt.id];
        return c;
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[96vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl
          bg-neutral-950 border border-white/10 shadow-xl overflow-hidden">
        {/* header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white font-black text-lg truncate">{group?.name || "Modifier group"}</div>
            <div className="mt-1 text-xs text-gray-400">
              {group?.selection_type === "single" ? "Single choice" : "Multiple choice"} •{" "}
              {group?.is_required ? "Required" : "Optional"} • Min {group?.min_selections ?? 0} / Max{" "}
              {group?.max_selections ?? 0} • <Pill status={group?.status || "active"} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
                bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
            >
              <RefreshCcw size={16} />
              Reload
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <ScrollArea>
          {/* body */}
          <div className="max-h-105 overflow-x-auto p-5">
            {/* Create option */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-bold">Thêm option</div>
                <div className="text-xs text-gray-400">Option thuộc group này</div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <Input
                    label="Tên option"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="VD: Size L / Extra cheese..."
                  />
                </div>

                <div className="md:col-span-3">
                  <Input
                    label="Giá điều chỉnh"
                    value={createPrice}
                    onChange={(e) => setCreatePrice(e.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>

                <div className="md:col-span-3">
                  <Select label="Status" value={createStatus} onChange={(e) => setCreateStatus(e.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </Select>
                </div>

                <div className="md:col-span-12 flex justify-end">
                  <button
                    disabled={creating}
                    onClick={createOption}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition
                    disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    Add option
                  </button>
                </div>
              </div>
            </div>

            {/* Options list */}
            <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="text-white font-bold">Options</div>
                <div className="text-xs text-gray-400">{loading ? "Đang tải..." : `${options.length} options`}</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-950/60 border-b border-white/10">
                    <tr className="text-left text-xs text-gray-400">
                      <th className="py-3 px-4 w-[55%] sm:w-[50%]">Tên</th>

                      {/* Ẩn mobile */}
                      <th className="hidden sm:table-cell py-3 px-4 w-[15%]">Price</th>

                      {/* Ẩn mobile */}
                      <th className="hidden sm:table-cell py-3 px-4 w-[20%]">Status</th>

                      <th className="py-3 px-4 text-right w-[45%] sm:w-[50%]">Actions</th>
                    </tr>
                  </thead>


                  <tbody>
                    {loading ? (
                      <tr>
                        {/* mobile chỉ còn 2 cột, desktop 4 cột */}
                        <td colSpan={2} className="py-10 text-center text-gray-400 sm:hidden">
                          Đang tải options...
                        </td>
                        <td colSpan={4} className="hidden sm:table-cell py-10 text-center text-gray-400">
                          Đang tải options...
                        </td>
                      </tr>
                    ) : options.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-10 text-center sm:hidden">
                          <div className="text-white font-bold">Chưa có option</div>
                          <div className="text-gray-400 text-sm mt-1">Hãy thêm option ở phần trên.</div>
                        </td>
                        <td colSpan={4} className="hidden sm:table-cell py-10 text-center">
                          <div className="text-white font-bold">Chưa có option</div>
                          <div className="text-gray-400 text-sm mt-1">Hãy thêm option ở phần trên.</div>
                        </td>
                      </tr>
                    ) : (
                      options.map((opt) => {
                        const isEditing = editingId === opt.id;

                        return (
                          <React.Fragment key={opt.id}>
                            {/* Row chính */}
                            <tr className="border-b border-white/5 hover:bg-white/5 transition">
                              {/* Name */}
                              <td className="py-3 px-4 align-top">
                                {isEditing ? (
                                  <input
                                    value={editDraft.name}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                  focus:outline-none focus:border-orange-500/40"
                                  />
                                ) : (
                                  <div className="text-white font-bold wrap-break-words">{opt.name}</div>
                                )}

                                {/* ✅ Mobile preview: show price + status as small text (khi không edit) */}
                                {!isEditing ? (
                                  <div className="sm:hidden mt-1 text-xs text-gray-400 space-y-1">
                                    <div>Price: {Number(opt.price_adjustment ?? 0).toLocaleString("vi-VN")}</div>
                                    <div className="inline-flex items-center gap-2">
                                      <span>Status:</span>
                                      <Pill status={opt.status} />
                                    </div>
                                  </div>
                                ) : null}
                              </td>

                              {/* Price (desktop only) */}
                              <td className="hidden sm:table-cell py-3 px-4 align-top">
                                {isEditing ? (
                                  <input
                                    value={String(editDraft.price_adjustment)}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, price_adjustment: e.target.value }))}
                                    inputMode="decimal"
                                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white
                  focus:outline-none focus:border-orange-500/40"
                                  />
                                ) : (
                                  <div className="text-gray-200">
                                    {Number(opt.price_adjustment ?? 0).toLocaleString("vi-VN")}
                                  </div>
                                )}
                              </td>

                              {/* Status (desktop only) */}
                              <td className="hidden sm:table-cell py-3 px-4 align-top">
                                <div className="flex items-center gap-2">
                                  <ToggleSwitch
                                    checked={opt.status === "active"}
                                    disabled={!!togglingMap[opt.id]}
                                    onChange={(next) => toggleOptionStatus(opt, next)}
                                    label="Active"
                                  />
                                  {isEditing ? (
                                    <select
                                      value={editDraft.status}
                                      onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value }))}
                                      className="rounded-xl px-3 py-2 text-sm bg-neutral-950 text-white border border-white/10
                    focus:outline-none focus:border-orange-500/40 [&>option]:bg-neutral-950 [&>option]:text-white"
                                    >
                                      <option value="active">active</option>
                                      <option value="inactive">inactive</option>
                                    </select>
                                  ) : (
                                    <Pill status={opt.status} />
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right align-top">
                                {isEditing ? (
                                  <div className="inline-flex items-center gap-2 justify-end">
                                    <button
                                      disabled={!!savingMap[opt.id]}
                                      onClick={() => saveEdit(opt.id)}
                                      className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-200
                    hover:bg-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => startEdit(opt)}
                                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteItem(opt);
                                        setConfirmOpen(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>

                            {/* ✅ Mobile-only edit row: hiện Price + Status khi đang edit */}
                            {isEditing ? (
                              <tr className="sm:hidden border-b border-white/5 bg-white/3">
                                <td colSpan={2} className="p-4">
                                  <div className="grid grid-cols-1 gap-3">
                                    {/* Price edit */}
                                    <label className="block">
                                      <div className="text-xs text-gray-400 mb-1">Price</div>
                                      <input
                                        value={String(editDraft.price_adjustment)}
                                        onChange={(e) =>
                                          setEditDraft((d) => ({ ...d, price_adjustment: e.target.value }))
                                        }
                                        inputMode="decimal"
                                        className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                      focus:outline-none focus:border-orange-500/40"
                                      />
                                    </label>

                                    {/* Status edit */}
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <ToggleSwitch
                                          checked={editDraft.status === "active"}
                                          disabled={!!togglingMap[opt.id]}
                                          onChange={(next) =>
                                            setEditDraft((d) => ({ ...d, status: next ? "active" : "inactive" }))
                                          }
                                          label="Active"
                                        />
                                      </div>

                                      <select
                                        value={editDraft.status}
                                        onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value }))}
                                        className="rounded-xl px-3 py-2 text-sm bg-neutral-950 text-white border border-white/10
                      focus:outline-none focus:border-orange-500/40 [&>option]:bg-neutral-950 [&>option]:text-white"
                                      >
                                        <option value="active">active</option>
                                        <option value="inactive">inactive</option>
                                      </select>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* delete option confirm */}
        <ConfirmModal
          open={confirmOpen}
          danger
          title="Xoá option"
          description={`Bạn có chắc muốn xoá option "${deleteItem?.name}" không?`}
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
              await adminModifierApi.deleteOption(deleteItem.id);
              setDetail((cur) => {
                if (!cur) return cur;
                return { ...cur, options: cur.options.filter((x) => x.id !== deleteItem.id) };
              });
              toast.success("Đã xoá option");
              setConfirmOpen(false);
              setDeleteItem(null);
              onChanged?.();
            } catch (e) {
              toast.error(e?.response?.data?.message || "Xoá thất bại");
            } finally {
              setDeleting(false);
            }
          }}
        />
      </div>
    </div>
  );
}
