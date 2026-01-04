// Modifier Groups - Các nhóm tùy chọn
export const modifierGroups = {
  size: {
    id: 'size',
    name: 'Chọn size',
    min_selection: 1,
    max_selection: 1, // Radio button
    options: [
      { id: 'size_small', name: 'Nhỏ (S)', price_adjustment: 0 },
      { id: 'size_medium', name: 'Vừa (M)', price_adjustment: 2.00 },
      { id: 'size_large', name: 'Lớn (L)', price_adjustment: 4.00 },
    ]
  },
  
  doneness: {
    id: 'doneness',
    name: 'Độ chín',
    min_selection: 1,
    max_selection: 1,
    options: [
      { id: 'rare', name: 'Tái (Rare)', price_adjustment: 0 },
      { id: 'medium_rare', name: 'Tái vừa (Medium Rare)', price_adjustment: 0 },
      { id: 'medium', name: 'Vừa (Medium)', price_adjustment: 0 },
      { id: 'well_done', name: 'Chín kỹ (Well Done)', price_adjustment: 0 },
    ]
  },
  
  spicyLevel: {
    id: 'spicyLevel',
    name: 'Mức độ cay',
    min_selection: 0,
    max_selection: 1,
    options: [
      { id: 'not_spicy', name: 'Không cay', price_adjustment: 0 },
      { id: 'mild', name: 'Cay nhẹ', price_adjustment: 0 },
      { id: 'medium_spicy', name: 'Cay vừa', price_adjustment: 0 },
      { id: 'extra_spicy', name: 'Cay nặng', price_adjustment: 0.50 },
    ]
  },
  
  toppings: {
    id: 'toppings',
    name: 'Topping thêm',
    min_selection: 0,
    max_selection: 5, // Checkbox - có thể chọn nhiều
    options: [
      { id: 'cheese', name: 'Phô mai', price_adjustment: 1.50 },
      { id: 'bacon', name: 'Thịt xông khói', price_adjustment: 2.00 },
      { id: 'avocado', name: 'Bơ', price_adjustment: 2.50 },
      { id: 'egg', name: 'Trứng', price_adjustment: 1.00 },
      { id: 'mushroom', name: 'Nấm', price_adjustment: 1.50 },
      { id: 'jalapeno', name: 'Ớt jalapeño', price_adjustment: 1.00 },
    ]
  },
  
  sauces: {
    id: 'sauces',
    name: 'Sốt kèm theo',
    min_selection: 0,
    max_selection: 3,
    options: [
      { id: 'bbq', name: 'Sốt BBQ', price_adjustment: 0.50 },
      { id: 'ranch', name: 'Sốt Ranch', price_adjustment: 0.50 },
      { id: 'buffalo', name: 'Sốt Buffalo', price_adjustment: 0.50 },
      { id: 'honey_mustard', name: 'Sốt mật ong mù tạt', price_adjustment: 0.50 },
      { id: 'garlic_aioli', name: 'Sốt tỏi aioli', price_adjustment: 0.75 },
    ]
  },
  
  sides: {
    id: 'sides',
    name: 'Món ăn kèm',
    min_selection: 0,
    max_selection: 2,
    options: [
      { id: 'fries', name: 'Khoai tây chiên', price_adjustment: 3.00 },
      { id: 'salad', name: 'Salad', price_adjustment: 3.50 },
      { id: 'coleslaw', name: 'Coleslaw', price_adjustment: 2.50 },
      { id: 'mashed_potato', name: 'Khoai tây nghiền', price_adjustment: 3.00 },
      { id: 'grilled_veggies', name: 'Rau nướng', price_adjustment: 4.00 },
    ]
  },
  
  drinks: {
    id: 'drinks',
    name: 'Thêm đồ uống (Combo)',
    min_selection: 0,
    max_selection: 1,
    options: [
      { id: 'coke', name: 'Coca Cola', price_adjustment: 2.00 },
      { id: 'sprite', name: 'Sprite', price_adjustment: 2.00 },
      { id: 'iced_tea', name: 'Trà đá', price_adjustment: 1.50 },
      { id: 'orange_juice', name: 'Nước cam', price_adjustment: 3.00 },
    ]
  },
};

// Liên kết món ăn với các modifier groups
export const itemModifierGroups = {
  // Burgers
  24: ['size', 'toppings', 'sauces', 'sides', 'drinks'], // Classic Cheeseburger
  25: ['size', 'toppings', 'sauces', 'sides', 'drinks'], // Bacon Burger
  26: ['size', 'toppings', 'sides', 'drinks'], // BBQ Burger
  27: ['size', 'toppings', 'sauces', 'sides', 'drinks'], // Mushroom Swiss
  28: ['size', 'spicyLevel', 'toppings', 'sides', 'drinks'], // Spicy Jalapeño Burger
  29: ['size', 'toppings', 'sides', 'drinks'], // Veggie Burger
  
  // Steaks
  32: ['doneness', 'sides'], // Ribeye Steak
  33: ['doneness', 'sides'], // Filet Mignon
  34: ['doneness', 'sides'], // New York Strip
  35: ['doneness', 'sides'], // T-Bone Steak
  36: ['doneness', 'sides'], // Tomahawk Ribeye
  
  // Wings
  1: ['spicyLevel', 'sauces'], // Buffalo Wings
  
  // Pizza
  54: ['size'], // Margherita Pizza
  55: ['size', 'toppings'], // Pepperoni Pizza
  56: ['size', 'toppings'], // BBQ Chicken Pizza
  57: ['size'], // Hawaiian Pizza
  58: ['size', 'toppings'], // Four Cheese Pizza
};

// Helper function để lấy modifier groups cho một món
export const getModifierGroupsForItem = (itemId) => {
  const groupIds = itemModifierGroups[itemId] || [];
  return groupIds.map(groupId => modifierGroups[groupId]).filter(Boolean);
};
