import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import { toast } from 'react-toastify';
import { X, Check } from 'lucide-react';

const ModifierSelector = ({ itemId, onClose }) => {
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy tất cả nhóm
        const groupsRes = await axiosClient.get('/menu/modifiers');
        // 2. Lấy chi tiết món để xem đã gắn nhóm nào chưa (Backend cần trả về modifier_groups trong detail)
        const itemRes = await axiosClient.get(`/menu/items/${itemId}`);
        
        const attachedIds = itemRes.data.modifier_groups?.map(g => g.id) || [];
        
        // Map trạng thái selected
        const groupsWithStatus = groupsRes.data.map(g => ({
            ...g,
            isSelected: attachedIds.includes(g.id)
        }));
        
        setAllGroups(groupsWithStatus);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemId]);

  const handleToggle = async (group) => {
    // API Backend hiện tại chỉ có "Attach" (INSERT), chưa có "Detach" (DELETE).
    // Nếu bạn muốn làm nút gạt bật/tắt hoàn chỉnh, Backend cần API xóa link.
    // Tạm thời ta chỉ làm chức năng "Thêm" (Attach).
    
    if (group.isSelected) return; // Đã có rồi thì thôi

    try {
        await axiosClient.post(`/menu/items/${itemId}/modifiers`, { group_id: group.id });
        toast.success(`Đã gắn nhóm ${group.name}`);
        setAllGroups(prev => prev.map(g => g.id === group.id ? { ...g, isSelected: true } : g));
    } catch (err) {
        toast.error("Lỗi gắn modifier");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Cấu hình Topping</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? <div className="text-center py-4">Đang tải...</div> : (
            <div className="space-y-2">
              {allGroups.map(group => (
                <div 
                    key={group.id} 
                    onClick={() => handleToggle(group)}
                    className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        group.isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                >
                  <div>
                    <div className="font-medium text-gray-800">{group.name}</div>
                    <div className="text-xs text-gray-500">
                        {group.selection_type === 'single' ? 'Chọn 1' : 'Chọn nhiều'} 
                        {group.is_required ? ' • Bắt buộc' : ''}
                    </div>
                  </div>
                  {group.isSelected ? (
                      <Check size={20} className="text-blue-600" />
                  ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModifierSelector;