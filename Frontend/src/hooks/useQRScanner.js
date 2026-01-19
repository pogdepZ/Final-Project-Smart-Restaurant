import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// Giả sử bạn có action để lưu thông tin bàn vào Redux
// import { setTableInfo } from '../store/slices/tableSlice';

const useQRScanner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Tìm params 'qrToken' trên URL
    const qrToken = searchParams.get("qrToken");

    // Nếu có token trên URL
    if (qrToken) {
      console.log("Tìm thấy QR Token:", qrToken);

      // 2. Lưu vào LocalStorage (Để reload trang không bị mất)
      localStorage.setItem("qrToken", qrToken);

      // 3. Dispatch custom event để SocketContext biết cần kết nối
      window.dispatchEvent(new Event("qrTokenSet"));

      // 4. (Tuỳ chọn) Gọi API để giải mã token lấy số bàn, tên quán...
      // Sau đó lưu vào Redux: dispatch(setTableInfo({ tableNumber: 'T05', ... }))

      // 5. Xóa token trên URL cho đẹp (bảo mật & thẩm mỹ)
      searchParams.delete("qrToken");
      setSearchParams(searchParams);

      // Hoặc chuyển hướng người dùng thẳng vào trang Menu
      // navigate('/menu');
    }
  }, [searchParams, setSearchParams, dispatch, navigate]);
};

export default useQRScanner;
