import React, { useState, useEffect } from "react";
import axiosClient from "../../services/axiosClient";
import { toast } from "react-toastify";
import { Plus, Edit, Power, ListOrdered, X } from "lucide-react";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    display_order: 0,
    status: "active",
  });

  // --- 1. FETCH DATA ---
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Backend đã sort sẵn theo display_order
      const res = await axiosClient.get("/menu/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- 2. HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    // Tự động gợi ý display_order tiếp theo
    const maxOrder =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.display_order))
        : 0;
    setFormData({
      id: null,
      name: "",
      description: "",
      display_order: maxOrder + 1,
      status: "active",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setFormData(cat);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation Frontend (Double check)
    if (formData.name.length < 2 || formData.name.length > 50) {
      return toast.warning("Tên danh mục phải từ 2-50 ký tự");
    }
    if (parseInt(formData.display_order) < 0) {
      return toast.warning("Thứ tự hiển thị không được âm");
    }

    try {
      if (isEditing) {
        await axiosClient.put(`/menu/categories/${formData.id}`, formData);
        toast.success("Cập nhật thành công");
      } else {
        await axiosClient.post("/menu/categories", formData);
        toast.success("Tạo danh mục thành công");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu dữ liệu");
    }
  };

  // Soft Delete / Toggle Status
  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === "active" ? "inactive" : "active";
    try {
      // Dùng API Update để đổi status
      await axiosClient.put(`/menu/categories/${cat.id}`, {
        ...cat,
        status: newStatus,
      });
      toast.success(`Đã chuyển sang ${newStatus}`);
      fetchCategories();
    } catch (err) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h1>
          <p className="text-sm text-gray-500">
            Phân loại món ăn trong thực đơn
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Thêm Danh mục
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm w-16">
                  #
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">
                  Tên danh mục
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm">
                  Mô tả
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-center">
                  Thứ tự
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-center">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat, index) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{cat.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                    {cat.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                      <ListOrdered size={12} /> {cat.display_order}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        cat.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cat.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`p-2 rounded-lg transition-colors ${
                          cat.status === "active"
                            ? "text-red-500 bg-red-50 hover:bg-red-100"
                            : "text-green-600 bg-green-50 hover:bg-green-100"
                        }`}
                        title={
                          cat.status === "active"
                            ? "Tắt danh mục"
                            : "Bật danh mục"
                        }
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    Chưa có danh mục nào. Hãy tạo mới!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? "Cập nhật danh mục" : "Thêm danh mục mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục *
                </label>
                <input
                  name="name"
                  required
                  placeholder="VD: Món Khai Vị"
                  className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-400 mt-1">Từ 2 đến 50 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  rows="3"
                  className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    name="display_order"
                    type="number"
                    min="0"
                    className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.display_order}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm ẩn</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
