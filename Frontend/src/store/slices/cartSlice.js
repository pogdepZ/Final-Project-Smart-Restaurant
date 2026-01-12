import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartApi } from "../../services/cartApi";

// ===== localStorage helpers =====
const LS_KEY = "cart";

const getInitialCart = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (items) => {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
};

const calcTotals = (items) => {
  const totalItems = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );
  return { totalItems, totalPrice };
};

// ===== initial state =====
const initialItems = getInitialCart();
const totals = calcTotals(initialItems);

const initialState = {
  // ✅ local cart
  items: initialItems,
  totalItems: totals.totalItems,
  totalPrice: totals.totalPrice,

  // ✅ sync status
  syncing: false,
  syncError: null,

  // ✅ if you want to keep DB info after sync
  cartId: null,
};

// ✅ THUNK: chỉ chạy khi bấm "Đặt món ngay"
export const syncCartToDb = createAsyncThunk(
  "cart/syncCartToDb",
  async ({ qrToken }, { getState, rejectWithValue }) => {
    try {
      const { items } = getState().cart;

      // convert local item -> server payload
      const payload = {
        items: (items || []).map((i) => ({
          menuItemId: i.id, // local item.id = menu_items.id
          quantity: Number(i.quantity) || 1,
          modifiers: i.modifiers || [],
          note: i.note || "",
        })),
      };

      const res = await cartApi.sync(payload, qrToken); // { cart, items }
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // ✅ LOCAL add
    addToCartLocal: (state, action) => {
      const item = action.payload;

      // phân biệt theo modifiers
      const keyA = JSON.stringify(item.modifiers || []);
      const existing = state.items.find(
        (i) => i.id === item.id && JSON.stringify(i.modifiers || []) === keyA
      );

      if (existing) existing.quantity += 1;
      else state.items.push({ ...item, quantity: 1, modifiers: item.modifiers || [] });

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;

      persist(state.items);
    },

    removeFromCartLocal: (state, action) => {
      const { id, modifiers = [] } = action.payload || {};
      const keyA = JSON.stringify(modifiers);

      state.items = state.items.filter(
        (i) => !(i.id === id && JSON.stringify(i.modifiers || []) === keyA)
      );

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;

      persist(state.items);
    },

    incrementLocal: (state, action) => {
      const { id, modifiers = [] } = action.payload || {};
      const keyA = JSON.stringify(modifiers);
      const item = state.items.find(
        (i) => i.id === id && JSON.stringify(i.modifiers || []) === keyA
      );
      if (item) item.quantity += 1;

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;

      persist(state.items);
    },

    decrementLocal: (state, action) => {
      const { id, modifiers = [] } = action.payload || {};
      const keyA = JSON.stringify(modifiers);

      const item = state.items.find(
        (i) => i.id === id && JSON.stringify(i.modifiers || []) === keyA
      );
      if (!item) return;

      if (item.quantity > 1) item.quantity -= 1;
      else {
        state.items = state.items.filter(
          (i) => !(i.id === id && JSON.stringify(i.modifiers || []) === keyA)
        );
      }

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;

      persist(state.items);
    },

    clearCartLocal: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      localStorage.removeItem(LS_KEY);
    },

    clearSyncError: (state) => {
      state.syncError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncCartToDb.pending, (state) => {
        state.syncing = true;
        state.syncError = null;
      })
      .addCase(syncCartToDb.rejected, (state, action) => {
        state.syncing = false;
        state.syncError = action.payload?.message || "Sync failed";
      })
      .addCase(syncCartToDb.fulfilled, (state, action) => {
        state.syncing = false;
        state.syncError = null;

        // server trả { cart, items } -> bạn có thể lưu cartId nếu cần
        state.cartId = action.payload?.cart?.id || null;

        // ✅ Option: sau khi sync thì clear local cart (khuyên làm)
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
        localStorage.removeItem(LS_KEY);
      });
  },
});

export const {
  addToCartLocal,
  removeFromCartLocal,
  incrementLocal,
  decrementLocal,
  clearCartLocal,
  clearSyncError,
} = cartSlice.actions;

export default cartSlice.reducer;

// selectors
export const selectCartItems = (state) => state.cart.items;
export const selectTotalItems = (state) => state.cart.totalItems;
export const selectTotalPrice = (state) => state.cart.totalPrice;
export const selectSyncing = (state) => state.cart.syncing;
export const selectSyncError = (state) => state.cart.syncError;
export const selectCartId = (state) => state.cart.cartId;
