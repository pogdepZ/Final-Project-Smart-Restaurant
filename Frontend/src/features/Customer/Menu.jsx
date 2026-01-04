import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  Filter,
  ShoppingBag,
  Star,
  Flame,
  ChevronDown,
} from "lucide-react";

// --- MOCK DATA (Dữ liệu giả lập) ---
const mockMenuData = [
  // --- APPETIZERS (Khai vị) ---
  {
    id: 1,
    name: "Buffalo Wings",
    category: "Appetizers",
    price: 12.99,
    description: "Cánh gà chiên giòn sốt cay Buffalo kèm sốt phô mai xanh.",
    image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400",
  },
  {
    id: 2,
    name: "Mozzarella Sticks",
    category: "Appetizers",
    price: 9.99,
    description: "Phô mai que chiên giòn tan, ăn kèm sốt Marinara.",
    image: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400",
  },
  {
    id: 3,
    name: "Loaded Nachos",
    category: "Appetizers",
    price: 11.99,
    description: "Bánh Tortilla phủ phô mai nóng chảy, ớt Jalapeños và bò băm.",
    image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400",
  },
  {
    id: 4,
    name: "Crispy Calamari",
    category: "Appetizers",
    price: 13.99,
    description: "Mực vòng tẩm bột chiên giòn với sốt Tartar chanh.",
    image: "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400",
  },
  {
    id: 5,
    name: "Spinach Artichoke Dip",
    category: "Appetizers",
    price: 10.99,
    description: "Sốt kem rau chân vịt và atiso nóng hổi kèm bánh mì nướng.",
    image: "https://images.unsplash.com/photo-1576515652031-fc429bab6503?w=400",
  },
  {
    id: 6,
    name: "Garlic Butter Shrimp",
    category: "Appetizers",
    price: 14.99,
    description: "Tôm áp chảo sốt bơ tỏi và thảo mộc thơm lừng.",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400",
  },
  {
    id: 7,
    name: "Bruschetta",
    category: "Appetizers",
    price: 8.99,
    description:
      "Bánh mì nướng kiểu Ý với cà chua tươi, húng quế và dầu ô liu.",
    image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400",
  },

  // --- SALADS (Salad) ---
  {
    id: 10,
    name: "Caesar Salad",
    category: "Salads",
    price: 10.99,
    description: "Xà lách Romaine, bánh mì nướng croutons, phô mai Parmesan.",
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400",
  },
  {
    id: 11,
    name: "Greek Salad",
    category: "Salads",
    price: 11.99,
    description: "Dưa leo, cà chua, ô liu Kalamata và phô mai Feta.",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
  },
  {
    id: 12,
    name: "Cobb Salad",
    category: "Salads",
    price: 13.99,
    description: "Gà nướng, bơ, trứng luộc, thịt xông khói và phô mai xanh.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  },
  {
    id: 13,
    name: "Quinoa Avocado Salad",
    category: "Salads",
    price: 12.99,
    description: "Hạt diêm mạch, bơ tươi, rau rocket và sốt chanh.",
    image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400",
  },

  // --- BURGERS (Bánh mì kẹp) ---
  {
    id: 24,
    name: "Classic Cheeseburger",
    category: "Burgers",
    price: 13.99,
    description: "Bò Mỹ nướng lửa, phô mai Cheddar, rau xà lách, cà chua.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
  },
  {
    id: 25,
    name: "Bacon Burger",
    category: "Burgers",
    price: 15.49,
    description: "Burger bò đúp thịt với thịt xông khói giòn rụm.",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400",
  },
  {
    id: 26,
    name: "BBQ Burger",
    category: "Burgers",
    price: 14.99,
    description: "Sốt BBQ khói, hành tây chiên giòn và phô mai Mỹ.",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400",
  },
  {
    id: 27,
    name: "Mushroom Swiss",
    category: "Burgers",
    price: 14.99,
    description: "Nấm xào bơ tỏi và phô mai Swiss tan chảy.",
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400",
  },
  {
    id: 28,
    name: "Spicy Jalapeño Burger",
    category: "Burgers",
    price: 15.99,
    description: "Burger kẹp ớt Jalapeño cay nồng và sốt chipotle.",
    image: "https://images.unsplash.com/photo-1619250906756-324d081b203c?w=400",
  },
  {
    id: 29,
    name: "Veggie Burger",
    category: "Burgers",
    price: 12.99,
    description: "Nhân thực vật nướng, bơ và rau mầm (Chay).",
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400",
  },

  // --- STEAKS (Bít tết) ---
  {
    id: 32,
    name: "Ribeye Steak",
    category: "Steaks",
    price: 32.99,
    description: "Thăn lưng bò 12oz nướng, vân mỡ hoàn hảo.",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400",
  },
  {
    id: 33,
    name: "Filet Mignon",
    category: "Steaks",
    price: 38.99,
    description: "Thăn nội bò 8oz siêu mềm với bơ thảo mộc.",
    image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400",
  },
  {
    id: 34,
    name: "New York Strip",
    category: "Steaks",
    price: 29.99,
    description: "Thăn ngoại bò nướng tiêu đen đậm đà.",
    image: "https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?w=400",
  },
  {
    id: 35,
    name: "T-Bone Steak",
    category: "Steaks",
    price: 35.99,
    description: "Sự kết hợp hoàn hảo giữa thăn nội và thăn ngoại.",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400",
  },
  {
    id: 36,
    name: "Tomahawk Ribeye",
    category: "Steaks",
    price: 89.99,
    description: "Bò Tomahawk khổng lồ dành cho 2 người ăn.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
  },

  // --- PASTA (Mì Ý) ---
  {
    id: 39,
    name: "Fettuccine Alfredo",
    category: "Pasta",
    price: 16.99,
    description: "Sốt kem phô mai Parmesan béo ngậy.",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400",
  },
  {
    id: 40,
    name: "Spaghetti Bolognese",
    category: "Pasta",
    price: 15.99,
    description: "Mì Ý sốt bò băm cà chua truyền thống.",
    image: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400",
  },
  {
    id: 41,
    name: "Carbonara",
    category: "Pasta",
    price: 17.49,
    description: "Sốt trứng, phô mai Pecorino và thịt heo muối Guanciale.",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400",
  },
  {
    id: 42,
    name: "Seafood Marinara",
    category: "Pasta",
    price: 21.99,
    description: "Mì Ý hải sản với tôm, mực, vẹm xanh sốt cà chua.",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400",
  },
  {
    id: 43,
    name: "Pesto Penne",
    category: "Pasta",
    price: 16.49,
    description: "Nui Penne sốt húng tây hạt thông và gà nướng.",
    image: "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400",
  },
  {
    id: 44,
    name: "Lasagna",
    category: "Pasta",
    price: 18.99,
    description: "Mì lá nướng lớp với sốt thịt bò và phô mai Mozzarella.",
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400",
  },

  // --- SEAFOOD (Hải sản) ---
  {
    id: 47,
    name: "Grilled Salmon",
    category: "Seafood",
    price: 24.99,
    description: "Cá hồi Atlantic nướng sốt bơ chanh.",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
  },
  {
    id: 48,
    name: "Fish and Chips",
    category: "Seafood",
    price: 16.99,
    description: "Cá Tuyết tẩm bia chiên giòn kèm khoai tây chiên.",
    image: "https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=400",
  },
  {
    id: 49,
    name: "Lobster Tail",
    category: "Seafood",
    price: 39.99,
    description: "Đuôi tôm hùm Maine hấp bơ tỏi.",
    image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400",
  },
  {
    id: 50,
    name: "Seared Tuna Steak",
    category: "Seafood",
    price: 26.99,
    description: "Cá ngừ đại dương áp chảo tái với vừng.",
    image: "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=400",
  },
  {
    id: 51,
    name: "Shrimp Scampi",
    category: "Seafood",
    price: 22.99,
    description: "Tôm sốt bơ tỏi chanh ăn kèm bánh mì.",
    image: "https://images.unsplash.com/photo-1624823180482-1e699b6416e9?w=400",
  },

  // --- PIZZA (Pizza) ---
  {
    id: 54,
    name: "Margherita Pizza",
    category: "Pizza",
    price: 14.99,
    description: "Cà chua San Marzano, phô mai Mozzarella, húng quế.",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
  },
  {
    id: 55,
    name: "Pepperoni Pizza",
    category: "Pizza",
    price: 16.49,
    description: "Pizza xúc xích cay Pepperoni truyền thống.",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
  },
  {
    id: 56,
    name: "BBQ Chicken Pizza",
    category: "Pizza",
    price: 17.99,
    description: "Gà nướng, hành tím, ngò rí và sốt BBQ.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
  },
  {
    id: 57,
    name: "Hawaiian Pizza",
    category: "Pizza",
    price: 16.99,
    description: "Thịt nguội, dứa tươi và phô mai.",
    image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400",
  },
  {
    id: 58,
    name: "Four Cheese Pizza",
    category: "Pizza",
    price: 15.99,
    description: "Mozzarella, Gorgonzola, Parmesan và Provolone.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
  },

  // --- DESSERTS (Tráng miệng) ---
  {
    id: 60,
    name: "NY Cheesecake",
    category: "Desserts",
    price: 8.99,
    description: "Bánh phô mai kiểu New York kèm sốt dâu.",
    image: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400",
  },
  {
    id: 61,
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 9.49,
    description: "Bánh sô-cô-la nóng chảy nhân ăn kèm kem vani.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
  },
  {
    id: 62,
    name: "Tiramisu",
    category: "Desserts",
    price: 8.99,
    description: "Bánh tráng miệng Ý hương cà phê và rượu Rum.",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
  },
  {
    id: 63,
    name: "Apple Pie",
    category: "Desserts",
    price: 7.99,
    description: "Bánh táo nướng quế truyền thống Mỹ.",
    image: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=400",
  },
  {
    id: 64,
    name: "Brownie Sundae",
    category: "Desserts",
    price: 8.49,
    description: "Brownie hạt óc chó, kem tươi và sốt sô-cô-la.",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400",
  },

  // --- BEVERAGES (Đồ uống không cồn) ---
  {
    id: 66,
    name: "Coca Cola",
    category: "Beverages",
    price: 2.99,
    description: "Nước ngọt có ga.",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400",
  },
  {
    id: 67,
    name: "Fresh Lemonade",
    category: "Beverages",
    price: 3.99,
    description: "Nước chanh tươi pha thủ công.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400",
  },
  {
    id: 68,
    name: "Iced Coffee",
    category: "Beverages",
    price: 4.49,
    description: "Cà phê đá xay ủ lạnh.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b5dd7359?w=400",
  },
  {
    id: 69,
    name: "Strawberry Milkshake",
    category: "Beverages",
    price: 5.99,
    description: "Sữa lắc kem dâu tây tươi.",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
  },
  {
    id: 70,
    name: "Mango Smoothie",
    category: "Beverages",
    price: 5.99,
    description: "Sinh tố xoài nhiệt đới.",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400",
  },
  {
    id: 71,
    name: "Iced Tea",
    category: "Beverages",
    price: 2.99,
    description: "Trà chanh sả đá lạnh.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
  },

  // --- ALCOHOL (Đồ uống có cồn) ---
  {
    id: 80,
    name: "Craft Beer",
    category: "Alcohol",
    price: 6.99,
    description: "Bia thủ công IPA hương cam chanh.",
    image: "https://images.unsplash.com/photo-1586993451228-0971cd963ddc?w=400",
  },
  {
    id: 81,
    name: "House Red Wine",
    category: "Alcohol",
    price: 8.99,
    description: "Rượu vang đỏ Cabernet Sauvignon (Ly).",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400",
  },
  {
    id: 82,
    name: "Classic Mojito",
    category: "Alcohol",
    price: 9.99,
    description: "Rum, bạc hà, chanh tươi và soda.",
    image: "https://images.unsplash.com/photo-1551538827-9c037cb485da?w=400",
  },
  {
    id: 83,
    name: "Margarita",
    category: "Alcohol",
    price: 10.99,
    description: "Tequila, rượu cam Cointreau và muối viền.",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400",
  },
  {
    id: 84,
    name: "Old Fashioned",
    category: "Alcohol",
    price: 12.99,
    description: "Whiskey Bourbon, đường nâu và vỏ cam.",
    image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400",
  },
];

const Menu = () => {
  // State quản lý Filter & Sort
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");

  // State & Ref quản lý Drag-to-Scroll (Kéo để cuộn)
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // --- LOGIC KÉO CHUỘT (DRAG) ---
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Tốc độ kéo (số càng lớn kéo càng nhanh)
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  // --------------------------------

  // Lấy danh sách Categories duy nhất
  const categories = [
    "All",
    ...new Set(mockMenuData.map((item) => item.category)),
  ];

  // Logic Lọc và Sắp xếp
  const filteredAndSortedMenu = useMemo(() => {
    let result = mockMenuData;

    // 1. Lọc theo Category
    if (selectedCategory !== "All") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // 2. Lọc theo Tìm kiếm
    if (searchQuery.trim()) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 3. Sắp xếp
    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [selectedCategory, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24 font-sans selection:bg-orange-500 selection:text-white">
      {/* --- HEADER (Sticky) --- */}
      <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-lg border-b border-white/5 pb-4">
        <div className="px-5 py-6 flex flex-col items-center">
          <div className="w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-center">
            THỰC ĐƠN <span className="text-orange-500">THƯỢNG HẠNG</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-light tracking-widest uppercase">
            Premium Dining Experience
          </p>
        </div>

        <div className="px-4 container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-neutral-800 transition-all shadow-lg"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-45">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none">
                <Filter size={18} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-10 text-white focus:outline-none focus:border-orange-500/50 cursor-pointer hover:bg-neutral-800 transition-colors"
              >
                <option value="default">Mặc định</option>
                <option value="price-low">Giá: Thấp đến Cao</option>
                <option value="price-high">Giá: Cao đến Thấp</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* --- DRAGGABLE CATEGORIES (Nắm kéo) --- */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseUpOrLeave}
            onMouseUp={handleMouseUpOrLeave}
            onMouseMove={handleMouseMove}
            className={`
              mt-6 flex gap-3 
              overflow-x-auto scrollbar-hide  /* Quan trọng: Ẩn scrollbar */
              pb-4 pt-2 select-none snap-x
              ${isDragging ? "cursor-grabbing" : "cursor-grab"}
            `}
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  if (!isDragging) setSelectedCategory(category);
                }}
                className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 border shrink-0 ${
                  selectedCategory === category
                    ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] transform scale-105"
                    : "bg-neutral-900 border-neutral-800 text-gray-400 hover:border-orange-500/50 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- MENU GRID (Danh sách món) --- */}
      <div className="container mx-auto max-w-7xl px-4 pt-8">
        <div className="mb-6 flex items-end gap-2 text-gray-400">
          <span className="text-3xl font-bold text-white">
            {filteredAndSortedMenu.length}
          </span>
          <span className="pb-1 text-sm">món ăn được tìm thấy</span>
        </div>

        {filteredAndSortedMenu.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {filteredAndSortedMenu.map((item) => (
              <div
                key={item.id}
                className="group relative bg-neutral-900 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 flex flex-col"
              >
                {/* Image Area */}
                <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                  {/* Ảnh */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Gradient Mask: Tạo hiệu ứng hòa vào nền đen */}
                  <div className="absolute inset-0 bg-linear-to-t from-neutral-900 via-neutral-900/40 to-transparent opacity-90"></div>

                  {/* Badge */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-orange-400 uppercase tracking-wider">
                    {item.category}
                  </div>

                  {/* Icon Like */}
                  <button className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-gray-300 hover:text-red-500 hover:bg-white transition-all">
                    <Star size={16} />
                  </button>
                </div>

                {/* Content Area */}
                <div className="relative z-10 p-5 -mt-12 flex-1 flex flex-col">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-white leading-tight group-hover:text-orange-500 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    {/* Giả lập Bestseller cho một số món */}
                    {item.id % 3 === 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <Flame
                          size={14}
                          className="text-orange-500 fill-orange-500"
                        />
                        <span className="text-xs text-orange-400 font-medium">
                          Bestseller
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-6 flex-1 font-light">
                    {item.description}
                  </p>

                  {/* Footer Card: Giá & Nút Mua */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase font-bold">
                        Giá bán
                      </span>
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <button className="h-12 w-12 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/30 transition-transform active:scale-90 group-hover:rotate-90">
                      <ShoppingBag size={22} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Không tìm thấy món ăn
            </h3>
            <p className="text-gray-400">
              Thử tìm từ khóa khác hoặc thay đổi bộ lọc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
