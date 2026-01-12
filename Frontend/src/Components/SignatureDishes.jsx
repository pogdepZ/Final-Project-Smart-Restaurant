import React from 'react';
import { Link } from 'react-router-dom'; // Giả sử bạn dùng react-router
import { Sparkles, Star, ArrowRight, QrCode } from 'lucide-react';

// 1. Import các thành phần của Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// 2. Import CSS của Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';


const SignatureDishes = ({ signatureDishes }) => {
  return (
    <section className="py-20 px-4 bg-neutral-950">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">Signature Dishes</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Món Ăn <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">Đặc Trưng</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Những món ăn được yêu thích nhất, được chế biến từ nguyên liệu cao cấp bởi đầu bếp chuyên nghiệp
          </p>
        </div>

        {/* --- PHẦN SLIDER (THAY CHO GRID) --- */}
        <div className="mb-16 px-2"> {/* Thêm padding x để shadow không bị cắt */}
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={24} // Khoảng cách giữa các slide (tương đương gap-6)
            slidesPerView={1} // Mặc định mobile hiện 1 cái
            loop={true} // Vòng lặp vô tận
            autoplay={{
              delay: 3000, // Tự chạy sau 3 giây
              disableOnInteraction: false, // Vẫn chạy tiếp sau khi người dùng vuốt
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true, // Dấu chấm to nhỏ đẹp mắt
            }}
            breakpoints={{
              640: {
                slidesPerView: 2, // Tablet nhỏ hiện 2
              },
              1024: {
                slidesPerView: 3, // PC hiện 3
              },
            }}
            className="pb-12" // Padding bottom để chứa các dấu chấm pagination
          >
            {signatureDishes.map((dish) => (
              <SwiperSlide key={dish.id} className="h-auto">
                {/* Giữ nguyên Card Design của bạn */}
                <div className="group h-full relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 flex flex-col">
                  
                  {/* Image Area */}
                  <div className="relative h-64 overflow-hidden shrink-0">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
                    
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        {dish.category}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">4.9</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                      {dish.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-black text-orange-500">
                        ${dish.price}
                      </span>
                      <button className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white font-bold rounded-lg transition-all">
                        Gọi món
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/menu"
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
          >
            Xem Toàn Bộ Menu
            <ArrowRight size={20} />
          </Link>
          <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
            <QrCode size={20} />
            Quét QR Menu
          </button>
        </div>
      </div>
    </section>
  );
};

export default SignatureDishes;