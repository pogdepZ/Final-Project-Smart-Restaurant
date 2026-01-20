import { Link } from "react-router-dom";
import {
  ArrowRight,
  QrCode,
  Leaf,
  ChefHat,
  Heart,
  Clock,
  Sparkles,
  Star,
  Users,
  Wine,
} from "lucide-react";
import WhyChooseUs from "../../Components/WhyChooseUs";
import SignatureDishes from "../../Components/SignatureDishes";
import HeroTitle from "../../Components/HeroTitle";
import { WelcomeCurtain } from "../../Components/WelcomeCurtain";
import BlogSection from "../../Components/BlogSection";
import { useEffect } from "react";
import { useState } from "react";
import { menuApi } from "../../services/menuApi";
import { useTranslation } from "react-i18next";
// --- COMPONENT CON: HIỆU ỨNG MÀN CHÀO MỪNG ---

// --- COMPONENT CHÍNH ---
const LandingPage = () => {
  const { t } = useTranslation();
  // 1. Dữ liệu Món ăn Signature
  const [signatureDishes, setSignatureDishes] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchTopDishes = async () => {
      try {
        const res = await menuApi.getTopChefBestSeller(5);

        const items = res?.data || [];

        if (mounted) setSignatureDishes(items);
      } catch (err) {
        console.error("fetchTopDishes error:", err);
        if (mounted) setSignatureDishes([]);
      }
    };

    fetchTopDishes();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Dữ liệu Tính năng
  const features = [
    {
      icon: <Leaf className="w-8 h-8" />,
      title: t("landing.features.freshIngredients.title"),
      description: t("landing.features.freshIngredients.description"),
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: t("landing.features.experiencedChef.title"),
      description: t("landing.features.experiencedChef.description"),
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: t("landing.features.cozySpace.title"),
      description: t("landing.features.cozySpace.description"),
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: t("landing.features.fastService.title"),
      description: t("landing.features.fastService.description"),
    },
  ];

  // 3. Dữ liệu Hình ảnh Gallery
  const galleryImages = [
    {
      url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
      title: t("landing.gallery.indoor.title"),
      description: t("landing.gallery.indoor.description"),
    },
    {
      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
      title: t("landing.gallery.dining.title"),
      description: t("landing.gallery.dining.description"),
    },
    {
      url: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=600",
      title: t("landing.gallery.checkin.title"),
      description: t("landing.gallery.checkin.description"),
    },
    {
      url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
      title: t("landing.gallery.vip.title"),
      description: t("landing.gallery.vip.description"),
    },
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
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <HeroTitle />

          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-10 font-light">
            {t("landing.hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/menu"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              {t("landing.hero.viewMenu")}
              <ArrowRight size={20} />
            </Link>

            <Link
              to="/signup"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all "
            >
              {t("landing.hero.registerMember")}
            </Link>
          </div>

          {/* Gợi ý quét QR */}
          <div className="mt-12 flex items-center gap-4 text-gray-400 text-sm p-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
            <div className="bg-white p-1 rounded">
              <QrCode size={24} className="text-black" />
            </div>
            <div className="text-left">
              <p className="text-gray-200 font-bold">
                {t("landing.hero.atRestaurant")}
              </p>
              <p>{t("landing.hero.scanQRHint")}</p>
            </div>
          </div>
        </div>
      </div>

      <SignatureDishes signatureDishes={signatureDishes} />
      {/* 3. FEATURES / WHY CHOOSE US SECTION */}
      <WhyChooseUs />
      <BlogSection />

      {/* 4. GALLERY / RESTAURANT SPACE SECTION */}
      <section className="py-20 px-4 bg-neutral-950">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
              <Users className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">
                {t("landing.space.badge")}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t("landing.space.title")}{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                {t("landing.space.titleHighlight")}
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t("landing.space.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl ${
                  index === 0 ? "md:col-span-2 h-96" : "h-72"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {image.title}
                  </h3>
                  <p className="text-gray-300 text-sm">{image.description}</p>
                </div>

                <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t("landing.viewMore")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
