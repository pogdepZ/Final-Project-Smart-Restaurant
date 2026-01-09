import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Layers } from 'lucide-react';

const ModifierManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATES CHO MODAL GROUP ---
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupData, setGroupData] = useState({
    id: null,
    name: '',
    selection_type: 'single', // 'single' | 'multiple'
    is_required: false,
    min_selections: 0,
    max_selections: 1
  });

  // --- STATES CHO FORM OPTION (INLINE) ---
  const [newOption, setNewOption] = useState({ name: '', price_adjustment: 0 });
  const [activeGroupId, setActiveGroupId] = useState(null); // Group đang được thêm option

  // 1. FETCH DATA
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/menu/modifiers');
      setGroups(res.data);
    } catch (err) {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. HANDLERS GROUP
  const handleGroupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGroupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openGroupModal = (group = null) => {
    if (group) {
      setGroupData(group);
      setIsEditingGroup(true);
    } else {
      setGroupData({ 
        id: null, name: '', selection_type: 'single', 
        is_required: false, min_selections: 0, max_selections: 1 
      });
      setIsEditingGroup(false);
    }
    setShowGroupModal(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    
    // --- VALIDATION LOGIC (Theo yêu cầu 4.1) ---
    if (!groupData.name.trim()) return toast.warning("Tên nhóm là bắt buộc");
    
    // Logic tự động điều chỉnh Min/Max
    let payload = { ...groupData };
    
    if (payload.selection_type === 'single') {
        // Nếu chọn 1: Max luôn là 1
        payload.max_selections = 1;
        // Nếu bắt buộc: Min là 1, ngược lại là 0
        payload.min_selections = payload.is_required ? 1 : 0;
    } else {
        // Nếu chọn nhiều (Multi)
        payload.min_selections = parseInt(payload.min_selections);
        payload.max_selections = parseInt(payload.max_selections);

        if (payload.is_required && payload.min_selections < 1) {
            return toast.warning("Nếu bắt buộc, số lượng tối thiểu phải >= 1");
        }
        if (payload.max_selections < payload.min_selections && payload.max_selections !== 0) {
            // max=0 thường quy ước là không giới hạn, nhưng ở đây ta bắt nhập cụ thể
            return toast.warning("Số lượng tối đa phải lớn hơn tối thiểu");
        }
    }

    try {
      if (isEditingGroup) {
        // Cần API PUT /menu/modifiers/:id (Nếu backend chưa có thì phải bổ sung)
        // Giả sử backend đã hỗ trợ hoặc dùng POST đè
        await axiosClient.put(`/menu/modifiers/${payload.id}`, payload); 
        toast.success("Cập nhật nhóm thành công");
      } else {
        await axiosClient.post('/menu/modifiers', payload);
        toast.success("Tạo nhóm thành công");
      }
      setShowGroupModal(false);
      fetchGroups();
    } catch (err) {
      // toast.error(err.response?.data?.message || "Lỗi lưu nhóm");
      // Fallback nếu chưa có API PUT: Báo user
      console.error(err);
    }
  };

  // 3. HANDLERS OPTION
  const handleSaveOption = async (groupId) => {
    if (!newOption.name.trim()) return toast.warning("Nhập tên tùy chọn");
    
    try {
      await axiosClient.post(`/menu/modifiers/${groupId}/options`, {
        name: newOption.name,
        price: parseFloat(newOption.price_adjustment) || 0
      });
      toast.success("Đã thêm tùy chọn");
      setNewOption({ name: '', price_adjustment: 0 });
      fetchGroups(); // Reload để thấy option mới
    } catch (err) {
      toast.error("Lỗi thêm tùy chọn");
    }
  };

  const handleDeleteOption = async (optionId) => {
      // Cần API DELETE option (Backend cần bổ sung nếu chưa có)
      // Tạm thời giả lập UI
      if(!window.confirm("Xóa tùy chọn này?")) return;
      // await axiosClient.delete(...)
      toast.info("Tính năng xóa option đang phát triển ở Backend");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Topping & Size</h1>
          <p className="text-sm text-gray-500">Thiết lập các nhóm tùy chọn cho món ăn</p>
        </div>
        <button onClick={() => openGroupModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={18} /> Tạo Nhóm Mới
        </button>
      </div>

      {loading ? <div className="text-center py-10">Đang tải...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              {/* Header Card */}
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded border ${group.selection_type === 'single' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                      {group.selection_type === 'single' ? 'Chọn 1' : 'Chọn nhiều'}
                    </span>
                    {group.is_required && (
                      <span className="text-xs px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-200">
                        Bắt buộc
                      </span>
                    )}
                  </div>
                  {group.selection_type === 'multiple' && (
                    <div className="text-xs text-gray-500 mt-1">
                        Chọn từ {group.min_selections} đến {group.max_selections}
                    </div>
                  )}
                </div>
                <button onClick={() => openGroupModal(group)} className="text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
              </div>

              {/* List Options */}
              <div className="p-4 flex-1">
                <ul className="space-y-2">
                  {group.options && group.options.length > 0 ? group.options.map((opt, idx) => (
                    <li key={opt.id || idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded group">
                      <span className="font-medium text-gray-700">{opt.name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${opt.price > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {opt.price > 0 ? `+${Number(opt.price).toLocaleString()}đ` : '+0đ'}
                        </span>
                        {/* <button onClick={() => handleDeleteOption(opt.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600"><XCircle size={14}/></button> */}
                      </div>
                    </li>
                  )) : (
                    <li className="text-gray-400 text-sm italic text-center py-2">Chưa có tùy chọn nào</li>
                  )}
                </ul>
              </div>

              {/* Add Option Footer */}
              <div className="p-3 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input 
                    placeholder="Tên (VD: Size L)" 
                    className="flex-1 text-sm border rounded px-2 py-1 outline-none focus:border-blue-500"
                    value={activeGroupId === group.id ? newOption.name : ''}
                    onChange={e => { setActiveGroupId(group.id); setNewOption({...newOption, name: e.target.value}); }}
                  />
                  <input 
                    type="number" placeholder="Giá" 
                    className="w-20 text-sm border rounded px-2 py-1 outline-none focus:border-blue-500"
                    value={activeGroupId === group.id ? newOption.price_adjustment : ''}
                    onChange={e => { setActiveGroupId(group.id); setNewOption({...newOption, price_adjustment: e.target.value}); }}
                  />
                  <button 
                    onClick={() => handleSaveOption(group.id)}
                    className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL GROUP FORM --- */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditingGroup ? 'Cập nhật Nhóm' : 'Tạo Nhóm Topping'}
              </h3>
              <button onClick={() => setShowGroupModal(false)}><XCircle className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên nhóm *</label>
                <input 
                  name="name" required placeholder="VD: Size, Độ ngọt, Topping..."
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={groupData.name} onChange={handleGroupChange}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Kiểu chọn</label>
                    <select 
                        name="selection_type" 
                        className="w-full px-3 py-2 border rounded bg-white"
                        value={groupData.selection_type} onChange={handleGroupChange}
                    >
                        <option value="single">Chọn 1 (Radio)</option>
                        <option value="multiple">Chọn nhiều (Checkbox)</option>
                    </select>
                </div>
                <div className="flex items-center pt-6">
                    <input 
                        type="checkbox" id="req" name="is_required" 
                        className="w-4 h-4 text-blue-600"
                        checked={groupData.is_required} onChange={handleGroupChange}
                    />
                    <label htmlFor="req" className="ml-2 text-sm font-medium">Bắt buộc chọn</label>
                </div>
              </div>

              {/* Logic hiển thị Min/Max chỉ khi chọn Multiple */}
              {groupData.selection_type === 'multiple' && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tối thiểu (Min)</label>
                          <input 
                              type="number" name="min_selections" min="0"
                              className="w-full px-2 py-1 border rounded"
                              value={groupData.min_selections} onChange={handleGroupChange}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tối đa (Max)</label>
                          <input 
                              type="number" name="max_selections" min="1"
                              className="w-full px-2 py-1 border rounded"
                              value={groupData.max_selections} onChange={handleGroupChange}
                          />
                      </div>
                  </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 border rounded text-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifierManagement;