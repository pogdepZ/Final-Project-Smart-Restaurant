import React from 'react';
import { Heart, Clock, Award, Leaf } from 'lucide-react';

const WhyChooseUs = () => {
  const features = [
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Nguyên liệu tươi",
      description: "Cam kết 100% nguyên liệu nhập khẩu và tươi sống mỗi ngày."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Đầu bếp 20 năm",
      description: "Đội ngũ bếp chuyên nghiệp từ khách sạn 5 sao."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Không gian ấm cúng",
      description: "Thiết kế sang trọng, phù hợp gia đình & sự kiện."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Phục vụ nhanh",
      description: "Gọi món qua QR – món lên trong 15 phút."
    }
  ];

  return (
    <section className="py-20 px-4 bg-neutral-900 group overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
          
          {/* --- PHẦN BÊN TRÁI: TIÊU ĐỀ --- */}
          <div className="w-full lg:w-1/3 sticky top-10 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
              <Heart className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">Why Choose Us</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Đẳng cấp <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Ẩm Thực
              </span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-8">
              Rê chuột vào đây để khám phá lý do vì sao hàng ngàn thực khách đã tin tưởng và lựa chọn chúng tôi.
            </p>

            <button className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors">
              Đặt Bàn Ngay
            </button>
          </div>

          {/* --- PHẦN BÊN PHẢI: GRID CÁC LÝ DO --- */}
          <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                // GIẢI THÍCH SỰ THAY ĐỔI:
                // 1. Mặc định (Mobile): opacity-100, translate-x-0 (Hiện rõ, đứng yên)
                // 2. Desktop (lg:): opacity-40, translate-x-[-100px] (Mờ, lệch chỗ)
                // 3. Desktop Hover (lg:group-hover): opacity-100, translate-x-0 (Bay về)
                className={`
                  p-8 bg-neutral-950 rounded-2xl border border-white/5 
                  transition-all duration-700 ease-out
                  
                  /* Mobile: Luôn hiện rõ */
                  opacity-100 translate-x-0
                  
                  /* Desktop: Mờ đi và dịch chuyển, chỉ hiện khi hover */
                  lg:opacity-40 
                  lg:group-hover:opacity-100 lg:group-hover:translate-x-0
                  
                  hover:!opacity-100 hover:!scale-105 hover:!border-orange-500/50 hover:bg-neutral-900

                  /* Logic dịch chuyển chỉ áp dụng cho màn hình lớn (lg:) */
                  ${index % 2 === 0 
                    ? 'lg:translate-x-[-100px]' // Desktop: Bay từ trái
                    : 'lg:translate-x-[100px]'  // Desktop: Bay từ phải
                  }
                `}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/10 text-orange-500 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;