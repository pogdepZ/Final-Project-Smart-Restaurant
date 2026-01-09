import React, { useState, useEffect } from "react";
import axiosClient from "../../services/axiosClient";
import PhotoManager from "./PhotoManager";
import imageCompression from "browser-image-compression"; // Import
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Image as ImageIcon,
  Star,
  X,
  Upload,
  Loader,
} from "lucide-react";

const MenuManagement = () => {
  // --- STATE ---
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    sort: "newest", // newest, price_asc, price_desc, name_asc
    status: "",
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    category_id: "",
    prep_time_minutes: 15,
    status: "available",
    is_chef_recommended: false,
  });
  const [imageFile, setImageFile] = useState(null); // File ảnh mới
  const [previewImage, setPreviewImage] = useState(null); // Preview ảnh

  // --- 1. FETCH DATA ---

  // Lấy danh mục (chạy 1 lần)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get("/menu/categories");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Lấy món ăn (chạy khi filter đổi)
  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axiosClient.get(`/menu/items?${query}`);
      setItems(res.data);
    } catch (err) {
      toast.error("Lỗi tải thực đơn");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLERS ---

  // Xử lý Input Form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Xử lý chọn ảnh
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Cấu hình nén
      const options = {
        maxSizeMB: 0.2, // Nén xuống còn khoảng 200KB (Rất nhẹ)
        maxWidthOrHeight: 800, // Resize ảnh về chiều rộng tối đa 800px
        useWebWorker: true, // Dùng luồng phụ để không đơ trình duyệt
        fileType: "image/webp", // (Tuỳ chọn) Chuyển sang WebP cho nhẹ
      };

      try {
        setIsCompressing(true); // Bật loading

        // Thực hiện nén
        const compressedFile = await imageCompression(file, options);

        console.log(`Ảnh gốc: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(
          `Ảnh nén: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
        );

        // Lưu file đã nén vào State để gửi đi
        setImageFile(compressedFile);
        setPreviewImage(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.log(error);
        toast.error("Lỗi nén ảnh, sẽ dùng ảnh gốc");
        setImageFile(file); // Fallback về ảnh gốc nếu lỗi
      } finally {
        setIsCompressing(false); // Tắt loading
      }
    }
  };

  // Mở Modal Thêm
  const openCreate = () => {
    setFormData({
      id: null,
      name: "",
      description: "",
      price: "",
      category_id: categories[0]?.id || "",
      prep_time_minutes: 15,
      status: "available",
      is_chef_recommended: false,
    });
    setImageFile(null);
    setPreviewImage(null);
    setIsEditing(false);
    setShowModal(true);
  };

  // Mở Modal Sửa
  const openEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      category_id: item.category_id,
      prep_time_minutes: item.prep_time_minutes,
      status: item.status,
      is_chef_recommended: item.is_chef_recommended,
    });
    setPreviewImage(item.image_url); // Hiện ảnh cũ
    setImageFile(null); // Reset file mới
    setIsEditing(true);
    setShowModal(true);
  };

  // Submit Form (Dùng FormData để upload ảnh)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Bắt đầu xoay
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category_id", formData.category_id);
    data.append("prep_time_minutes", formData.prep_time_minutes);
    data.append("status", formData.status);
    data.append("is_chef_recommended", formData.is_chef_recommended);

    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      if (isEditing) {
        await axiosClient.put(`/menu/items/${formData.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Cập nhật món thành công");
      } else {
        await axiosClient.post("/menu/items", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Thêm món mới thành công");
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu dữ liệu");
    } finally {
      setIsSubmitting(false); // Tắt xoay
    }
  };

  // Xóa món
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa món này?")) return;
    try {
      await axiosClient.delete(`/menu/items/${id}`);
      toast.success("Đã xóa món ăn");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error("Lỗi xóa món");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Thực đơn</h1>
          <p className="text-sm text-gray-500">Tổng số: {items.length} món</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="flex items-center bg-white border rounded-lg px-2 shadow-sm">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              placeholder="Tìm tên món..."
              className="py-2 text-gray-700 text-sm outline-none w-32"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center bg-white border rounded-lg px-2 shadow-sm">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select
              className="py-2 text-sm text-gray-600 bg-transparent outline-none cursor-pointer max-w-[120px]"
              value={filters.category_id}
              onChange={(e) =>
                setFilters({ ...filters, category_id: e.target.value })
              }
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            className="py-2 px-2 bg-white border rounded-lg text-sm text-gray-600 shadow-sm cursor-pointer"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="name_asc">Tên A-Z</option>
          </select>

          <button
            onClick={openCreate}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={18} /> Thêm Món
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition-all"
            >
              {/* Image Area */}
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={48} />
                  </div>
                )}

                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-sm font-bold shadow-sm text-gray-800">
                  {Number(item.price).toLocaleString()}đ
                </span>

                {item.is_chef_recommended && (
                  <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> Chef's Choice
                  </span>
                )}
              </div>

              {/* Content Area */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3
                    className="font-bold text-gray-800 line-clamp-1"
                    title={item.name}
                  >
                    {item.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
                    {item.category_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      item.status === "available"
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}
                  >
                    {item.status === "available" ? "Có hàng" : "Hết hàng"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-4">
                  {item.description || "Chưa có mô tả"}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-gray-100 text-gray-400 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? "Cập nhật món ăn" : "Thêm món mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cột trái: Thông tin chính */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên món *
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full text-gray-700  px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá (VNĐ) *
                      </label>
                      <input
                        name="price"
                        type="number"
                        required
                        min="0"
                        className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.price}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian (phút)
                      </label>
                      <input
                        name="prep_time_minutes"
                        type="number"
                        min="0"
                        className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.prep_time_minutes}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục *
                    </label>
                    <select
                      name="category_id"
                      required
                      className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.category_id}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
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
                      <option value="available">Đang bán (Available)</option>
                      <option value="sold_out">Hết hàng (Sold Out)</option>
                      <option value="unavailable">Ngừng kinh doanh</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="chefReq"
                      name="is_chef_recommended"
                      checked={formData.is_chef_recommended}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="chefReq"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Món ngon đề xuất (Chef Recommended)
                    </label>
                  </div>
                </div>

                {/* Cột phải: Hình ảnh & Mô tả */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình ảnh
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                      {previewImage ? (
                        <div className="relative h-40 w-full">
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full h-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage(null);
                              setImageFile(null);
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                          <Upload size={32} className="mb-2" />
                          <p className="text-xs">Click để tải ảnh lên</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      name="description"
                      rows="4"
                      className="w-full text-gray-700 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <PhotoManager itemId={formData.id} />
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting} // Khóa nút khi đang up
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all font-medium"
              >
                {isSubmitting && <Loader className="animate-spin" size={16} />}{" "}
                {/* Icon xoay */}
                {isSubmitting
                  ? "Đang xử lý..."
                  : isEditing
                  ? "Lưu thay đổi"
                  : "Tạo món mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
