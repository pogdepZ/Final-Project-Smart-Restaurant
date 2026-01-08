import { ChefHat } from "lucide-react";
import { useEffect, useState } from "react";

// --- COMPONENT CON: HIỆU ỨNG MÀN CHÀO MỪNG (ĐÃ FIX LỖI MOBILE) ---
export const WelcomeCurtain = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);



  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    const removeTimer = setTimeout(() => {
      setIsRemoved(true);
    }, 2500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (isRemoved) return null;

  return (
    // FIX 1: Thay 'flex' bằng 'grid grid-cols-2' để chia đôi màn hình cứng cáp hơn
    // Hoặc giữ flex nhưng thêm w-screen để đảm bảo full width
    <div className="fixed inset-0 z-50 flex w-screen h-screen pointer-events-none overflow-hidden">
      
      {/* CÁNH MÀN TRÁI */}
      <div 
        // FIX 2: Thêm 'shrink-0' (quan trọng nhất) để không bị co lại khi chữ to
        // Thay w-1/2 bằng w-[50vw] để ép đúng 50% chiều ngang màn hình thiết bị
        className={`relative w-[50vw] shrink-0 h-full bg-red-900 flex items-center justify-end border-r-2 md:border-r-4 border-yellow-500 shadow-2xl transition-transform duration-[1500ms] ease-in-out ${
          isOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,theme(colors.yellow.500)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {/* Chữ bên trái */}
        <div className={`mr-2 md:mr-10 transition-opacity duration-500 ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-right">
            {/* FIX 3: Giảm size chữ trên mobile (text-3xl) để tránh vỡ layout */}
            <h1 className="text-3xl md:text-7xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-lg font-serif whitespace-nowrap">
              KHAI
            </h1>
          </div>
        </div>
      </div>

      {/* CÁNH MÀN PHẢI */}
      <div 
        // FIX 2: Tương tự bên trái: w-[50vw] và shrink-0
        className={`relative w-[50vw] shrink-0 h-full bg-red-900 flex items-center justify-start border-l-2 md:border-l-4 border-yellow-500 shadow-2xl transition-transform duration-[1500ms] ease-in-out ${
          isOpen ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,theme(colors.yellow.500)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

        {/* Chữ bên phải */}
        <div className={`ml-2 md:ml-10 transition-opacity duration-500 ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-left">
             {/* FIX 3: Giảm size chữ tương tự */}
            <h1 className="text-3xl md:text-7xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-lg font-serif whitespace-nowrap">
              VỊ
            </h1>
          </div>
        </div>
      </div>

      {/* LOGO TRÒN Ở GIỮA */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          isOpen ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* FIX 4: Giảm kích thước logo trên mobile một chút để cân đối */}
        <div className="w-20 h-20 md:w-40 md:h-40 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(234,179,8,0.8)] z-50 border-4 border-white transform scale-100">
          <ChefHat className="text-red-900 w-10 h-10 md:w-20 md:h-20" />
        </div>
      </div>
    </div>
  );
};