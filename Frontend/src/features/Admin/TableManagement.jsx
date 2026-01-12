import React, { useState, useEffect } from "react";
import axiosClient from "../../store/axiosClient";
import { toast } from "react-toastify";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Power,
  Archive,
  FileText,
  Grid,
  Square,
  X,
  MapPin,
  Users,
  RefreshCw,
} from "lucide-react";
import TableDetailPanel from "./components/TableDetailPanel"; // Đảm bảo đường dẫn đúng

const TableManagement = () => {
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

    // 1. Validate Số bàn
    if (!formData.table_number.trim()) {
      newErrors.table_number = "Vui lòng nhập số bàn";
    } else if (formData.table_number.length > 10) {
      newErrors.table_number = "Tên bàn quá dài (tối đa 10 ký tự)";
    }

    // 2. Validate Sức chứa
    const cap = parseInt(formData.capacity);
    if (!formData.capacity) {
      newErrors.capacity = "Nhập sức chứa";
    } else if (isNaN(cap) || cap < 1 || cap > 20) {
      newErrors.capacity = "Sức chứa từ 1-20 người";
    }

    // 3. Validate Vị trí
    if (!formData.location) {
      newErrors.location = "Vui lòng chọn vị trí";
    }

    setErrors(newErrors);
    // Trả về true nếu không có lỗi (object rỗng)
    return Object.keys(newErrors).length === 0;
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchTables();
  }, [filters]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/admin/tables?${query}`);
      setTables(res); // Giả sử axiosClient trả về data trực tiếp
    } catch (err) {
      toast.error("Lỗi tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. BULK ACTIONS (Xử lý hàng loạt) ---

  // A. Tải tất cả ảnh QR (ZIP)
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("SmartRestaurant_QR_Codes");
    toast.info("Đang nén file ZIP...");

    for (const table of tables) {
      const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        clientUrl
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

  // B. Tải PDF Tổng hợp (In hàng loạt)
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
      const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        clientUrl
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

      // Căn giữa text
      const textWidth = doc.getTextWidth(table.table_number);
      doc.text(table.table_number, x + (size - textWidth) / 2, y - 5);
      doc.addImage(imgData, "PNG", x, y, size, size);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(table.location, x + size / 2, y + size + 5, { align: "center" });

      // Logic chuyển trang
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

  // --- 3. CRUD HANDLERS ---

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
      // Có lỗi thì dừng lại, không gọi API
      // Có thể toast thêm thông báo tổng quát
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      if (isEditing) {
        await axiosClient.put(`/admin/tables/${formData.id}`, formData); // API: admin/tables/:id
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
          { status: newStatus }
        );
        if (res.warning) {
          // Giả sử axiosClient đã trả về data (res.data)
          if (!window.confirm(`⚠️ ${res.message}\nBạn vẫn muốn tắt bàn này?`))
            return;
          await axiosClient.patch(
            `/admin/tables/${table.id}/status?force=true`,
            { status: newStatus }
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

  // --- BULK ACTION: RESET ALL ---
  const handleBulkRegenerate = async () => {
    const msg =
      "⚠️ CẢNH BÁO NGUY HIỂM:\n\nHành động này sẽ VÔ HIỆU HÓA TOÀN BỘ mã QR hiện tại đang dán trên bàn.\nKhách hàng sẽ không thể gọi món bằng mã cũ.\n\nBạn có chắc chắn muốn tạo mới tất cả không?";

    if (!window.confirm(msg)) return;

    try {
      toast.info("Đang xử lý làm mới hàng loạt...");
      const res = await axiosClient.post("/tables/regenerate-all"); // API Backend đã viết

      // Backend trả về: { message: "Đã làm mới...", count: 20 }
      toast.success(res.message || "Đã làm mới tất cả mã QR!");
      fetchTables(); // Reload lại danh sách để lấy token mới
    } catch (err) {
      toast.error("Lỗi hệ thống khi làm mới QR");
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-gray-200 overflow-hidden font-sans">
      {/* --- LEFT COLUMN: TABLE GRID --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/10 shrink-0 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Quản Lý <span className="text-orange-500">Bàn Ăn</span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Tổng số: {tables.length} bàn
              </p>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleBulkRegenerate}
                className="bg-red-900/80 text-red-200 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-red-800 border border-red-500/30 text-xs font-bold transition-all"
                title="Vô hiệu hóa tất cả QR cũ và tạo mới"
              >
                <RefreshCw size={16} /> Reset All
              </button>

              <button
                onClick={handleDownloadZip}
                className="bg-neutral-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-700 border border-white/10 text-xs font-medium"
                title="Tải tất cả ảnh (ZIP)"
              >
                <Archive size={16} /> ZIP
              </button>
              <button
                onClick={() => handleGeneratePDF("grid")}
                className="bg-neutral-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-700 border border-white/10 text-xs font-medium"
                title="In lưới 4 bàn/trang"
              >
                <Grid size={16} /> PDF Lưới
              </button>
              <button
                onClick={() => handleGeneratePDF("single")}
                className="bg-neutral-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-700 border border-white/10 text-xs font-medium"
                title="In 1 bàn/trang"
              >
                <Square size={16} /> PDF Đơn
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* 1. FILTER STATUS */}
            <div className="flex items-center bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2">
              <Filter size={16} className="text-orange-500 mr-2" />
              <select
                className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer [&>option]:bg-neutral-900"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Active (Hoạt động)</option>
                <option value="inactive">Inactive (Bảo trì)</option>
              </select>
            </div>

            {/* 2. FILTER LOCATION (Input Text) */}
            <div className="flex items-center bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2">
              {/* Đổi icon thành MapPin cho hợp ngữ cảnh */}
              <MapPin size={16} className="text-orange-500 mr-2" />

              <select
                className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer [&>option]:bg-neutral-900"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
              >
                <option value="">Tất cả khu vực</option>
                {/* Danh sách này phải khớp với VALID_LOCATIONS ở Backend */}
                <option value="Indoor">Trong nhà (Indoor)</option>
                <option value="Outdoor">Ngoài trời (Outdoor)</option>
                <option value="Patio">Sân thượng (Patio)</option>
                <option value="VIP Room">Phòng VIP</option>
              </select>
            </div>

            {/* 3. SORT TABLES */}
            <div className="flex items-center bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-500 mr-2">Sắp xếp:</span>
              <select
                className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer [&>option]:bg-neutral-900"
                value={filters.sort}
                onChange={(e) =>
                  setFilters({ ...filters, sort: e.target.value })
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
            <button
              onClick={openCreate}
              className="ml-auto bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all font-bold text-sm"
            >
              <Plus size={18} /> Thêm Bàn
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="text-center py-20 text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            // Grid Responsive: Tự co lại khi mở Panel bên phải
            <div
              className={`grid gap-6 ${
                selectedTable
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`group relative bg-neutral-900/50 border rounded-2xl p-6 cursor-pointer transition-all hover:border-orange-500/30 hover:bg-neutral-800/80
                                ${
                                  selectedTable?.id === table.id
                                    ? "border-orange-500 ring-1 ring-orange-500 bg-neutral-800"
                                    : "border-white/5"
                                }
                                ${
                                  table.status === "inactive"
                                    ? "opacity-60 grayscale"
                                    : ""
                                }
                            `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-inner ${
                          table.status === "active"
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {table.table_number.replace(/\D/g, "")}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {table.table_number}
                        </h3>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold ${
                            table.status === "active"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {table.status === "active" ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-orange-500" />{" "}
                      {table.capacity} khách
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-orange-500" />{" "}
                      {table.location}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(table);
                      }}
                      className="flex-1 py-1.5 bg-white/5 rounded hover:bg-white/10 text-gray-300 flex justify-center"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(table);
                      }}
                      className={`flex-1 py-1.5 rounded flex justify-center hover:bg-white/10 ${
                        table.status === "active"
                          ? "text-red-400 bg-red-500/10"
                          : "text-green-400 bg-green-500/10"
                      }`}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: DETAILS PANEL --- */}
      {selectedTable && (
        <div className="w-96 shrink-0 h-full border-l border-white/10 bg-neutral-900 shadow-2xl relative z-20 transition-all duration-300">
          <TableDetailPanel
            table={selectedTable}
            onClose={() => setSelectedTable(null)}
            onRefresh={fetchTables}
          />
        </div>
      )}

      {/* --- MODAL FORM (Create/Edit) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-9999">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? (
                  <Edit size={18} className="text-orange-500" />
                ) : (
                  <Plus size={18} className="text-orange-500" />
                )}
                {isEditing ? "Cập Nhật Bàn" : "Thêm Bàn Mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                {/* --- INPUT SỐ BÀN --- */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                    Số bàn / Tên
                  </label>
                  <input
                    name="table_number"
                    type="text"
                    placeholder="VD: T-01"
                    // Thêm logic border màu đỏ nếu có lỗi
                    className={`w-full px-4 py-2.5 bg-black/40 border rounded-xl text-white outline-none transition-all ${
                      errors.table_number
                        ? "border-red-500 focus:border-red-500"
                        : "border-white/10 focus:border-orange-500"
                    }`}
                    value={formData.table_number}
                    onChange={(e) => {
                      handleChange(e);
                      // Xóa lỗi ngay khi user bắt đầu nhập lại
                      if (errors.table_number)
                        setErrors({ ...errors, table_number: "" });
                    }}
                  />
                  {/* Hiển thị message lỗi */}
                  {errors.table_number && (
                    <p className="text-red-500 text-xs mt-1 italic">
                      {errors.table_number}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* --- INPUT SỨC CHỨA --- */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                      Sức chứa
                    </label>
                    <input
                      name="capacity"
                      type="number"
                      className={`w-full px-4 py-2.5 bg-black/40 border rounded-xl text-white outline-none transition-all ${
                        errors.capacity
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                      value={formData.capacity}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.capacity)
                          setErrors({ ...errors, capacity: "" });
                      }}
                    />
                    {errors.capacity && (
                      <p className="text-red-500 text-xs mt-1 italic">
                        {errors.capacity}
                      </p>
                    )}
                  </div>

                  {/* --- SELECT VỊ TRÍ --- */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                      Vị trí
                    </label>
                    <select
                      name="location"
                      className={`w-full px-4 py-2.5 bg-black/40 border rounded-xl text-white outline-none transition-all appearance-none ${
                        errors.location
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-orange-500"
                      }`}
                      value={formData.location}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.location)
                          setErrors({ ...errors, location: "" });
                      }}
                    >
                      <option value="" className="bg-neutral-900">
                        Chọn...
                      </option>
                      <option value="Indoor" className="bg-neutral-900">
                        Indoor
                      </option>
                      <option value="Outdoor" className="bg-neutral-900">
                        Outdoor
                      </option>
                      <option value="Patio" className="bg-neutral-900">
                        Patio
                      </option>
                      <option value="VIP Room" className="bg-neutral-900">
                        VIP Room
                      </option>
                    </select>
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-1 italic">
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                    Ghi chú
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-orange-500 outline-none resize-none"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-orange-500/20"
                >
                  {isEditing ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
