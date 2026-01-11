import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ShoppingBag, Flame, Check } from "lucide-react";
import FoodDetailPopup from "./DetailFoodPopup";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, selectTotalItems } from "../../store/slices/cartSlice";
import { toast } from "react-toastify";
import { Link, useParams } from "react-router-dom";
import { menuApi } from "../../services/menuApi";



const Menu = () => {
  const dispatch = useDispatch();
  const cartCount = useSelector(selectTotalItems);

  const { tableCode } = useParams();

  //filter
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFood, setSelectedFood] = useState(null);
  const [addedItems, setAddedItems] = useState(new Set());

  const [categories, setCategories] = useState([]); 
  const [menuItems, setMenuItems] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

  // 1) Load API
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [catsRes, itemsRes] = await Promise.all([
          menuApi.getMenuCategories(),
          menuApi.getMenuItems(),
        ]);
        const cats = (catsRes || [])
          .filter((c) => (c.status || "active") === "active")
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((c) => c.name);

        const items = (itemsRes || [])
          .filter((it) => it.is_deleted !== true) // nếu có field
          .map((it) => ({
            ...it,
            image: it.image_url, // để UI dùng như cũ
          }));

        if (!mounted) return;

        setCategories(["All", ...cats]);
        setMenuItems(items);

        // set default active category nếu có
        if (cats.length > 0) setActiveCategory(cats[0]);
        else setActiveCategory("All");
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Load menu failed");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // 2) Scroll spy để highlight category
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const category of categories) {
        if (category === "All") continue;

        const element = categoryRefs.current[category];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveCategory(category);
            const btn = document.getElementById(`btn-${category}`);
            if (btn && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({
                left: btn.offsetLeft - 100,
                behavior: "smooth",
              });
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const handleCategoryClick = (category) => {
    if (category === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveCategory("All");
      return;
    }

    setActiveCategory(category);
    const element = categoryRefs.current[category];
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // 3) Group items theo category name
  // Nếu API items chỉ có category_id, bạn cần API trả kèm category_name
  // hoặc map bằng categories list có id->name.
  // TẠM GIẢ SỬ API trả `category_name` cho mỗi item.
  const categorizedMenu = useMemo(() => {
    const cats = categories.filter((c) => c !== "All");
    const q = searchQuery.trim().toLowerCase();

    return cats
      .map((cat) => {
        const items = menuItems.filter((item) => {
          const sameCat =
            item.category === cat || item.category_name === cat; // hỗ trợ cả 2 kiểu
          if (!sameCat) return false;

          // filter status nếu cần: chỉ show available
          // if (item.status !== "available") return false;

          if (!q) return true;
          const nameOk = (item.name || "").toLowerCase().includes(q);
          const descOk = (item.description || "").toLowerCase().includes(q);
          return nameOk || descOk;
        });

        return { category: cat, items };
      })
      .filter((group) => group.items.length > 0);
  }, [categories, menuItems, searchQuery]);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();

    // bạn nên chuẩn hoá item gửi vào cart
    dispatch(
      addToCart({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image || null,
        // thêm field DB bạn cần
        category_id: item.category_id,
        status: item.status,
      })
    );

    setAddedItems((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 1000);

    toast.success(`Đã thêm ${item.name} vào giỏ hàng!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        Đang tải menu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center flex-col gap-3">
        <div className="opacity-80">Lỗi: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
        >
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-4">
        <div className="px-4 container mx-auto max-w-5xl">
          {/* Search */}
          <div className="relative group max-w-lg mx-auto mb-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Bạn muốn ăn gì hôm nay?..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all duration-300 shadow-lg"
            />
          </div>

          {/* Categories */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 select-none scroll-smooth pr-16"
            >
              {categories
                .filter((c) => c !== "All")
                .map((category) => (
                  <button
                    key={category}
                    id={`btn-${category}`}
                    onClick={() => handleCategoryClick(category)}
                    className={`whitespace-nowrap rounded-full font-bold tracking-wide transition-all duration-300 ease-out border shrink-0 px-4 py-1.5 text-xs ${
                      activeCategory === category
                        ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-105"
                        : "bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white hover:scale-105"
                    }`}
                  >
                    {category}
                  </button>
                ))}
            </div>

            <Link
              to={tableCode ? `/cart/${tableCode}` : "/cart"}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-1/2 -translate-y-1/2
               h-10 w-10 rounded-full border border-white/10
               bg-neutral-900/90 backdrop-blur
               flex items-center justify-center
               text-gray-200 hover:text-orange-500
               hover:border-orange-500/40 hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]
               transition-all active:scale-95"
              aria-label="Giỏ hàng"
              title="Giỏ hàng"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-5 h-5 px-1
                       bg-orange-500 text-white text-[11px] font-black
                       rounded-full flex items-center justify-center
                       shadow-[0_0_0_3px_rgba(10,10,10,0.9)]"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* MENU SECTIONS */}
      <div className="container mx-auto max-w-5xl px-4 pt-4">
        {categorizedMenu.length > 0 ? (
          categorizedMenu.map((group) => (
            <div
              key={group.category}
              ref={(el) => (categoryRefs.current[group.category] = el)}
              className="mb-12 scroll-mt-36"
            >
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500 uppercase tracking-tight">
                  {group.category}
                </h2>
                <div className="h-px flex-1 bg-linear-to-r from-orange-500/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFood(item)}
                    className="group flex gap-4 bg-transparent hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5 cursor-pointer"
                  >
                    <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden relative">
                      <img
                        src={item.image || "https://via.placeholder.com/400x400?text=No+Image"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      {item.status && item.status !== "available" && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-xs font-bold">
                          {item.status}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                          {/* demo icon */}
                          {String(item.id).endsWith("0") && (
                            <Flame
                              size={14}
                              className="text-orange-500 fill-orange-500 ml-2 shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xl font-black text-white">
                          ${Number(item.price).toFixed(2)}
                        </span>

                        <button
                          disabled={item.status && item.status !== "available"}
                          onClick={(e) => handleAddToCart(e, item)}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg active:scale-90 relative ${
                            item.status && item.status !== "available"
                              ? "bg-neutral-800 border-white/10 text-gray-600 cursor-not-allowed"
                              : addedItems.has(item.id)
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-neutral-800 border-white/10 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500"
                          }`}
                        >
                          {addedItems.has(item.id) ? (
                            <Check size={18} className="animate-bounce" />
                          ) : (
                            <ShoppingBag size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-50">
            <p>Không tìm thấy món nào phù hợp.</p>
          </div>
        )}
      </div>

      {selectedFood && (
        <FoodDetailPopup
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
};

export default Menu;
