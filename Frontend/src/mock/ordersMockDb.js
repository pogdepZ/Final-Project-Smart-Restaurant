// Mock DB (in-memory) + helpers để fake “đơn mới”
const now = Date.now();

export const ordersMockDb = [
  {
    id: "OD-10021",
    status: "pending",
    tableNumber: "T05",
    createdAt: now - 2 * 60 * 1000,
    note: "Ít cay giúp em",
    items: [
      { name: "Ribeye Steak", qty: 1, price: 329900 },
      { name: "Truffle Pasta", qty: 1, price: 219900 },
    ],
  },
  {
    id: "OD-10020",
    status: "accepted",
    tableNumber: "T02",
    createdAt: now - 10 * 60 * 1000,
    note: "",
    items: [{ name: "Grilled Salmon", qty: 2, price: 249900 }],
  },
  {
    id: "OD-10019",
    status: "rejected",
    tableNumber: "T11",
    createdAt: now - 18 * 60 * 1000,
    note: "Không hành",
    items: [{ name: "BBQ Ribs Combo", qty: 1, price: 289900 }],
  },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createRandomOrder() {
  const id = `OD-${10000 + Math.floor(Math.random() * 9000)}`;
  const table = `T${String(1 + Math.floor(Math.random() * 12)).padStart(
    2,
    "0"
  )}`;

  const menu = [
    { name: "Ribeye Steak", price: 329900 },
    { name: "Grilled Salmon", price: 249900 },
    { name: "Truffle Pasta", price: 219900 },
    { name: "BBQ Ribs Combo", price: 289900 },
    { name: "Seafood Platter", price: 459900 },
  ];

  const itemsCount = 1 + Math.floor(Math.random() * 3);
  const items = Array.from({ length: itemsCount }).map(() => {
    const m = pick(menu);
    return {
      name: m.name,
      price: m.price,
      qty: 1 + Math.floor(Math.random() * 2),
    };
  });

  return {
    id,
    status: "pending",
    tableNumber: table,
    createdAt: Date.now(),
    note: Math.random() < 0.3 ? "Không đá" : "",
    items,
  };
}
