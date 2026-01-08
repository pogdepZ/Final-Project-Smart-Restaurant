import React, { useState } from 'react';
import QRCode from "react-qr-code";
import { User, MapPin, X, Users, Armchair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 1. Mock Data: Danh sách bàn chia theo khu vực
const AREAS = [
  {
    id: 'area-1',
    name: 'Sảnh Chính (Tầng 1)',
    tables: [
      { id: 'T01', name: 'Bàn 01', seats: 2, status: 'occupied' }, // Có khách
      { id: 'T02', name: 'Bàn 02', seats: 4, status: 'available' }, // Trống
      { id: 'T03', name: 'Bàn 03', seats: 4, status: 'available' },
      { id: 'T04', name: 'Bàn 04', seats: 6, status: 'reserved' }, // Đã đặt
      { id: 'T05', name: 'Bàn 05', seats: 2, status: 'available' },
    ]
  },
  {
    id: 'area-2',
    name: 'Sân Vườn (Ngoài trời)',
    tables: [
      { id: 'O01', name: 'Vườn 01', seats: 4, status: 'available' },
      { id: 'O02', name: 'Vườn 02', seats: 8, status: 'available' },
      { id: 'O03', name: 'Vườn 03', seats: 4, status: 'occupied' },
    ]
  },
  {
    id: 'area-3',
    name: 'Phòng VIP (Tầng 2)',
    tables: [
      { id: 'V01', name: 'VIP 01', seats: 10, status: 'available' },
      { id: 'V02', name: 'VIP 02', seats: 12, status: 'reserved' },
    ]
  }
];

const Booking = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const navigate = useNavigate();

  // Hàm xử lý khi click vào bàn
  const handleTableClick = (table) => {
    // Nếu bàn đang có khách -> Không cho chọn (hoặc hiện thông báo khác)
    if (table.status === 'occupied') return;
    
    // Mở popup QR
    setSelectedTable(table);
  };

  // Hàm giả lập quét QR (Để test trên máy tính)
  const handleSimulateScan = () => {
    if (selectedTable) {
      navigate(`/scan/${selectedTable.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <MapPin className="text-orange-500" /> Sơ Đồ Bàn Ăn
          </h1>
          <p className="text-gray-400">Chọn bàn trống để lấy mã QR gọi món</p>
        </div>

        {/* Chú thích trạng thái (Legend) */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-800 border border-white/20"></div>
            <span className="text-gray-300">Bàn Trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500"></div>
            <span className="text-orange-500 font-bold">Đang Có Khách</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-900/20 border border-red-500/50"></div>
            <span className="text-red-400">Đã Đặt Trước</span>
          </div>
        </div>

        <div className="space-y-10">
          {AREAS.map((area) => (
            <div key={area.id}>
              <h2 className="text-xl font-bold text-orange-400 mb-4 border-l-4 border-orange-500 pl-3">
                {area.name}
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {area.tables.map((table) => {

                  const isOccupied = table.status === 'occupied';
                  const isReserved = table.status === 'reserved';
                  const isAvailable = table.status === 'available';

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      disabled={isOccupied} 
                      className={`
                        relative group p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 min-h-30
                        ${isAvailable ? 'bg-neutral-900 border-white/10 hover:border-orange-500 hover:bg-neutral-800 cursor-pointer' : ''}
                        ${isOccupied ? 'bg-orange-500/10 border-orange-500/50 opacity-80 cursor-not-allowed' : ''}
                        ${isReserved ? 'bg-red-900/10 border-red-500/30 opacity-60' : ''}
                      `}
                    >
                      <Armchair 
                        size={32} 
                        className={`
                          ${isAvailable ? 'text-gray-400 group-hover:text-orange-500' : ''}
                          ${isOccupied ? 'text-orange-500' : ''}
                          ${isReserved ? 'text-red-500' : ''}
                        `} 
                      />
                      
                      <span className={`font-bold text-lg ${isOccupied ? 'text-orange-500' : 'text-white'}`}>
                        {table.name}
                      </span>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={12} />
                        <span>{table.seats} chỗ</span>
                      </div>

                      {isOccupied && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>}
                      {isReserved && <span className="text-[10px] text-red-400 font-bold uppercase mt-1">Reserved</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MODAL HIỂN THỊ MÃ QR */}
      {selectedTable && (
        <div className="fixed inset-0 z-100  flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
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
              <h3 className="text-2xl font-bold text-white mb-1">{selectedTable.name}</h3>
              <p className="text-orange-500 text-sm font-medium mb-6">Quét mã để gọi món</p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-xl inline-block mb-6 mx-auto">
                <QRCode
                  value={`https://your-domain.com/scan/${selectedTable.id}`} // URL thực tế
                  size={200}
                  level="H" // Độ khó QR (High)
                />
              </div>

              <p className="text-gray-400 text-sm mb-6 px-4">
                Sử dụng Camera hoặc Zalo để quét mã trên. <br/>
                Hệ thống sẽ tự động nhận diện bàn của bạn.
              </p>

              {/* Nút giả lập (Dành cho Dev/Test) */}
              <button
                onClick={handleSimulateScan}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Vào bàn ngay (Giả lập)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;