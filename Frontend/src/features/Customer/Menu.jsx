import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShoppingBag, Star, Flame, Check, Loader2, AlertCircle } from 'lucide-react';
import FoodDetailPopup from './DetailFoodPopup';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import axiosClient from '../../services/axiosClient'; // Import API client

const Menu = () => {
  const dispatch = useDispatch();
  
  // --- STATE QUẢN LÝ DỮ LIỆU TỪ API ---
  const [categories, setCategories] = useState([]); // Danh sách danh mục từ DB
  const [menuItems, setMenuItems] = useState([]);   // Danh sách món ăn từ DB
  const [isLoading, setIsLoading] = useState(true); // Trạng thái loading
  const [error, setError] = useState(null);         // Trạng thái lỗi

  // State UI
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [addedItems, setAddedItems] = useState(new Set()); 

  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

  // --- 1. GỌI API LẤY DỮ LIỆU ---
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        // Gọi song song cả 2 API để tiết kiệm thời gian
        const [categoriesRes, itemsRes] = await Promise.all([
          axiosClient.get('/menu/categories'),
          axiosClient.get('/menu/items')
        ]);

        setCategories(categoriesRes.data);
        setMenuItems(itemsRes.data);
        
        // Mặc định set active category là cái đầu tiên nếu có
        if (categoriesRes.data.length > 0) {
            setActiveCategory(categoriesRes.data[0].name);
        }

      } catch (err) {
        console.error("Lỗi tải menu:", err);
        setError("Không thể tải thực đơn. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // --- 2. XỬ LÝ SCROLL SPY (Tự động active tab khi cuộn) ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      // Duyệt qua các danh mục thật
      for (const cat of categories) {
        const element = categoryRefs.current[cat.name];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(cat.name);
            
            // Auto scroll thanh menu ngang
            const btn = document.getElementById(`btn-${cat.name}`);
            if (btn && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({
                left: btn.offsetLeft - 100,
                behavior: 'smooth'
              });
            }
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // --- 3. XỬ LÝ CLICK DANH MỤC ---
  const handleCategoryClick = (catName) => {
    setActiveCategory(catName);
    const element = categoryRefs.current[catName];
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- 4. DATA PROCESSING (Gộp món vào danh mục + Search) ---
  const categorizedMenu = useMemo(() => {
    // Duyệt qua danh sách Categories từ DB
    return categories.map(cat => {
      // Lọc các món thuộc category này VÀ thỏa mãn ô tìm kiếm
      const items = menuItems.filter(item => 
        item.category_id === cat.id &&
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())))
      );
      
      return { 
        id: cat.id,
        category: cat.name, 
        items 
      };
    }).filter(group => group.items.length > 0); // Chỉ lấy nhóm nào có món
  }, [categories, menuItems, searchQuery]);

  // --- 5. ADD TO CART ---
  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    
    // Convert giá từ string (nếu DB trả về numeric) sang number
    const itemToAdd = {
        ...item,
        price: parseFloat(item.price) 
    };

    dispatch(addToCart(itemToAdd));
    setAddedItems(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems(prev => {
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

  // --- RENDER LOADING HOẶC ERROR ---
  if (isLoading) {
      return (
          <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4">
              <Loader2 size={40} className="animate-spin text-orange-500"/>
              <p className="text-sm font-light tracking-widest uppercase">Đang tải thực đơn...</p>
          </div>
      )
  }

  if (error) {
    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-red-400 gap-4">
            <AlertCircle size={40}/>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white">Thử lại</button>
        </div>
    )
}

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-4">
        <div className="px-4 container mx-auto max-w-5xl">
          {/* Search Bar */}
          <div className="relative group max-w-lg mx-auto mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Bạn muốn ăn gì hôm nay?..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-12 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all duration-300 shadow-lg"
            />
          </div>

          {/* Categories Bar (Render từ State Categories) */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 select-none scroll-smooth pr-16"
            >
              {categories.map(cat => (
                <button
                  key={cat.id}
                  id={`btn-${cat.name}`}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`whitespace-nowrap rounded-full font-bold tracking-wide transition-all duration-300 ease-out border shrink-0 px-4 py-1.5 text-xs ${activeCategory === cat.name
                    ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-105'
                    : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white hover:scale-105'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MENU SECTIONS --- */}
      <div className="container mx-auto max-w-5xl px-4 pt-4">
        {categorizedMenu.length > 0 ? (
          categorizedMenu.map((group) => (
            <div 
              key={group.id} 
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
                {group.items.map(item => (
                  <div key={item.id} onClick={() => setSelectedFood(item)} className="group flex gap-4 bg-transparent hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5 cursor-pointer">
                    <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden relative">
                      {/* Xử lý ảnh: Ưu tiên image_url từ DB, nếu không có thì dùng placeholder */}
                      <img 
                        src={item.image_url || "https://via.placeholder.com/150?text=No+Image"} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        loading="lazy" 
                        onError={(e) => {e.target.src = "https://via.placeholder.com/150?text=No+Image"}} // Fallback khi lỗi ảnh
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">{item.name}</h3>
                          {/* Logic hiển thị icon Flame ngẫu nhiên hoặc dựa trên field 'is_spicy' nếu có trong DB */}
                          {item.id % 5 === 0 && <Flame size={14} className="text-orange-500 fill-orange-500 ml-2 shrink-0" />}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        {/* Format giá tiền */}
                        <span className="text-xl font-black text-white">${parseFloat(item.price).toFixed(2)}</span>
                        <button 
                          onClick={(e) => handleAddToCart(e, item)}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-lg active:scale-90 relative ${
                            addedItems.has(item.id)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-neutral-800 border-white/10 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500'
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