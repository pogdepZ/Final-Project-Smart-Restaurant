import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Star, ArrowRight, QrCode, TrendingUp } from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const SignatureDishes = ({ signatureDishes = [] }) => {
  const formatVND = useMemo(() => {
    return (value) => {
      const n = Number(value || 0);
      return n.toLocaleString("vi-VN") + " ₫";
    };
  }, []);

  return (
    <section className="py-20 px-4 bg-neutral-950">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
              Signature Dishes
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Món Ăn{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
              Đặc Trưng
            </span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Top món được đầu bếp đề xuất và được gọi nhiều nhất
          </p>
        </div>

        {/* Slider */}
        <div className="mb-16 px-2">
          {signatureDishes.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              Chưa có dữ liệu món ăn.
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={24}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-12"
            >
              {signatureDishes.map((dish) => (
                <SwiperSlide key={dish.id} className="h-auto">
                  <div className="group h-120 relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 flex flex-col">
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden shrink-0">
                      <img
                        src={
                          dish.image || "https://via.placeholder.com/600x400"
                        }
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />

                      {/* Badge thay cho category text */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                          Chef’s Choice
                        </span>

                        {typeof dish.soldQty === "number" && (
                          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/10 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {dish.soldQty} sold
                          </span>
                        )}
                      </div>

                      {/* Rating fake (giữ style), nếu muốn bỏ thì xoá */}
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-white text-xs font-bold">
                          4.9
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">
                        {dish.name}
                      </h3>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                        {dish.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        {/* Giá VND */}
                        <span className="text-2xl font-black text-orange-500">
                          {formatVND(dish.price)}
                        </span>

                        {/* Nút gọi món: đưa qua menu (có thể truyền query) */}
                        <Link
                          to={`/menu?itemId=${dish.id}`}
                          className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white font-bold rounded-lg transition-all"
                        >
                          Gọi món
                        </Link>
                      </div>

                      {/* Nếu muốn hiển thị categoryId nhỏ nhỏ */}
                      {/* <div className="mt-3 text-xs text-gray-500">categoryId: {dish.categoryId}</div> */}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/menu"
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
          >
            Xem Toàn Bộ Menu
            <ArrowRight size={20} />
          </Link>

          <Link
            to="/booking"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <QrCode size={20} />
            Quét mã QR
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SignatureDishes;
