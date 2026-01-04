import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const Header = () => {
  // Giả lập số bàn lấy từ LocalStorage hoặc URL
  const tableNumber = "Bàn 05"; 

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-40 px-4 flex items-center justify-between">
      {/* 1. Logo & Tên quán */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          SR
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">Smart Resto</h1>
          <p className="text-xs text-gray-500">Thưởng thức món ngon</p>
        </div>
      </Link>

      {/* 2. Thông tin Bàn & Nút Gọi phục vụ (Nhanh) */}
      <div className="flex items-center gap-3">
        {/* Badge số bàn - Rất quan trọng */}
        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
          {tableNumber}
        </div>

        {/* Nút tìm kiếm nhanh (Optional) */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <Search size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;