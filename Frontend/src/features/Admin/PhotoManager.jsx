import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import { toast } from 'react-toastify';
import { Trash2, Star, Upload, Loader } from 'lucide-react';

const PhotoManager = ({ itemId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Load Photos
  useEffect(() => {
    if (itemId) fetchPhotos();
  }, [itemId]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/menu/items/${itemId}/photos`);
      setPhotos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Upload Photos
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    // Append từng file vào key 'photos' (đúng với backend upload.array('photos'))
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    setUploading(true);
    try {
      await axiosClient.post(`/menu/items/${itemId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Upload thành công!");
      fetchPhotos(); // Reload list
    } catch (error) {
      toast.error("Lỗi upload ảnh");
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  // 3. Delete Photo
  const handleDelete = async (photoId) => {
    if (!window.confirm("Xóa ảnh này?")) return;
    try {
      await axiosClient.delete(`/menu/items/${itemId}/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.success("Đã xóa ảnh");
    } catch (error) {
      toast.error("Lỗi xóa ảnh");
    }
  };

  // 4. Set Primary
  const handleSetPrimary = async (photoId) => {
    try {
      await axiosClient.patch(`/menu/items/${itemId}/photos/${photoId}/primary`);
      toast.success("Đã cập nhật ảnh đại diện");
      fetchPhotos(); // Reload để thấy sao vàng thay đổi vị trí
    } catch (error) {
      toast.error("Lỗi cập nhật");
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border mt-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
        Thư viện ảnh món ăn
        <span className="text-xs font-normal text-gray-500">{photos.length} ảnh</span>
      </h4>

      {/* Grid Ảnh */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {loading ? (
          <div className="col-span-3 text-center py-4 text-gray-400">Đang tải...</div>
        ) : photos.map(photo => (
          <div key={photo.id} className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${photo.is_primary ? 'border-yellow-400' : 'border-transparent'}`}>
            <img src={photo.url} alt="Item" className="w-full h-full object-cover" />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={() => handleSetPrimary(photo.id)}
                title="Đặt làm ảnh chính"
                className={`p-1.5 rounded-full ${photo.is_primary ? 'bg-yellow-400 text-white' : 'bg-white text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'}`}
              >
                <Star size={16} fill={photo.is_primary ? "currentColor" : "none"} />
              </button>
              
              <button 
                onClick={() => handleDelete(photo.id)}
                title="Xóa ảnh"
                className="p-1.5 rounded-full bg-white text-red-500 hover:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Primary Badge */}
            {photo.is_primary && (
              <div className="absolute top-1 left-1 bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
                Chính
              </div>
            )}
          </div>
        ))}

        {/* Nút Upload */}
        <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-colors">
          {uploading ? (
            <Loader size={24} className="animate-spin text-blue-500" />
          ) : (
            <>
              <Upload size={24} className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Thêm ảnh</span>
            </>
          )}
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
};

export default PhotoManager;