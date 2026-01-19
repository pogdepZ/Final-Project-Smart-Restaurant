import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminModifierApi } from "../../../services/adminModifierApi";
import ScrollArea from "../../../Components/ScrollArea";

function toNumberSafe(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function OptionRow({ value, onChange, onRemove, disabled }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-5">
        <label className="text-xs text-gray-400 mb-1 block">Tên option</label>
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
            focus:outline-none focus:border-orange-500/40 transition"
          placeholder="VD: Size L / Extra cheese..."
          disabled={disabled}
        />
      </div>

      <div className="col-span-3">
        <label className="text-xs text-gray-400 mb-1 block">Price (+)</label>
        <input
          value={value.price_adjustment}
          onChange={(e) => onChange({ ...value, price_adjustment: e.target.value })}
          inputMode="decimal"
          className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
            focus:outline-none focus:border-orange-500/40 transition"
          placeholder="0"
          disabled={disabled}
        />
      </div>

      <div className="col-span-2">
        <label className="text-xs text-gray-400 mb-1 block">Status</label>
        <select
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value })}
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-neutral-950 text-white border border-white/10
            focus:outline-none focus:border-orange-500/40 transition
            [&>option]:bg-neutral-950 [&>option]:text-white"
          disabled={disabled}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>

      <div className="col-span-2 flex justify-end pt-6">
        <button
          type="button"
          onClick={onRemove}
          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20"
          disabled={disabled}
          title="Xoá option"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function CreateModifierModal({ open, onClose, onSuccess }) {
  // group fields
  const [name, setName] = useState("");
  const [selectionType, setSelectionType] = useState("single"); // single|multiple
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [status, setStatus] = useState("active");

  // options draft
  const [options, setOptions] = useState([
    { name: "", price_adjustment: "0", status: "active" },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSelectionType("single");
    setIsRequired(false);
    setMinSelections(0);
    setMaxSelections(0);
    setDisplayOrder(0);
    setStatus("active");
    setOptions([{ name: "", price_adjustment: "0", status: "active" }]);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const computed = useMemo(() => {
    // rule gợi ý cho UX:
    // single => max <= 1
    const min = toNumberSafe(minSelections, 0);
    const max = toNumberSafe(maxSelections, 0);
    return { min, max };
  }, [minSelections, maxSelections]);

  if (!open) return null;

  const addOptionRow = () => {
    setOptions((cur) => [...cur, { name: "", price_adjustment: "0", status: "active" }]);
  };

  const updateOptionRow = (idx, next) => {
    setOptions((cur) => cur.map((x, i) => (i === idx ? next : x)));
  };

  const removeOptionRow = (idx) => {
    setOptions((cur) => cur.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    const groupName = name.trim();
    if (!groupName) return toast.error("Tên group không được trống");

    const min = toNumberSafe(minSelections, 0);
    const max = toNumberSafe(maxSelections, 0);
    const order = toNumberSafe(displayOrder, 0);

    if (min < 0 || max < 0) return toast.error("Min/Max phải >= 0");
    if (max && min > max) return toast.error("Min không được lớn hơn Max");
    if (selectionType === "single" && max > 1) return toast.error("Single choice thì Max không được > 1");

    // validate options (lọc dòng rỗng)
    const cleanedOptions = options
      .map((o) => ({
        name: (o.name || "").trim(),
        price_adjustment: toNumberSafe(o.price_adjustment, 0),
        status: (o.status || "active").toLowerCase(),
      }))
      .filter((o) => o.name.length > 0);

    // cho phép tạo group không cần option, nhưng thường nên có ít nhất 1
    if (cleanedOptions.length === 0) {
      return toast.error("Cần ít nhất 1 option (hoặc nhập tên option)");
    }
    for (const o of cleanedOptions) {
      if (o.price_adjustment < 0) return toast.error("Price adjustment phải >= 0");
      if (o.status !== "active" && o.status !== "inactive") return toast.error("Status option không hợp lệ");
    }

    setSaving(true);
    try {
      // 1) create group
      const groupRes = await adminModifierApi.createGroup({
        name: groupName,
        selection_type: selectionType,
        is_required: isRequired,
        min_selections: min,
        max_selections: max,
        display_order: order,
        status,
      });

      // backend của bạn có thể trả { item } hoặc trả thẳng object
      const createdGroup = groupRes?.item || groupRes?.data?.item || groupRes;
      const groupId = createdGroup?.id;
      if (!groupId) throw new Error("Không lấy được groupId sau khi tạo");

      // 2) create options
      await Promise.all(
        cleanedOptions.map((o) =>
          adminModifierApi.createOption({
            group_id: groupId,
            name: o.name,
            price_adjustment: o.price_adjustment,
            status: o.status,
          })
        )
      );

      toast.success("Đã tạo modifier group + options");
      onSuccess?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-neutral-950 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">+ Tạo Modifier Group</div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5" disabled={saving}>
            <X size={18} className="text-gray-300" />
          </button>
        </div>

        <ScrollArea>
          <div className="max-h-[80vh] overflow-x-auto p-4 space-y-4">
            {/* GROUP INFO */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-white font-bold">Thông tin group</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <label className="text-xs text-gray-400 mb-1 block">Tên group</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                    focus:outline-none focus:border-orange-500/40 transition"
                    placeholder="VD: Size / Topping / Spicy level..."
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-400 mb-1 block">Selection type</label>
                  <select
                    value={selectionType}
                    onChange={(e) => setSelectionType(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-neutral-950 text-white border border-white/10
                    focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-950 [&>option]:text-white"
                    disabled={saving}
                  >
                    <option value="single">single</option>
                    <option value="multiple">multiple</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-400 mb-1 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-neutral-950 text-white border border-white/10
                    focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-950 [&>option]:text-white"
                    disabled={saving}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-400 mb-1 block">Min selections</label>
                  <input
                    value={minSelections}
                    onChange={(e) => setMinSelections(e.target.value)}
                    inputMode="numeric"
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                    focus:outline-none focus:border-orange-500/40 transition"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-400 mb-1 block">Max selections</label>
                  <input
                    value={maxSelections}
                    onChange={(e) => setMaxSelections(e.target.value)}
                    inputMode="numeric"
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                    focus:outline-none focus:border-orange-500/40 transition"
                    disabled={saving}
                  />
                  <div className="text-[11px] text-gray-500 mt-1">
                    {selectionType === "single" ? "Single: max nên là 1" : "Multiple: tuỳ bạn set"}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs text-gray-400 mb-1 block">Display order</label>
                  <input
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    inputMode="numeric"
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
                    focus:outline-none focus:border-orange-500/40 transition"
                    disabled={saving}
                  />
                </div>

                <div className="md:col-span-3 flex items-end">
                  <label className="inline-flex items-center gap-2 text-gray-200 text-sm">
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      disabled={saving}
                    />
                    Required
                  </label>
                </div>

                <div className="md:col-span-12 text-xs text-gray-400">
                  Preview: Min {computed.min} / Max {computed.max} • {selectionType}
                </div>
              </div>
            </div>

            {/* OPTIONS */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-bold">Options</div>
                <button
                  type="button"
                  onClick={addOptionRow}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
                  bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  disabled={saving}
                >
                  <Plus size={16} />
                  Add row
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {options.map((opt, idx) => (
                  <OptionRow
                    key={idx}
                    value={opt}
                    disabled={saving}
                    onChange={(next) => updateOptionRow(idx, next)}
                    onRemove={() => removeOptionRow(idx)}
                  />
                ))}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Tip: Dòng option nào để trống tên sẽ bị bỏ qua khi submit.
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            disabled={saving}
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30
              disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? "Đang tạo..." : "Tạo group + options"}
          </button>
        </div>
      </div>
    </div>
  );
}
