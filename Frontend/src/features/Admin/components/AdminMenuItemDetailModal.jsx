import React, { useEffect, useMemo, useState } from "react";
import { X, UtensilsCrossed } from "lucide-react";
import { formatVND } from "../../../utils/adminFormat";
import { adminMenuApi } from "../../../services/adminMenuApi";
import ScrollArea from "../../../Components/ScrollArea";

const STATUS_META = {
  available: {
    label: "Available",
    className: "bg-green-500/10 text-green-300 border-green-500/20",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  },
  sold_out: {
    label: "Sold out",
    className: "bg-red-500/10 text-red-300 border-red-500/20",
  },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || {
    label: status || "—",
    className: "bg-white/5 text-gray-200 border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-100 font-semibold text-right">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function AdminMenuItemDetailModal({ open, item, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ thêm state cho modifier groups
  const [allGroups, setAllGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const itemId = item?.id;

  // ✅ useMemo phải đặt TRƯỚC return condition
  const selectedGroupIds =
    detail?.modifierGroupIds || item?.modifierGroupIds || [];

  const selectedGroups = useMemo(() => {
    if (!Array.isArray(selectedGroupIds) || !selectedGroupIds.length) return [];
    const set = new Set(selectedGroupIds);
    return (allGroups || []).filter((g) => set.has(g.id));
  }, [allGroups, selectedGroupIds]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !itemId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        // chạy song song: detail + groups
        setLoadingGroups(true);
        const [detailRes, groupsRes] = await Promise.all([
          adminMenuApi.getMenuItemDetail(itemId),
          adminMenuApi.getModifierGroups({ status: "ALL" }), // ALL để khỏi mất group inactive
        ]);

        if (cancelled) return;

        setDetail(detailRes?.item || null);
        setAllGroups(groupsRes?.groups || groupsRes?.data?.groups || []);
      } catch (e) {
        if (cancelled) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được chi tiết món.",
        );
        setDetail(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingGroups(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  // ✅ return condition đặt SAU hooks
  if (!open) return null;

  // ✅ thêm guard UI: open=true nhưng chưa có itemId
  if (!itemId) {
    return (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 p-6 text-gray-200">
            Không có ID món ăn (item.id bị thiếu).
          </div>
        </div>
      </div>
    );
  }

  const titleName = detail?.name ?? item?.name ?? "—";
  const view = detail ?? item;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !loading && onClose?.()}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <UtensilsCrossed className="text-orange-500" size={18} />
              </div>
              <div>
                <div className="text-white font-black leading-tight">
                  Chi tiết món{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                    {titleName}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Thông tin món ăn trong menu
                </div>
              </div>
            </div>

            <button
              onClick={() => !loading && onClose?.()}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-60"
              type="button"
              aria-label="Close"
              disabled={loading}
            >
              <X size={18} />
            </button>
          </div>

          <ScrollArea>
            {loading ? (
              <div className="p-10 text-center">
                <div className="text-white font-bold">Đang tải chi tiết...</div>
                <div className="text-gray-400 text-sm mt-1">Vui lòng chờ</div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
                  {error}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                    type="button"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold">Thông tin</div>
                    <StatusPill status={view?.status} />
                  </div>

                  <div className="mt-3 divide-y divide-white/10">
                    <InfoRow label="Tên món" value={view?.name} />
                    <InfoRow label="Category" value={view?.categoryName} />
                    <InfoRow
                      label="Giá"
                      value={
                        typeof view?.price === "number"
                          ? formatVND(view.price)
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Prep time"
                      value={
                        view?.prepTimeMinutes != null
                          ? `${view.prepTimeMinutes} phút`
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Chef recommend"
                      value={view?.isChefRecommended ? "Yes" : "No"}
                    />
                  </div>

                  {/* ✅ MODIFIERS */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-white font-bold mb-2">Modifiers</div>

                    {loadingGroups ? (
                      <div className="text-sm text-gray-500">
                        Đang tải modifiers...
                      </div>
                    ) : Array.isArray(selectedGroupIds) &&
                      selectedGroupIds.length ? (
                      selectedGroups.length ? (
                        <div className="space-y-2">
                          {selectedGroups.map((g) => (
                            <div
                              key={g.id}
                              className="rounded-xl border border-white/10 bg-neutral-950/40 p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-sm text-white font-semibold">
                                  {g.name}
                                </div>
                                <div className="text-xs text-gray-400 text-right">
                                  {g.selectionType} •{" "}
                                  {g.isRequired ? "required" : "optional"} • min{" "}
                                  {g.minSelections} / max {g.maxSelections}
                                </div>
                              </div>

                              {Array.isArray(g.options) && g.options.length ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {g.options.map((o) => (
                                    <span
                                      key={o.id}
                                      className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-200"
                                    >
                                      {o.name}
                                      {Number(o.priceAdjustment) > 0
                                        ? ` (+${formatVND(Number(o.priceAdjustment))})`
                                        : ""}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-gray-500">
                                  Không có option
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Món có gắn modifier nhưng không tìm thấy group (có thể
                          group inactive / đã xoá).
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-gray-500">
                        Món này chưa gắn modifier group.
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 text-white font-bold">
                    Mô tả
                  </div>
                  <div className="p-4 text-gray-200 text-sm whitespace-pre-wrap">
                    {view?.description || "—"}
                  </div>

                  {view?.imageUrl ? (
                    <div className="px-4 pb-4">
                      <img
                        src={view.imageUrl}
                        alt={view.name}
                        className="w-full max-h-70 object-cover rounded-2xl border border-white/10"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
