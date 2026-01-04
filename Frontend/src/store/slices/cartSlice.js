import { createSlice } from '@reduxjs/toolkit';

// Lấy cart từ localStorage
const getInitialCart = () => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    return [];
  }
};

const initialState = {
  items: getInitialCart(),
  totalItems: getInitialCart().reduce((sum, item) => sum + item.quantity, 0),
  totalPrice: getInitialCart().reduce((sum, item) => sum + (item.price * item.quantity), 0),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      // Tìm item giống với cùng modifiers
      const existingItem = state.items.find(i => 
        i.id === item.id && 
        JSON.stringify(i.modifiers || {}) === JSON.stringify(item.modifiers || {})
      );
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1, modifiers: item.modifiers || {} });
      }
      
      // Cập nhật totals
      state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
      state.totalPrice = state.items.reduce((sum, i) => {
        let itemPrice = i.price;
        // Tính thêm giá của modifiers nếu có
        if (i.modifiers) {
          // Logic tính giá modifiers sẽ được xử lý ở component
        }
        return sum + (itemPrice * i.quantity);
      }, 0);
      
      // Lưu vào localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      // Cập nhật totals
      state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
      state.totalPrice = state.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      // Lưu vào localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      
      if (item) {
        if (quantity <= 0) {
          // Xóa item nếu quantity <= 0
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantity = quantity;
        }
        
        // Cập nhật totals
        state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
        state.totalPrice = state.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Lưu vào localStorage
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    
    incrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find(i => i.id === itemId);
      
      if (item) {
        item.quantity += 1;
        
        // Cập nhật totals
        state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
        state.totalPrice = state.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Lưu vào localStorage
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    
    decrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find(i => i.id === itemId);
      
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          // Xóa item nếu quantity = 1
          state.items = state.items.filter(i => i.id !== itemId);
        }
        
        // Cập nhật totals
        state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
        state.totalPrice = state.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        
        // Lưu vào localStorage
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      
      // Xóa khỏi localStorage
      localStorage.removeItem('cart');
    },
    
    // Load cart từ server (nếu user đã login)
    loadCart: (state, action) => {
      state.items = action.payload || [];
      state.totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
      state.totalPrice = state.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      // Lưu vào localStorage
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    
    // Update modifiers cho một item trong cart
    updateItemModifiers: (state, action) => {
      const { itemIndex, modifiers } = action.payload;
      if (state.items[itemIndex]) {
        state.items[itemIndex].modifiers = modifiers;
        
        // Lưu vào localStorage
        localStorage.setItem('cart', JSON.stringify(state.items));
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  loadCart,
  updateItemModifiers,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectTotalItems = (state) => state.cart.totalItems;
export const selectTotalPrice = (state) => state.cart.totalPrice;
export const selectCartItemById = (id) => (state) => 
  state.cart.items.find(item => item.id === id);
