import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Lock, Unlock, CheckCircle, AlertCircle, Utensils } from 'lucide-react';

const ScanQR = () => {
  const { tableCode } = useParams(); // Lấy ID bàn từ URL (VD: T04)
  const navigate = useNavigate();

  // Các trạng thái của màn hình xử lý
  // 'checking': Đang kiểm tra server
  // 'reserved': Bàn đã đặt, cần nhập mã
  // 'success': Thành công, chuẩn bị vào menu
  // 'error': Mã bàn không tồn tại hoặc lỗi mạng
  const [status, setStatus] = useState('checking'); 
  
  const [bookingCode, setBookingCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. MÔ PHỎNG KIỂM TRA TRẠNG THÁI BÀN TỪ SERVER
  useEffect(() => {
    const checkTableStatus = () => {
      // Giả lập độ trễ mạng 1.5s cho nó "thật"
      setTimeout(() => {
        // --- LOGIC GIẢ LẬP (Dựa trên data bên Booking.jsx) ---
        
        // Trường hợp 1: Bàn đặt trước (T04, V02)
        if (['T04', 'V02'].includes(tableCode)) {
          setStatus('reserved');
        } 
        // Trường hợp 2: Bàn không tồn tại (Test lỗi)
        else if (tableCode === 'XXX') {
          setStatus('error');
          setErrorMessage('Mã bàn không hợp lệ hoặc không tồn tại.');
        }
        // Trường hợp 3: Bàn Trống hoặc Đang ngồi (T01, T02...) -> Vào thẳng
        else {
          handleLoginSuccess();
        }
      }, 1500);
    };

    checkTableStatus();
  }, [tableCode]);

  // 2. HÀM XỬ LÝ KHI VÀO THÀNH CÔNG
  const handleLoginSuccess = () => {
    setStatus('success');
    
    // Quan trọng: Lưu session bàn vào LocalStorage để các trang sau dùng
    localStorage.setItem('tableCode', tableCode);
    localStorage.setItem('sessionToken', 'xyz_token_bao_mat'); // Token giả

    // Chuyển hướng sang Menu sau 1s
    setTimeout(() => {
      navigate(`/menu/${tableCode}`);
    }, 1000);
  };

  // 3. HÀM XỬ LÝ MỞ KHÓA BÀN ĐẶT TRƯỚC
  const handleUnlock = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Giả sử mã đúng là 1234 (hoặc 4 số cuối SĐT)
    if (bookingCode === '1234') {
      handleLoginSuccess();
    } else {
      setErrorMessage('Mã xác nhận không đúng. Vui lòng thử lại.');
      // Hiệu ứng rung lắc input (tuỳ chọn thêm CSS)
    }
  };

  // --- GIAO DIỆN ---

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-orange-500 via-red-500 to-orange-500 animate-gradient"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-sm">
        
        {/* TRẠNG THÁI 1: ĐANG KIỂM TRA */}
        {status === 'checking' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils size={24} className="text-orange-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Đang kết nối bàn {tableCode}...</h2>
            <p className="text-gray-400 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {/* TRẠNG THÁI 2: BÀN ĐÃ ĐẶT TRƯỚC (RESERVED) */}
        {status === 'reserved' && (
          <div className="animate-slide-up bg-neutral-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Lock size={32} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Bàn Đã Được Đặt</h2>
            <p className="text-gray-400 text-sm mb-6">
              Bàn <strong>{tableCode}</strong> đang được giữ chỗ. <br/>
              Nhập mã đặt chỗ hoặc SĐT để mở khóa.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập mã (VD: 1234)"
                  className="w-full bg-neutral-950 border border-white/20 rounded-xl px-4 py-3.5 text-center text-lg font-bold tracking-widest focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:font-normal placeholder:tracking-normal"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  autoFocus
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle size={14} />
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <Unlock size={20} />
                Mở Khóa Bàn
              </button>
            </form>
            
            <button className="mt-6 text-gray-500 text-xs hover:text-orange-500 underline">
              Không có mã? Gọi nhân viên hỗ trợ
            </button>
          </div>
        )}


        {status === 'success' && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Xin Chào!</h2>
            <p className="text-gray-400">Bạn đã check-in vào bàn <strong>{tableCode}</strong></p>
            <p className="text-orange-500 text-sm mt-4 font-medium animate-pulse">
              Đang chuyển đến thực đơn...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-gray-500">
              <AlertCircle size={40} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-300">Lỗi Quét Mã</h2>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Về Trang Chủ
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ScanQR;