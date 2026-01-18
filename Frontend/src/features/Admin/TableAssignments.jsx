// src/pages/Admin/TableAssignments/TableAssignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { tableApi } from "../../services/tableApi";

import {
  ClipboardList,
  Table as TableIcon,
  Users,
  RefreshCcw,
  Save,
  Search,
  Filter,
  MapPin,
} from "lucide-react";

/**
 * API expectation:
 * - GET  /admin/waiters                         -> { items: [{id,name,email}] } OR array
 * - GET  /admin/tables?status=active            -> array OR {items:[]}
 * - GET  /admin/table-assignments/:waiterId     -> { tableIds: [uuid...] }
 * - PUT  /admin/table-assignments/:waiterId     -> { message, tableIds }
 */

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-3 pl-4">
        <div className="h-4 w-5 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
        <div className="mt-2 h-3 w-36 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <div className="h-6 w-24 bg-white/5 rounded-full animate-pulse ml-auto" />
      </td>
    </tr>
  );
}

function StatusPill({ checked }) {
  return checked ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold bg-orange-500/10 text-orange-200 border-orange-500/20">
      Assigned
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold bg-white/5 text-gray-200 border-white/10">
      Not assigned
    </span>
  );
}

export default function TableAssignments() {

  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);

  const [selectedWaiterId, setSelectedWaiterId] = useState("");

  // Filters
  const [q, setQ] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL"); // ALL | Indoor | Outdoor | Patio | VIP Room
  const [onlyAssigned, setOnlyAssigned] = useState("ALL"); // ALL | YES | NO

  // Assignment state
  const [assignedTableIds, setAssignedTableIds] = useState(new Set());
  const [initialAssignedIds, setInitialAssignedIds] = useState(new Set());

  // Loading
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedWaiter = useMemo(
    () => waiters.find((w) => w.id === selectedWaiterId),
    [waiters, selectedWaiterId]
  );

  const dirty = useMemo(() => {
    // compare Set sizes + values
    if (assignedTableIds.size !== initialAssignedIds.size) return true;
    for (const id of assignedTableIds) if (!initialAssignedIds.has(id)) return true;
    return false;
  }, [assignedTableIds, initialAssignedIds]);

  const fetchInit = async () => {
    setLoadingInit(true);
    try {
      const [wItems, tItems] = await Promise.all([
        tableApi.getWaiters(),
        tableApi.getTables({ status: "active" }),
      ]);

      setWaiters(wItems);
      setTables(tItems);
    } catch (e) {
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoadingInit(false);
    }
  };


  const fetchAssignments = async (waiterId) => {
    if (!waiterId) return;
    setLoadingAssign(true);
    try {
      const res = await tableApi.getTableAssignmentsByWaiter(waiterId);
      const ids = new Set((res.tableIds || []).map(String));
      setAssignedTableIds(ids);
      setInitialAssignedIds(new Set(ids));
    } catch (e) {
      toast.error("Không tải được phân công");
    } finally {
      setLoadingAssign(false);
    }
  };


  useEffect(() => {
    fetchInit();
  }, []);

  useEffect(() => {
    if (!selectedWaiterId) {
      setAssignedTableIds(new Set());
      setInitialAssignedIds(new Set());
      return;
    }
    fetchAssignments(selectedWaiterId);
  }, [selectedWaiterId]);

  const toggleTable = (tableId) => {
    if (!selectedWaiterId) {
      toast.info("Chọn waiter trước");
      return;
    }
    setAssignedTableIds((prev) => {
      const next = new Set(prev);
      const key = String(tableId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (!selectedWaiterId) {
      toast.error("Chọn waiter trước");
      return;
    }

    setSaving(true);
    try {
      const tableIds = Array.from(assignedTableIds);
      const res = await tableApi.saveTableAssignmentsByWaiter(selectedWaiterId, tableIds);

      const savedIds = new Set((res.tableIds || tableIds).map(String));
      setAssignedTableIds(savedIds);
      setInitialAssignedIds(new Set(savedIds));
      toast.success("Đã lưu phân công");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };


  const resetToInitial = () => {
    setAssignedTableIds(new Set(initialAssignedIds));
    toast.info("Đã hoàn tác thay đổi");
  };

  const filteredTables = useMemo(() => {
    const kw = q.trim().toLowerCase();

    return (tables || [])
      .filter((t) => {
        if (locationFilter !== "ALL" && t.location !== locationFilter) return false;

        const isAssigned = assignedTableIds.has(String(t.id));
        if (onlyAssigned === "YES" && !isAssigned) return false;
        if (onlyAssigned === "NO" && isAssigned) return false;

        if (!kw) return true;

        const name = String(t.table_number || "").toLowerCase();
        const loc = String(t.location || "").toLowerCase();
        return name.includes(kw) || loc.includes(kw);
      })
      .sort((a, b) => String(a.table_number).localeCompare(String(b.table_number)));
  }, [tables, q, locationFilter, onlyAssigned, assignedTableIds]);

  const assignedCount = useMemo(() => assignedTableIds.size, [assignedTableIds]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <ClipboardList className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Table Assignments
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Phân công{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              bàn cho waiter
            </span>
          </h1>

          <div className="text-sm text-gray-400 mt-2">
            {selectedWaiter ? (
              <>
                Waiter đang chọn:{" "}
                <span className="text-white font-bold">{selectedWaiter.name}</span>{" "}
                <span className="text-gray-500">({selectedWaiter.email})</span>
              </>
            ) : (
              <>Chọn waiter để xem / chỉnh phân công.</>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm">
            Assigned: <span className="text-white font-bold">{selectedWaiterId ? assignedCount : "—"}</span>
          </div>

          <button
            onClick={fetchInit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            onClick={save}
            disabled={!selectedWaiterId || saving || loadingInit || loadingAssign}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition disabled:opacity-60"
            title={!dirty ? "Không có thay đổi" : "Lưu phân công"}
          >
            <Save size={16} />
            {saving ? "Đang lưu..." : "Save"}
          </button>

          {dirty && (
            <button
              onClick={resetToInitial}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition disabled:opacity-60"
            >
              Hoàn tác
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-full">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Filter className="text-orange-500" size={18} />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Waiter select */}
              <div className="md:col-span-4">
                <label className="text-xs text-gray-400 mb-1 block">Waiter</label>
                <select
                  value={selectedWaiterId}
                  onChange={(e) => setSelectedWaiterId(e.target.value)}
                  disabled={loadingInit || saving}
                  className="w-full rounded-xl px-3 py-2.5 text-sm
                    bg-neutral-950 text-white border border-white/10
                    focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-950 [&>option]:text-white"
                >
                  <option value="">-- chọn waiter --</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search table */}
              <div className="md:col-span-4">
                <label className="text-xs text-gray-400 mb-1 block">Tìm bàn</label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="VD: T-01 / VIP..."
                    className="w-full bg-neutral-950/60 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 transition"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Khu vực</label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm
                      bg-neutral-950 text-white border border-white/10
                      focus:outline-none focus:border-orange-500/40 transition
                      [&>option]:bg-neutral-950 [&>option]:text-white"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Patio">Patio</option>
                    <option value="VIP Room">VIP Room</option>
                  </select>
                </div>
              </div>

              {/* Only assigned */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Hiển thị</label>
                <select
                  value={onlyAssigned}
                  onChange={(e) => setOnlyAssigned(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm
                    bg-neutral-950 text-white border border-white/10
                    focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-950 [&>option]:text-white"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="YES">Chỉ bàn đã assign</option>
                  <option value="NO">Chỉ bàn chưa assign</option>
                </select>
              </div>

              <div className="md:col-span-12 text-xs text-gray-500">
                Tip: Click checkbox để assign/unassign. Nhấn <b>Save</b> để lưu.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table list */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-bold">Danh sách bàn (tick để phân công)</div>
          <div className="text-xs text-gray-400">
            {loadingInit || loadingAssign ? "Đang tải..." : `Hiển thị: ${filteredTables.length} bàn`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-245">
            <thead className="bg-neutral-950/60 border-b border-white/10">
              <tr className="text-left text-xs text-gray-400">
                <th className="py-3 pr-3 pl-4 w-[8%]">Pick</th>
                <th className="py-3 px-3 w-[42%]">Bàn</th>
                <th className="py-3 px-3 w-[20%]">Khu vực</th>
                <th className="py-3 px-3 w-[15%]">Sức chứa</th>
                <th className="py-3 pl-3 pr-4 text-right w-[15%]">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loadingInit || loadingAssign
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : filteredTables.map((t) => {
                  const checked = assignedTableIds.has(String(t.id));
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition ${!selectedWaiterId ? "opacity-60" : ""
                        }`}
                    >
                      <td className="py-3 pr-3 pl-4 align-top">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectedWaiterId || saving}
                          onChange={() => toggleTable(t.id)}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="text-white font-bold">{t.table_number}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          ID: <span className="text-gray-500">{t.id}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="text-gray-200">{t.location || "—"}</div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="text-gray-200">{t.capacity ?? "—"}</div>
                      </td>

                      <td className="py-3 pl-3 pr-4 align-top text-right">
                        <StatusPill checked={checked} />
                      </td>
                    </tr>
                  );
                })}

              {!loadingInit && !loadingAssign && filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <div className="text-white font-bold">Không có bàn phù hợp</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Thử đổi filter hoặc từ khóa.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-500 flex items-center justify-between">
          <div>
            {selectedWaiterId ? (
              <>
                Đã chọn: <span className="text-gray-300">{assignedCount}</span> bàn
              </>
            ) : (
              <>Chọn waiter để bắt đầu.</>
            )}
          </div>
          <div className={dirty ? "text-orange-200" : ""}>
            {dirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
          </div>
        </div>
      </div>
    </div>
  );
}
