import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import { toast } from 'react-toastify';
import { 
  Plus, Search, Filter, Edit, Printer, 
  Power, X 
} from 'lucide-react';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Sort
  const [filters, setFilters] = useState({
    status: '',
    location: '',
    sort: 'name_asc'
  });

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    table_number: '',
    capacity: 4,
    location: '',
    description: '',
    status: 'active'
  });

  // Fetch Data
  useEffect(() => {
    fetchTables();
  }, [filters]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/tables?${query}`);
      setTables(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh sách bàn");
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ NHẬP LIỆU (FIX LỖI KHÔNG NHẬP ĐƯỢC) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handlers mở Modal
  const openCreate = () => {
    setFormData({ id: null, table_number: '', capacity: 4, location: '', description: '', status: 'active' });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (table) => {
    setFormData(table);
    setIsEditing(true);
    setShowModal(true);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axiosClient.put(`/tables/${formData.id}`, formData);
        toast.success("Cập nhật thành công!");
      } else {
        await axiosClient.post('/tables', formData);
        toast.success("Tạo bàn thành công!");
      }
      setShowModal(false);
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu dữ liệu");
    }
  };

  // Toggle Status
  const handleToggleStatus = async (table) => {
    const newStatus = table.status === 'active' ? 'inactive' : 'active';
    if (newStatus === 'inactive') {
        try {
            const res = await axiosClient.patch(`/tables/${table.id}/status`, { status: newStatus });
            if (res.data.warning) {
                if (!window.confirm(`⚠️ ${res.data.message}\nBạn vẫn muốn tắt bàn này?`)) return;
                await axiosClient.patch(`/tables/${table.id}/status?force=true`, { status: newStatus });
            }
            toast.success("Đã tắt bàn");
            fetchTables();
        } catch (err) { toast.error("Lỗi cập nhật"); }
    } else {
        try {
            await axiosClient.patch(`/tables/${table.id}/status`, { status: newStatus });
            toast.success("Đã bật bàn");
            fetchTables();
        } catch (err) { toast.error("Lỗi cập nhật"); }
    }
  };

  // Print QR
  const handlePrintQR = (table) => {
    const printWindow = window.open('', '', 'width=600,height=600');
    const clientUrl = `${window.location.protocol}//${window.location.hostname}:5173/menu?token=${table.qr_token}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clientUrl)}`;

    printWindow.document.write(`
      <html>
        <head>
            <title>QR ${table.table_number}</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; }
                .qr-box { border: 2px solid #000; padding: 20px; display: inline-block; border-radius: 10px; }
                h1 { margin: 0; font-size: 40px; }
                p { font-size: 18px; margin: 10px 0; }
                img { width: 250px; height: 250px; }
            </style>
        </head>
        <body>
          <div class="qr-box">
            <h1>${table.table_number}</h1>
            <p>${table.location}</p>
            <img src="${qrSrc}" />
            <p>Quét để gọi món</p>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Bàn</h1>
          <p className="text-sm text-gray-500">Tổng số: {tables.length} bàn</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Filters UI giữ nguyên */}
          <div className="flex items-center bg-white border rounded-lg px-2 shadow-sm">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select className="py-2 text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
              value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng</option>
            </select>
          </div>
          <div className="flex items-center bg-white border rounded-lg px-2 shadow-sm">
            <Search size={16} className="text-gray-400 mr-2" />
            <input placeholder="Tìm vị trí..." className="py-2 text-gray-700 text-sm outline-none w-32"
              value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} />
          </div>
          <button onClick={openCreate} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
            <Plus size={18} /> Thêm Bàn
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div key={table.id} className={`bg-white rounded-xl shadow-sm border p-5 relative ${table.status === 'inactive' ? 'opacity-75 bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{table.table_number}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${table.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {table.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">{table.capacity} ghế</span> • {table.location}
                </div>
                <p className="text-xs text-gray-400 italic mb-4">{table.description || '...'}</p>
                <div className="flex gap-2 pt-4 border-t">
                  <button onClick={() => handleToggleStatus(table)} className={`p-2 rounded-lg ${table.status === 'active' ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    <Power size={18} />
                  </button>
                  <button onClick={() => openEdit(table)} className="p-2 text-blue-600 bg-blue-50 rounded-lg">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handlePrintQR(table)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
                    <Printer size={16} /> In QR
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM (ĐÃ SỬA Z-INDEX & INPUT) --- */}
      {showModal && (
        // LỚP OVERLAY VỚI Z-INDEX CAO
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Cập nhật bàn' : 'Thêm bàn mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số bàn *</label>
                {/* Dùng name="" và onChange={handleChange} */}
                <input 
                  name="table_number"
                  type="text" required 
                  placeholder="VD: T-01"
                  className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.table_number || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa *</label>
                  <input 
                    name="capacity"
                    type="number" required min="1" max="20"
                    className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.capacity || ''}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí *</label>
                  <select 
                    name="location"
                    className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                    value={formData.location || ''}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn --</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Patio">Patio</option>
                    <option value="VIP Room">VIP Room</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea 
                  name="description"
                  rows="3"
                  className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={formData.description || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">
                  Hủy bỏ
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
                  {isEditing ? 'Lưu' : 'Tạo mới'}
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