// src/pages/Admin/TableManagement/TableManagement.jsx
import React, { useMemo, useState, useEffect } from "react";
import axiosClient from "../../store/axiosClient";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { MdOutlineTableBar } from "react-icons/md";
import { useSocket } from "../../context/SocketContext";

import {
  Plus,
  Filter,
  Edit,
  Power,
  Archive,
  Grid,
  Square,
  X,
  MapPin,
  Users,
  RefreshCw,
} from "lucide-react";

import TableDetailPanel from "./components/TableDetailPanel";

const TableManagement = () => {
  const socket = useSocket();

  // --- STATE ---
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [errors, setErrors] = useState({});

  // Filter & Sort
  const [filters, setFilters] = useState({
    status: "",
    location: "",
    sort: "name_asc",
  });

  // Modal Create/Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    table_number: "",
    capacity: 4,
    location: "",
    description: "",
    status: "active",
  });

  const validateForm = () => {
    const newErrors = {};

    if (!String(formData.table_number || "").trim()) {
      newErrors.table_number = "Vui lòng nhập số bàn";
    } else if (String(formData.table_number).length > 10) {
      newErrors.table_number = "Tên bàn quá dài (tối đa 10 ký tự)";
    }

    const cap = parseInt(formData.capacity);
    if (!formData.capacity) {
      newErrors.capacity = "Nhập sức chứa";
    } else if (isNaN(cap) || cap < 1 || cap > 20) {
      newErrors.capacity = "Sức chứa từ 1-20 người";
    }

    if (!formData.location) {
      newErrors.location = "Vui lòng chọn vị trí";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- SOCKET LISTENER ---
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe cập nhật bàn thông thường
    socket.on("table_update", (payload) => {
      const { type, table } = payload || {};
      if (!table?.id) return;

      if (type === "update") {
        setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
        // toast.info(`Bàn ${table.table_number} vừa cập nhật!`);
      } else if (type === "create") {
        setTables((prev) => [...prev, table]);
        // toast.success(`Bàn mới ${table.table_number} vừa được tạo!`);
      }
    });

    // Lắng nghe khi có khách quét QR / kết thúc session
    socket.on("table_session_update", (payload) => {
      console.log("TableManagement: table_session_update", payload);

      
      const { type, table } = payload || {};
      if (!table?.id) return;


      // Cập nhật bàn trong danh sách
      setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));

      if (type === "session_started") {
        toast.info(`🟢 Bàn ${table.table_number} có khách mới!`, {
          icon: "🪑",
        });
      } else if (type === "session_ended") {
        toast.info(`⚪ Bàn ${table.table_number} đã trống`, {
          icon: "✅",
        });
      }
    });

    return () => {
      socket.off("table_update");
      socket.off("table_session_update");
    };
  }, [socket]);

  // --- FETCH TABLES ---
  const fetchTables = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/admin/tables?${query}`);
      setTables(res);
    } catch (err) {
      toast.error("Lỗi tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // --- BULK ACTIONS ---
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("SmartRestaurant_QR_Codes");
    toast.info("Đang nén file ZIP...");

    for (const table of tables) {
      const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?qrToken=${table.qr_token}`;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        clientUrl,
      )}`;

      try {
        const response = await fetch(qrApi);
        const blob = await response.blob();
        folder.file(`QR_${table.table_number}.png`, blob);
      } catch (err) {
        console.error(err);
      }
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "All_Tables_QR.zip");
      toast.success("Tải ZIP thành công!");
    });
  };

  const handleGeneratePDF = async (layoutType = "grid") => {
    toast.info("Đang tạo PDF...");
    const doc = new jsPDF();

    let x = 15,
      y = 20,
      size = 70,
      fontSize = 16,
      count = 0;

    if (layoutType === "single") {
      x = 35;
      y = 40;
      size = 140;
      fontSize = 30;
    }

    for (const table of tables) {
      const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?qrToken=${table.qr_token}`;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        clientUrl,
      )}`;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = qrApi;
      await new Promise((r) => (img.onload = r));

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL("image/png");

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");

      const textWidth = doc.getTextWidth(String(table.table_number));
      doc.text(String(table.table_number), x + (size - textWidth) / 2, y - 5);
      doc.addImage(imgData, "PNG", x, y, size, size);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(String(table.location || ""), x + size / 2, y + size + 5, {
        align: "center",
      });

      if (layoutType === "grid") {
        count++;
        if (count % 2 !== 0) x += 100;
        else {
          x = 15;
          y += 120;
        }
        if (count % 4 === 0 && count < tables.length) {
          doc.addPage();
          x = 15;
          y = 20;
        }
      } else {
        if (tables.indexOf(table) < tables.length - 1) doc.addPage();
      }
    }

    window.open(doc.output("bloburl"), "_blank");
    toast.success("PDF sẵn sàng!");
  };

  const handleBulkRegenerate = async () => {
    const msg =
      "⚠️ CẢNH BÁO NGUY HIỂM:\n\nHành động này sẽ VÔ HIỆU HÓA TOÀN BỘ mã QR hiện tại đang dán trên bàn.\nKhách hàng sẽ không thể gọi món bằng mã cũ.\n\nBạn có chắc chắn muốn tạo mới tất cả không?";

    if (!window.confirm(msg)) return;

    try {
      toast.info("Đang xử lý làm mới hàng loạt...");
      const res = await axiosClient.post("/admin/tables/regenerate-all");
      toast.success(res.message || "Đã làm mới tất cả mã QR!");
      fetchTables();
    } catch (err) {
      toast.error("Lỗi hệ thống khi làm mới QR");
    }
  };

  // --- CRUD HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setFormData({
      id: null,
      table_number: "",
      capacity: 4,
      location: "",
      description: "",
      status: "active",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (table) => {
    setFormData(table);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      if (isEditing) {
        await axiosClient.put(`/admin/tables/${formData.id}`, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await axiosClient.post("/admin/tables", formData);
        toast.success("Tạo bàn thành công!");
      }
      setShowModal(false);
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi");
    }
  };

  const handleToggleStatus = async (table) => {
    const newStatus = table.status === "active" ? "inactive" : "active";

    if (newStatus === "inactive") {
      try {
        const res = await axiosClient.patch(
          `/admin/tables/${table.id}/status`,
          {
            status: newStatus,
          },
        );

        if (res.warning) {
          if (!window.confirm(`⚠️ ${res.message}\nBạn vẫn muốn tắt bàn này?`))
            return;

          await axiosClient.patch(
            `/admin/tables/${table.id}/status?force=true`,
            { status: newStatus },
          );
        }

        toast.success("Đã tắt bàn");
        fetchTables();
      } catch (err) {
        toast.error("Lỗi cập nhật");
      }
    } else {
      try {
        await axiosClient.patch(`/admin/tables/${table.id}/status`, {
          status: newStatus,
        });
        toast.success("Đã bật bàn");
        fetchTables();
      } catch (err) {
        toast.error("Lỗi cập nhật");
      }
    }
  };

  // ===== UI HELPERS =====
  const totalActive = useMemo(
    () => (tables || []).filter((t) => t.status === "active").length,
    [tables],
  );

  const totalOccupied = useMemo(
    () => (tables || []).filter((t) => t.current_session_id).length,
    [tables],
  );

  // Kiểm tra bàn có đang có khách không
  const isTableOccupied = (table) => !!table.current_session_id;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <MdOutlineTableBar className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Table Management
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Quản lý{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              bàn ăn
            </span>
          </h1>

          <div className="text-sm text-gray-400 mt-2">
            Tổng: <span className="text-white font-bold">{tables.length}</span>{" "}
            bàn • Active:{" "}
            <span className="text-white font-bold">{totalActive}</span> • Đang
            có khách:{" "}
            <span className="text-green-400 font-bold">{totalOccupied}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBulkRegenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-red-500/10 border border-red-500/20 text-red-200 hover:bg-red-500/20 transition text-sm font-bold"
            title="Vô hiệu hóa tất cả QR cũ và tạo mới"
          >
            <RefreshCw size={16} />
            Reset All
          </button>

          <button
            onClick={handleDownloadZip}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition text-sm"
            title="Tải tất cả ảnh (ZIP)"
          >
            <Archive size={16} />
            ZIP
          </button>

          <button
            onClick={() => handleGeneratePDF("grid")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition text-sm"
            title="In lưới 4 bàn/trang"
          >
            <Grid size={16} />
            PDF Lưới
          </button>

          <button
            onClick={() => handleGeneratePDF("single")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition text-sm"
            title="In 1 bàn/trang"
          >
            <Square size={16} />
            PDF Đơn
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition text-sm font-bold"
          >
            <Plus size={16} />
            Thêm bàn
          </button>
        </div>
      </div>

      {/* Filters panel */}
      <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Filter className="text-orange-500" size={18} />
          </div>

          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Status */}
              <div className="md:col-span-3">
                <label className="text-xs text-gray-400 mb-1 block">
                  Trạng thái
                </label>
                <select
                  className="w-full rounded-xl px-3 py-2.5 text-sm bg-neutral-950 text-white
                    border border-white/10 focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-950 [&>option]:text-white"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, status: e.target.value }))
                  }
                >
                  <option value="">Tất cả</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Location */}
              <div className="md:col-span-4">
                <label className="text-xs text-gray-400 mb-1 block">
                  Khu vực
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <select
                    className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm bg-neutral-950 text-white
                      border border-white/10 focus:outline-none focus:border-orange-500/40 transition
                      [&>option]:bg-neutral-950 [&>option]:text-white"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters((s) => ({ ...s, location: e.target.value }))
                    }
                  >
                    <option value="">Tất cả khu vực</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Patio">Patio</option>
                    <option value="VIP Room">VIP Room</option>
                  </select>
                </div>
              </div>

              {/* Sort */}
              <div className="md:col-span-5">
                <label className="text-xs text-gray-400 mb-1 block">
                  Sắp xếp
                </label>
                <select
                  className="w-full rounded-xl px-3 py-2.5 text-sm bg-neutral-950 text-white
                    border border-white/10 focus:outline-none focus:border-orange-500/40 transition
                    [&>option]:bg-neutral-950 [&>option]:text-white"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((s) => ({ ...s, sort: e.target.value }))
                  }
                >
                  <option value="name_asc">Tên (A-Z)</option>
                  <option value="name_desc">Tên (Z-A)</option>
                  <option value="capacity_asc">Sức chứa (Tăng dần)</option>
                  <option value="capacity_desc">Sức chứa (Giảm dần)</option>
                  <option value="newest">Mới nhất (Creation Date)</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>

              <div className="md:col-span-12 text-xs text-gray-500">
                Tip: Click card để mở panel chi tiết bên phải. Card inactive sẽ
                mờ đi.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="mt-6 flex gap-4">
        {/* Left grid */}
        <div className={`min-w-0 flex-1 ${selectedTable ? "pr-0" : ""}`}>
          {loading ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                selectedTable
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`group relative rounded-2xl border p-5 cursor-pointer transition
                    ${
                      isTableOccupied(table)
                        ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/15 hover:border-green-500/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-500/20"
                    }
                    ${
                      selectedTable?.id === table.id
                        ? "border-orange-500/40 ring-1 ring-orange-500/30 bg-white/10"
                        : ""
                    }
                    ${table.status === "inactive" ? "opacity-60 grayscale" : ""}
                  `}
                >
                  {/* Badge đang có khách */}
                  {isTableOccupied(table) && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-green-500/30 animate-pulse">
                      Có khách
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg
                          ${
                            isTableOccupied(table)
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : table.status === "active"
                                ? "bg-orange-500/10 text-orange-300 border border-orange-500/20"
                                : "bg-white/5 text-gray-400 border border-white/10"
                          }`}
                      >
                        {String(table.table_number || "").replace(/\D/g, "") ||
                          "—"}
                      </div>

                      <div>
                        <div className="text-white font-black text-lg">
                          {table.table_number}
                        </div>
                        <div
                          className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${
                            isTableOccupied(table)
                              ? "text-green-400"
                              : table.status === "active"
                                ? "text-gray-400"
                                : "text-red-400"
                          }`}
                        >
                          {isTableOccupied(table)
                            ? "🟢 Đang phục vụ"
                            : table.status === "active"
                              ? "⚪ Trống"
                              : "Offline"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users
                        size={14}
                        className={
                          isTableOccupied(table)
                            ? "text-green-400"
                            : "text-orange-400"
                        }
                      />
                      {table.capacity} khách
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={14}
                        className={
                          isTableOccupied(table)
                            ? "text-green-400"
                            : "text-orange-400"
                        }
                      />
                      {table.location || "—"}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(table);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                        bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(table);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition
                        ${
                          table.status === "active"
                            ? "bg-red-500/10 border-red-500/20 text-red-200 hover:bg-red-500/20"
                            : "bg-green-500/10 border-green-500/20 text-green-200 hover:bg-green-500/20"
                        }`}
                      title={table.status === "active" ? "Tắt bàn" : "Bật bàn"}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {!tables.length ? (
                <div className="col-span-full rounded-2xl bg-white/5 border border-white/10 p-10 text-center">
                  <div className="text-white font-black">Chưa có bàn</div>
                  <div className="text-gray-400 text-sm mt-1">
                    Bấm “Thêm bàn” để tạo mới.
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right detail panel */}
        {selectedTable && (
          <div className="w-95 shrink-0 rounded-2xl border border-white/10 bg-neutral-900/60 overflow-hidden">
            <TableDetailPanel
              table={selectedTable}
              onClose={() => setSelectedTable(null)}
              onRefresh={fetchTables}
            />
          </div>
        )}
      </div>

      {/* MODAL FORM (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="text-white font-black">
                  {isEditing ? "Cập nhật bàn" : "Thêm bàn mới"}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-gray-400">Số bàn / Tên</label>
                  <input
                    name="table_number"
                    type="text"
                    placeholder="VD: T-01"
                    className={`mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-950/60 text-white outline-none border transition
                      ${
                        errors.table_number
                          ? "border-red-500/60 focus:border-red-500"
                          : "border-white/10 focus:border-orange-500/40"
                      }`}
                    value={formData.table_number}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.table_number)
                        setErrors((s) => ({ ...s, table_number: "" }));
                    }}
                  />
                  {errors.table_number ? (
                    <div className="text-xs text-red-300 mt-1">
                      {errors.table_number}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Sức chứa</label>
                    <input
                      name="capacity"
                      type="number"
                      className={`mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-950/60 text-white outline-none border transition
                        ${
                          errors.capacity
                            ? "border-red-500/60 focus:border-red-500"
                            : "border-white/10 focus:border-orange-500/40"
                        }`}
                      value={formData.capacity}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.capacity)
                          setErrors((s) => ({ ...s, capacity: "" }));
                      }}
                    />
                    {errors.capacity ? (
                      <div className="text-xs text-red-300 mt-1">
                        {errors.capacity}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Vị trí</label>
                    <select
                      name="location"
                      className={`mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-950/60 text-white outline-none border transition
                        [&>option]:bg-neutral-950 [&>option]:text-white
                        ${
                          errors.location
                            ? "border-red-500/60 focus:border-red-500"
                            : "border-white/10 focus:border-orange-500/40"
                        }`}
                      value={formData.location}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.location)
                          setErrors((s) => ({ ...s, location: "" }));
                      }}
                    >
                      <option value="">Chọn...</option>
                      <option value="Indoor">Indoor</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Patio">Patio</option>
                      <option value="VIP Room">VIP Room</option>
                    </select>
                    {errors.location ? (
                      <div className="text-xs text-red-300 mt-1">
                        {errors.location}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400">Ghi chú</label>
                  <textarea
                    name="description"
                    rows="3"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-950/60 text-white outline-none border border-white/10 focus:border-orange-500/40 transition resize-none"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  >
                    Huỷ
                  </button>

                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition font-bold"
                  >
                    {isEditing ? "Lưu thay đổi" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
