import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, Leaf, ChefHat, Heart, Clock, Sparkles, Star, Users, Wine } from 'lucide-react';
import WhyChooseUs from '../../Components/WhyChooseUs';
import SignatureDishes from '../../Components/SignatureDishes';
import HeroTitle from '../../Components/HeroTitle';
import { WelcomeCurtain } from '../../Components/WelcomeCurtain';
// --- COMPONENT CON: HIỆU ỨNG MÀN CHÀO MỪNG ---


// --- COMPONENT CHÍNH ---
const LandingPage = () => {
  // 1. Dữ liệu Món ăn Signature
  const signatureDishes = [
    {
      id: 1,
      name: 'Ribeye Steak',
      category: 'Món Chính',
      price: 32.99,
      description: 'Thăn lưng bò 12oz nướng hoàn hảo',
      image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400'
    },
    {
      id: 2,
      name: 'Grilled Salmon',
      category: 'Món Đặc Biệt',
      price: 24.99,
      description: 'Cá hồi Atlantic nướng sốt bơ chanh',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400'
    },
    {
      id: 3,
      name: 'Lobster Tail',
      category: 'Món Cao Cấp',
      price: 39.99,
      description: 'Đuôi tôm hùm Maine hấp bơ tỏi',
      image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400'
    },
    {
      id: 4,
      name: 'Truffle Pasta',
      category: 'Món Đặc Biệt',
      price: 21.99,
      description: 'Mì Ý nấm truffle phô mai Parmesan',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400'
    },
    {
      id: 5,
      name: 'BBQ Ribs Combo',
      category: 'Combo',
      price: 28.99,
      description: 'Sườn nướng BBQ + khoai + salad',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'
    },
    {
      id: 6,
      name: 'Seafood Platter',
      category: 'Combo',
      price: 45.99,
      description: 'Tổng hợp hải sản tươi sống cho 2 người',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400'
    }
  ];

  // 2. Dữ liệu Tính năng
  const features = [
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Nguyên liệu tươi mỗi ngày',
      description: 'Cam kết 100% nguyên liệu nhập khẩu và tươi sống'
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: 'Đầu bếp 20 năm kinh nghiệm',
      description: 'Đội ngũ bếp chuyên nghiệp từ khách sạn 5 sao'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Không gian ấm cúng',
      description: 'Thiết kế sang trọng, phù hợp gia đình & sự kiện'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Phục vụ nhanh chóng',
      description: 'Gọi món qua QR - món lên trong 15 phút'
    }
  ];

  // 3. Dữ liệu Hình ảnh Gallery
  const galleryImages = [
    {
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      title: 'Không gian trong nhà',
      description: 'Sức chứa 120 khách'
    },
    {
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
      title: 'Khu vực bàn ăn',
      description: 'Thiết kế hiện đại'
    },
    {
      url: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=600',
      title: 'Góc check-in',
      description: 'Instagram-worthy'
    },
    {
      url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      title: 'Phòng VIP',
      description: 'Sự kiện riêng tư'
    }
  ];

  return (
    <div className="relative w-full overflow-hidden bg-neutral-950">
      
      {/* --- HIỆU ỨNG MÀN CHÀO MỪNG --- */}
      <WelcomeCurtain />
      
      
      {/* 1. HERO SECTION */}
      <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Restaurant Background"
            className="w-full h-full object-cover opacity-60 transition-transform duration-[10s] hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
      

          <HeroTitle/>

          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-10 font-light">
            Đặt bàn dễ dàng, gọi món nhanh chóng qua mã QR. Trải nghiệm phong cách phục vụ hiện đại ngay hôm nay.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/menu"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              Xem Thực Đơn
              <ArrowRight size={20} />
            </Link>

            <Link
              to="/signup"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/30"
            >
              Đăng ký thành viên
            </Link>
          </div>

          {/* Gợi ý quét QR */}
          <div className="mt-12 flex items-center gap-4 text-gray-400 text-sm p-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
            <div className="bg-white p-1 rounded">
              <QrCode size={24} className="text-black" />
            </div>
            <div className="text-left">
              <p className="text-gray-200 font-bold">Đã có mặt tại quán?</p>
              <p>Vui lòng quét mã QR trên bàn để gọi món.</p>
            </div>
          </div>
        </div>
      </div>

      <SignatureDishes signatureDishes={signatureDishes}/>
      {/* 3. FEATURES / WHY CHOOSE US SECTION */}
     <WhyChooseUs/>

      {/* 4. GALLERY / RESTAURANT SPACE SECTION */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
              <Users className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">Our Space</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Không Gian <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Nhà Hàng</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Thiết kế sang trọng, ấm cúng - Nơi lý tưởng cho mọi dịp đặc biệt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl ${
                  index === 0 ? 'md:col-span-2 h-96' : 'h-72'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {image.title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {image.description}
                  </p>
                </div>

                <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Xem thêm
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-neutral-900 rounded-xl border border-white/5">
              <div className="text-4xl font-black text-orange-500 mb-2">120+</div>
              <div className="text-gray-400">Chỗ ngồi</div>
            </div>
            <div className="text-center p-6 bg-neutral-900 rounded-xl border border-white/5">
              <div className="text-4xl font-black text-orange-500 mb-2">3</div>
              <div className="text-gray-400">Phòng VIP</div>
            </div>
            <div className="text-center p-6 bg-neutral-900 rounded-xl border border-white/5">
              <div className="text-4xl font-black text-orange-500 mb-2">50+</div>
              <div className="text-gray-400">Sự kiện/tháng</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA SECTION */}
      <section className="py-20 px-4 bg-neutral-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Sẵn Sàng Trải Nghiệm?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Đặt bàn ngay hôm nay hoặc ghé thăm để khám phá thực đơn đa dạng của chúng tôi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
            >
              <Wine size={20} />
              Đặt Bàn Ngay
            </Link>
            <Link
              to="/menu"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Xem Menu
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;