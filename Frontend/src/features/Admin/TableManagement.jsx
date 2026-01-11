import React, { useState, useEffect } from "react";
import axiosClient from "../../store/axiosClient";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Printer,
  Power,
  CheckCircle,
  AlertCircle,
  X,
  QrCode,
  MapPin,
  Users,
} from "lucide-react";
import TableDetailModal from "../../Components/TableDetailModal"; // (Tạo thư mục nếu chưa có)

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);

  // State Filter & Sort
  const [filters, setFilters] = useState({
    status: "",
    location: "",
    sort: "name_asc",
  });

  // State Modal
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

  // Fetch Data (Giữ nguyên logic)
  useEffect(() => {
    fetchTables();
  }, [filters]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/tables?${query}`);
      console.log(res);
      setTables(res);
    } catch (err) {
      toast.error("Lỗi tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handlers (Giữ nguyên logic)
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
    try {
      if (isEditing) {
        await axiosClient.put(`/tables/${formData.id}`, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await axiosClient.post("/tables", formData);
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
        const res = await axiosClient.patch(`/tables/${table.id}/status`, {
          status: newStatus,
        });
        if (res.data.warning) {
          if (
            !window.confirm(`⚠️ ${res.data.message}\nBạn vẫn muốn tắt bàn này?`)
          )
            return;
          await axiosClient.patch(`/tables/${table.id}/status?force=true`, {
            status: newStatus,
          });
        }
        toast.success("Đã tắt bàn");
        fetchTables();
      } catch (err) {
        toast.error("Lỗi cập nhật");
      }
    } else {
      try {
        await axiosClient.patch(`/tables/${table.id}/status`, {
          status: newStatus,
        });
        toast.success("Đã bật bàn");
        fetchTables();
      } catch (err) {
        toast.error("Lỗi cập nhật");
      }
    }
  };

  const handlePrintQR = (table) => {
    // ... Logic in ấn giữ nguyên, chỉ update UI
    const printWindow = window.open("", "", "width=600,height=600");
    const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      clientUrl
    )}`;
    printWindow.document.write(`<html>...</html>`); // (Copy lại phần HTML in ấn từ code cũ)
    printWindow.document.close();
  };

  return (
    <div className="p-6 bg-neutral-950 min-h-screen text-gray-200 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Quản Lý{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Bàn Ăn
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Hệ thống đang hoạt động • Tổng số:{" "}
            <span className="text-white font-bold">{tables.length}</span> bàn
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Filters - Glassmorphism Style */}
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
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Bảo trì</option>
            </select>
          </div>

          <div className="flex items-center bg-neutral-900/50 border border-white/10 rounded-xl px-3 py-2">
            <Search size={16} className="text-orange-500 mr-2" />
            <input
              placeholder="Tìm vị trí..."
              className="bg-transparent text-sm text-gray-300 outline-none w-32 placeholder:text-gray-600"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            />
          </div>

          <button
            onClick={openCreate}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all font-bold text-sm tracking-wide"
          >
            <Plus size={18} /> Thêm Bàn Mới
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`group relative bg-neutral-900/50 border border-white/5 rounded-2xl p-6 transition-all  hover:scale-[1.02] hover:border-orange-500/30 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                table.status === "inactive" ? "opacity-60 grayscale-[50%]" : ""
              }`}
            >
              {/* Header Card */}
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
                      {table.status === "active" ? "• Online" : "• Offline"}
                    </span>
                  </div>
                </div>

                {/* Quick Actions (Hover to show) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(table)}}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users size={14} className="text-orange-500" />
                  <span>
                    Sức chứa:{" "}
                    <strong className="text-white">{table.capacity}</strong>{" "}
                    khách
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin size={14} className="text-orange-500" />
                  <span>
                    Khu vực:{" "}
                    <span className="text-white">{table.location}</span>
                  </span>
                </div>
                {table.description && (
                  <p className="text-xs text-gray-500 italic mt-2 border-t border-white/5 pt-2 line-clamp-1">
                    "{table.description}"
                  </p>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(table);}}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all
                        ${
                          table.status === "active"
                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}
                >
                  <Power size={14} />
                  {table.status === "active" ? "Tắt Bàn" : "Bật Bàn"}
                </button>

                <button
                  className="py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  <QrCode size={14} />
                  Mã QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM (Dark Theme) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">
                    Số bàn / Tên bàn
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold">
                      #
                    </span>
                    <input
                      name="table_number"
                      type="text"
                      required
                      placeholder="VD: T-01"
                      className="w-full pl-8 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                      value={formData.table_number || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">
                      Sức chứa
                    </label>
                    <input
                      name="capacity"
                      type="number"
                      required
                      min="1"
                      max="20"
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      value={formData.capacity || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">
                      Vị trí
                    </label>
                    <select
                      name="location"
                      required
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-orange-500 outline-none appearance-none cursor-pointer"
                      value={formData.location || ""}
                      onChange={handleChange}
                    >
                      <option value="" className="bg-neutral-900 text-gray-500">
                        Chọn khu vực
                      </option>
                      <option value="Indoor" className="bg-neutral-900">
                        Indoor (Trong nhà)
                      </option>
                      <option value="Outdoor" className="bg-neutral-900">
                        Outdoor (Ngoài trời)
                      </option>
                      <option value="Patio" className="bg-neutral-900">
                        Patio (Sân thượng)
                      </option>
                      <option value="VIP Room" className="bg-neutral-900">
                        VIP Room
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-orange-500 outline-none resize-none"
                    placeholder="VD: Bàn gần cửa sổ, view đẹp..."
                    value={formData.description || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-bold text-sm transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                >
                  {isEditing ? "Lưu Thay Đổi" : "Xác Nhận Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
};

export default TableManagement;
