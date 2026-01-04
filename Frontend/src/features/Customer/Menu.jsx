import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShoppingBag, Star, Flame } from 'lucide-react';

// --- MOCK DATA (Giữ nguyên) ---
const mockMenuData = [
  // --- APPETIZERS (Khai vị) ---
  { id: 1, name: 'Buffalo Wings', category: 'Appetizers', price: 12.99, description: 'Cánh gà chiên giòn sốt cay Buffalo kèm sốt phô mai xanh.', image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400' },
  { id: 2, name: 'Mozzarella Sticks', category: 'Appetizers', price: 9.99, description: 'Phô mai que chiên giòn tan, ăn kèm sốt Marinara.', image: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400' },
  { id: 3, name: 'Loaded Nachos', category: 'Appetizers', price: 11.99, description: 'Bánh Tortilla phủ phô mai nóng chảy, ớt Jalapeños và bò băm.', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400' },
  { id: 4, name: 'Crispy Calamari', category: 'Appetizers', price: 13.99, description: 'Mực vòng tẩm bột chiên giòn với sốt Tartar chanh.', image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400' },
  { id: 5, name: 'Spinach Artichoke Dip', category: 'Appetizers', price: 10.99, description: 'Sốt kem rau chân vịt và atiso nóng hổi kèm bánh mì nướng.', image: 'https://images.unsplash.com/photo-1576515652031-fc429bab6503?w=400' },
  { id: 6, name: 'Garlic Butter Shrimp', category: 'Appetizers', price: 14.99, description: 'Tôm áp chảo sốt bơ tỏi và thảo mộc thơm lừng.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400' },
  { id: 7, name: 'Bruschetta', category: 'Appetizers', price: 8.99, description: 'Bánh mì nướng kiểu Ý với cà chua tươi, húng quế và dầu ô liu.', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400' },

  // --- SALADS (Salad) ---
  { id: 10, name: 'Caesar Salad', category: 'Salads', price: 10.99, description: 'Xà lách Romaine, bánh mì nướng croutons, phô mai Parmesan.', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400' },
  { id: 11, name: 'Greek Salad', category: 'Salads', price: 11.99, description: 'Dưa leo, cà chua, ô liu Kalamata và phô mai Feta.', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400' },
  { id: 12, name: 'Cobb Salad', category: 'Salads', price: 13.99, description: 'Gà nướng, bơ, trứng luộc, thịt xông khói và phô mai xanh.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
  { id: 13, name: 'Quinoa Avocado Salad', category: 'Salads', price: 12.99, description: 'Hạt diêm mạch, bơ tươi, rau rocket và sốt chanh.', image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400' },

  // --- BURGERS (Bánh mì kẹp) ---
  { id: 24, name: 'Classic Cheeseburger', category: 'Burgers', price: 13.99, description: 'Bò Mỹ nướng lửa, phô mai Cheddar, rau xà lách, cà chua.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
  { id: 25, name: 'Bacon Burger', category: 'Burgers', price: 15.49, description: 'Burger bò đúp thịt với thịt xông khói giòn rụm.', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
  { id: 26, name: 'BBQ Burger', category: 'Burgers', price: 14.99, description: 'Sốt BBQ khói, hành tây chiên giòn và phô mai Mỹ.', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' },
  { id: 27, name: 'Mushroom Swiss', category: 'Burgers', price: 14.99, description: 'Nấm xào bơ tỏi và phô mai Swiss tan chảy.', image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400' },
  { id: 28, name: 'Spicy Jalapeño Burger', category: 'Burgers', price: 15.99, description: 'Burger kẹp ớt Jalapeño cay nồng và sốt chipotle.', image: 'https://images.unsplash.com/photo-1619250906756-324d081b203c?w=400' },
  { id: 29, name: 'Veggie Burger', category: 'Burgers', price: 12.99, description: 'Nhân thực vật nướng, bơ và rau mầm (Chay).', image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400' },

  // --- STEAKS (Bít tết) ---
  { id: 32, name: 'Ribeye Steak', category: 'Steaks', price: 32.99, description: 'Thăn lưng bò 12oz nướng, vân mỡ hoàn hảo.', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400' },
  { id: 33, name: 'Filet Mignon', category: 'Steaks', price: 38.99, description: 'Thăn nội bò 8oz siêu mềm với bơ thảo mộc.', image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400' },
  { id: 34, name: 'New York Strip', category: 'Steaks', price: 29.99, description: 'Thăn ngoại bò nướng tiêu đen đậm đà.', image: 'https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=400' },
  { id: 35, name: 'T-Bone Steak', category: 'Steaks', price: 35.99, description: 'Sự kết hợp hoàn hảo giữa thăn nội và thăn ngoại.', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400' },
  { id: 36, name: 'Tomahawk Ribeye', category: 'Steaks', price: 89.99, description: 'Bò Tomahawk khổng lồ dành cho 2 người ăn.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },

  // --- PASTA (Mì Ý) ---
  { id: 39, name: 'Fettuccine Alfredo', category: 'Pasta', price: 16.99, description: 'Sốt kem phô mai Parmesan béo ngậy.', image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400' },
  { id: 40, name: 'Spaghetti Bolognese', category: 'Pasta', price: 15.99, description: 'Mì Ý sốt bò băm cà chua truyền thống.', image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400' },
  { id: 41, name: 'Carbonara', category: 'Pasta', price: 17.49, description: 'Sốt trứng, phô mai Pecorino và thịt heo muối Guanciale.', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400' },
  { id: 42, name: 'Seafood Marinara', category: 'Pasta', price: 21.99, description: 'Mì Ý hải sản với tôm, mực, vẹm xanh sốt cà chua.', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400' },
  { id: 43, name: 'Pesto Penne', category: 'Pasta', price: 16.49, description: 'Nui Penne sốt húng tây hạt thông và gà nướng.', image: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400' },
  { id: 44, name: 'Lasagna', category: 'Pasta', price: 18.99, description: 'Mì lá nướng lớp với sốt thịt bò và phô mai Mozzarella.', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400' },

  // --- SEAFOOD (Hải sản) ---
  { id: 47, name: 'Grilled Salmon', category: 'Seafood', price: 24.99, description: 'Cá hồi Atlantic nướng sốt bơ chanh.', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400' },
  { id: 48, name: 'Fish and Chips', category: 'Seafood', price: 16.99, description: 'Cá Tuyết tẩm bia chiên giòn kèm khoai tây chiên.', image: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=400' },
  { id: 49, name: 'Lobster Tail', category: 'Seafood', price: 39.99, description: 'Đuôi tôm hùm Maine hấp bơ tỏi.', image: 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400' },
  { id: 50, name: 'Seared Tuna Steak', category: 'Seafood', price: 26.99, description: 'Cá ngừ đại dương áp chảo tái với vừng.', image: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=400' },
  { id: 51, name: 'Shrimp Scampi', category: 'Seafood', price: 22.99, description: 'Tôm sốt bơ tỏi chanh ăn kèm bánh mì.', image: 'https://images.unsplash.com/photo-1624823180482-1e699b6416e9?w=400' },

  // --- PIZZA (Pizza) ---
  { id: 54, name: 'Margherita Pizza', category: 'Pizza', price: 14.99, description: 'Cà chua San Marzano, phô mai Mozzarella, húng quế.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
  { id: 55, name: 'Pepperoni Pizza', category: 'Pizza', price: 16.49, description: 'Pizza xúc xích cay Pepperoni truyền thống.', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
  { id: 56, name: 'BBQ Chicken Pizza', category: 'Pizza', price: 17.99, description: 'Gà nướng, hành tím, ngò rí và sốt BBQ.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
  { id: 57, name: 'Hawaiian Pizza', category: 'Pizza', price: 16.99, description: 'Thịt nguội, dứa tươi và phô mai.', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400' },
  { id: 58, name: 'Four Cheese Pizza', category: 'Pizza', price: 15.99, description: 'Mozzarella, Gorgonzola, Parmesan và Provolone.', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },

  // --- DESSERTS (Tráng miệng) ---
  { id: 60, name: 'NY Cheesecake', category: 'Desserts', price: 8.99, description: 'Bánh phô mai kiểu New York kèm sốt dâu.', image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400' },
  { id: 61, name: 'Chocolate Lava Cake', category: 'Desserts', price: 9.49, description: 'Bánh sô-cô-la nóng chảy nhân ăn kèm kem vani.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' },
  { id: 62, name: 'Tiramisu', category: 'Desserts', price: 8.99, description: 'Bánh tráng miệng Ý hương cà phê và rượu Rum.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
  { id: 63, name: 'Apple Pie', category: 'Desserts', price: 7.99, description: 'Bánh táo nướng quế truyền thống Mỹ.', image: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=400' },
  { id: 64, name: 'Brownie Sundae', category: 'Desserts', price: 8.49, description: 'Brownie hạt óc chó, kem tươi và sốt sô-cô-la.', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },

  // --- BEVERAGES (Đồ uống không cồn) ---
  { id: 66, name: 'Coca Cola', category: 'Beverages', price: 2.99, description: 'Nước ngọt có ga.', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400' },
  { id: 67, name: 'Fresh Lemonade', category: 'Beverages', price: 3.99, description: 'Nước chanh tươi pha thủ công.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
  { id: 68, name: 'Iced Coffee', category: 'Beverages', price: 4.49, description: 'Cà phê đá xay ủ lạnh.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b5dd7359?w=400' },
  { id: 69, name: 'Strawberry Milkshake', category: 'Beverages', price: 5.99, description: 'Sữa lắc kem dâu tây tươi.', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400' },
  { id: 70, name: 'Mango Smoothie', category: 'Beverages', price: 5.99, description: 'Sinh tố xoài nhiệt đới.', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400' },
  { id: 71, name: 'Iced Tea', category: 'Beverages', price: 2.99, description: 'Trà chanh sả đá lạnh.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400' },

  // --- ALCOHOL (Đồ uống có cồn) ---
  { id: 80, name: 'Craft Beer', category: 'Alcohol', price: 6.99, description: 'Bia thủ công IPA hương cam chanh.', image: 'https://images.unsplash.com/photo-1586993451228-0971cd963ddc?w=400' },
  { id: 81, name: 'House Red Wine', category: 'Alcohol', price: 8.99, description: 'Rượu vang đỏ Cabernet Sauvignon (Ly).', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400' },
  { id: 82, name: 'Classic Mojito', category: 'Alcohol', price: 9.99, description: 'Rum, bạc hà, chanh tươi và soda.', image: 'https://images.unsplash.com/photo-1551538827-9c037cb485da?w=400' },
  { id: 83, name: 'Margarita', category: 'Alcohol', price: 10.99, description: 'Tequila, rượu cam Cointreau và muối viền.', image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400' },
  { id: 84, name: 'Old Fashioned', category: 'Alcohol', price: 12.99, description: 'Whiskey Bourbon, đường nâu và vỏ cam.', image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400' },
];
const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('Appetizers'); // Category đang được highlight
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const scrollContainerRef = useRef(null); // Ref cho thanh menu ngang
  const categoryRefs = useRef({}); // Ref cho từng khu vực món ăn (để cuộn tới)

  // Lấy danh sách Categories
  const categories = useMemo(() => ['All', ...new Set(mockMenuData.map(item => item.category))], []);

  // --- 1. XỬ LÝ SCROLL SPY (Cuộn tới đâu sáng tới đó) ---
  useEffect(() => {
    const handleScroll = () => {
      // Logic Scroll Spy
      // Lấy vị trí scroll hiện tại + offset (để trừ hao chiều cao header)
      const scrollPosition = window.scrollY + 200; 

      // Duyệt qua từng section để xem mình đang đứng ở đâu
      for (const category of categories) {
        if (category === 'All') continue;
        const element = categoryRefs.current[category];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(category);
            
            // Tự động cuộn thanh menu ngang để nút active luôn hiện ra
            const btn = document.getElementById(`btn-${category}`);
            if (btn && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({
                left: btn.offsetLeft - 100, // Căn giữa một chút
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

  // --- 2. XỬ LÝ CLICK VÀO CATEGORY ---
  const handleCategoryClick = (category) => {
    if (category === 'All') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveCategory('All');
      return;
    }
    
    setActiveCategory(category);
    const element = categoryRefs.current[category];
    if (element) {
      // Cuộn tới section đó, trừ đi chiều cao của Header
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- 3. LOGIC LỌC DỮ LIỆU ---
  // Thay vì lọc mất category, ta sẽ giữ nguyên cấu trúc Category -> Món ăn
  // Chỉ lọc món ăn bên trong. Nếu category nào hết món (do search) thì ẩn đi.
  const categorizedMenu = useMemo(() => {
    // Lấy danh sách category cần hiển thị (trừ 'All')
    const cats = categories.filter(c => c !== 'All');
    
    return cats.map(cat => {
      const items = mockMenuData.filter(item => 
        item.category === cat && 
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return { category: cat, items };
    }).filter(group => group.items.length > 0); // Chỉ lấy nhóm nào có món
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* --- HEADER (STICKY) --- */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/98 backdrop-blur-2xl shadow-2xl py-4">
        
        {/* Search & Categories */}
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

          {/* Categories Bar */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 select-none scroll-smooth"
          >
            {categories.filter(c => c !== 'All').map(category => (
              <button
                key={category}
                id={`btn-${category}`}
                onClick={() => handleCategoryClick(category)}
                className={`whitespace-nowrap rounded-full font-bold tracking-wide transition-all duration-300 ease-out border shrink-0 px-4 py-1.5 text-xs ${
                  activeCategory === category
                    ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-105'
                    : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white hover:scale-105'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- MENU SECTIONS (Danh sách món theo nhóm) --- */}
      <div className="container mx-auto max-w-5xl px-4 pt-4">
        
        {categorizedMenu.length > 0 ? (
          categorizedMenu.map((group) => (
            <div 
              key={group.category} 
              ref={(el) => (categoryRefs.current[group.category] = el)} // Gán Ref để theo dõi
              className="mb-12 scroll-mt-32" // scroll-mt để khi cuộn tới nó không bị header che mất
            >
              {/* Tên danh mục (Header của Section) */}
              <div className="flex items-center gap-4 mb-6 sticky top-0">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500 uppercase tracking-tight">
                  {group.category}
                </h2>
                <div className="h-px flex-1 bg-linear-to-r from-orange-500/50 to-transparent"></div>
              </div>

              {/* Grid Món ăn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                {group.items.map(item => (
                  <div key={item.id} className="group flex gap-4 bg-transparent hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/5">
                    
                    {/* Ảnh món (Nhỏ gọn bên trái - Kiểu List View) */}
                    <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">{item.name}</h3>
                          {item.id % 2 === 0 && <Flame size={14} className="text-orange-500 fill-orange-500 ml-2 shrink-0" />}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      </div>

                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xl font-black text-white">${item.price.toFixed(2)}</span>
                        
                        <button className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-lg active:scale-90">
                           <ShoppingBag size={18} />
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
    </div>
  );
};

export default Menu;