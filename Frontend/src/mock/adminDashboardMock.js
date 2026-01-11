export const adminDashboardMock = {
  stats: {
    totalTables: 28,
    totalUsers: 1240,
    revenueThisMonth: 186_540_000, // VND
  },

  topOrderedDishes: [
    { id: "D01", name: "Ribeye Steak", category: "Món Chính", orders: 342 },
    {
      id: "D02",
      name: "Grilled Salmon",
      category: "Món Đặc Biệt",
      orders: 298,
    },
    { id: "D03", name: "Truffle Pasta", category: "Món Đặc Biệt", orders: 271 },
    { id: "D04", name: "BBQ Ribs Combo", category: "Combo", orders: 233 },
    { id: "D05", name: "Seafood Platter", category: "Combo", orders: 190 },
  ],

  topRatedDishes: [
    {
      id: "R01",
      name: "Lobster Tail",
      category: "Món Cao Cấp",
      rating: 4.9,
      reviews: 178,
    },
    {
      id: "R02",
      name: "Ribeye Steak",
      category: "Món Chính",
      rating: 4.8,
      reviews: 412,
    },
    {
      id: "R03",
      name: "Grilled Salmon",
      category: "Món Đặc Biệt",
      rating: 4.7,
      reviews: 301,
    },
    {
      id: "R04",
      name: "Truffle Pasta",
      category: "Món Đặc Biệt",
      rating: 4.7,
      reviews: 259,
    },
    {
      id: "R05",
      name: "Seafood Platter",
      category: "Combo",
      rating: 4.6,
      reviews: 144,
    },
  ],
};
