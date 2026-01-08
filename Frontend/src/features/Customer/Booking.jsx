import React, { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { MapPin, X, Users, Armchair, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient'; // Đảm bảo đường dẫn đúng

const Booking = () => {
  const navigate = useNavigate();

  // 1. State quản lý dữ liệu
  const [areas, setAreas] = useState([]); // Danh sách khu vực (đã nhóm)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State UI
  const [selectedTable, setSelectedTable] = useState(null);

  // 2. Hàm gọi API và xử lý dữ liệu
  const fetchTables = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gọi API lấy danh sách bàn
      const response = await axiosClient.get('/tables');
      const rawTables = response.data;

      // --- LOGIC NHÓM BÀN THEO KHU VỰC (LOCATION) ---
      const groupedData = rawTables.reduce((acc, table) => {
        // Nếu location null, gán vào "Khu vực khác"
        const locationName = table.location || 'Khu vực chung';
        
        // Tạo nhóm nếu chưa tồn tại
        if (!acc[locationName]) {
          acc[locationName] = {
            id: locationName, // Dùng tên làm ID tạm
            name: locationName,
            tables: []
          };
        }

        // Push bàn vào nhóm
        acc[locationName].tables.push(table);
        return acc;
      }, {});

      // Chuyển Object thành Array để map
      // Sắp xếp các bàn trong khu vực theo tên (table_number)
      const areaArray = Object.values(groupedData).map(area => ({
        ...area,
        tables: area.tables.sort((a, b) => a.table_number.localeCompare(b.table_number))
      }));

      setAreas(areaArray);

    } catch (err) {
      console.error("Lỗi tải bàn:", err);
      setError("Không thể tải sơ đồ bàn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchTables();
  }, []);

  // 3. Hàm xử lý khi click bàn
  const handleTableClick = (table) => {
    // Nếu bàn inactive (ngừng hoạt động) thì không cho chọn
    if (table.status === 'inactive') return;
    
    // Nếu bàn đang có khách (logic này cần backend trả về field 'is_occupied' hoặc join với orders)
    // Hiện tại tạm thời dựa vào status
    
    setSelectedTable(table);
  };

  // Giả lập quét
  const handleSimulateScan = () => {
    if (selectedTable) {
      // Điều hướng sang trang Menu kèm theo ID bàn hoặc Token bàn
      navigate(`/menu?tableId=${selectedTable.id}`);
    }
  };

  // 4. Render Loading / Error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 size={40} className="animate-spin text-orange-500"/>
        <p className="text-sm font-light tracking-widest uppercase">Đang tải sơ đồ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-red-400 gap-4">
        <AlertCircle size={40}/>
        <p>{error}</p>
        <button onClick={fetchTables} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-all">
          <RefreshCw size={16}/> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-10 px-4 font-sans">
      <div className="container mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <MapPin className="text-orange-500" /> Sơ Đồ Bàn Ăn
          </h1>
          <p className="text-gray-400">Chọn bàn trống để lấy mã QR gọi món</p>
        </div>

        {/* Chú thích trạng thái (Legend) */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm border-b border-white/5 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-900 border border-white/20"></div>
            <span className="text-gray-300">Hoạt động (Trống)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-900/20 border border-red-500/50"></div>
            <span className="text-red-400">Ngừng hoạt động</span>
          </div>
          {/* Tạm ẩn trạng thái Occupied vì API chưa trả về */}
        </div>

        <div className="space-y-12">
          {areas.length > 0 ? (
            areas.map((area) => (
              <div key={area.id} className="animate-fade-in-up">
                <h2 className="text-xl font-bold text-orange-400 mb-6 border-l-4 border-orange-500 pl-3 uppercase tracking-wide">
                  {area.name}
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {area.tables.map((table) => {
                    // Logic xác định trạng thái hiển thị
                    // Backend hiện tại chỉ có 'active' | 'inactive'
                    const isInactive = table.status === 'inactive';
                    // const isOccupied = table.is_occupied; // Cần update backend sau này
                    
                    return (
                      <button
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        disabled={isInactive} 
                        className={`
                          relative group p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 min-h-[140px]
                          ${!isInactive 
                            ? 'bg-neutral-900 border-white/10 hover:border-orange-500 hover:bg-neutral-800 cursor-pointer hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                            : 'bg-red-900/5 border-red-500/10 opacity-50 cursor-not-allowed grayscale'}
                        `}
                      >
                        <Armchair 
                          size={32} 
                          className={`transition-colors duration-300
                            ${!isInactive ? 'text-gray-500 group-hover:text-orange-500' : 'text-red-900'}
                          `} 
                        />
                        
                        <span className={`font-bold text-lg ${!isInactive ? 'text-white' : 'text-gray-600'}`}>
                          {table.table_number}
                        </span>

                        <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-gray-400">
                          <Users size={12} />
                          <span>{table.capacity} chỗ</span>
                        </div>

                        {/* Badge trạng thái */}
                        {isInactive && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-900/50 text-[8px] text-red-200 font-bold uppercase border border-red-500/30">
                            Đóng
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10 italic">
              Chưa có bàn nào được tạo. Vui lòng tạo bàn trong trang Admin.
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL HIỂN THỊ MÃ QR */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl shadow-orange-500/10 transform transition-all scale-100">
            
            {/* Nút đóng */}
            <button 
              onClick={() => setSelectedTable(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            {/* Nội dung Modal */}
            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">Bàn {selectedTable.table_number}</h3>
              <p className="text-orange-500 text-sm font-medium mb-6 uppercase tracking-widest text-[10px]">
                 {selectedTable.location}
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-xl inline-block mb-6 mx-auto shadow-lg shadow-white/10">
                <QRCode
                  // Nếu backend có trả về qr_token thì dùng, không thì tạo link tạm
                  value={`http://localhost:5173/menu?tableId=${selectedTable.id}`} 
                  size={200}
                  level="H"
                />
              </div>

              <p className="text-gray-400 text-sm mb-6 px-4 leading-relaxed">
                Sử dụng Camera hoặc Zalo để quét mã.<br/>
                Hệ thống sẽ tự động mở Menu cho bàn <b>{selectedTable.table_number}</b>.
              </p>

              {/* Nút giả lập */}
              <button
                onClick={handleSimulateScan}
                className="w-full py-3 bg-linear-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                Vào bàn ngay (Simulation)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;