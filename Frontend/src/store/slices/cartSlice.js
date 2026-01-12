// src/store/slices/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartApi } from "../../services/cartApi"; // <-- sửa path cho đúng

const initialState = {
  cartId: null, // carts.id
  items: [],
  totalItems: 0,
  totalPrice: 0,

  // optional UI state
  loading: false,
  error: null,
};

const calcTotals = (items) => {
  const totalItems = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );
  return { totalItems, totalPrice };
};

/**
 * THUNKS
 */

// GET /cart/active?tableCode=...
export const fetchActiveCart = createAsyncThunk(
  "cart/fetchActiveCart",
  async (tableCode, { rejectWithValue }) => {
    try {
      const res = await cartApi.getActive(tableCode); // { cart, items }
      return { cartId: res.cart.id, items: res.items };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  }
);

// POST /cart/items
export const addCartItem = createAsyncThunk(
  "cart/addCartItem",
  async ({ cartId, menuItemId, quantity = 1, modifiers = [], note = "" }, { rejectWithValue }) => {
    try {
      const res = await cartApi.addItem({ cartId, menuItemId, quantity, modifiers, note }); // { affected, items }
      return { cartId, items: res.items };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  }
);

// PATCH /cart/items/:cartItemId
export const setCartItemQty = createAsyncThunk(
  "cart/setCartItemQty",
  async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
      const res = await cartApi.updateQty(cartItemId, quantity); // { cartId, items }
      return { cartId: res.cartId, items: res.items };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  }
);

// DELETE /cart/items/:cartItemId
export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (cartItemId, { rejectWithValue }) => {
    try {
      const res = await cartApi.removeItem(cartItemId); // { cartId, items }
      return { cartId: res.cartId, items: res.items };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  }
);

// DELETE /cart/:cartId/items
export const clearCartDb = createAsyncThunk(
  "cart/clearCartDb",
  async (cartId, { rejectWithValue }) => {
    try {
      await cartApi.clearCart(cartId);
      return true;
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  }
);

/**
 * SLICE
 */
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // nếu bạn muốn hydrate thủ công (ít dùng vì đã có thunks)
    hydrateCart: (state, action) => {
      const { cartId, items } = action.payload || {};
      state.cartId = cartId ?? state.cartId;
      state.items = items || [];
      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
    },

    clearCartState: (state) => {
      state.cartId = null;
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.loading = false;
      state.error = null;
    },

    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Request failed";
    };

    builder
      // fetch active
      .addCase(fetchActiveCart.pending, pending)
      .addCase(fetchActiveCart.rejected, rejected)
      .addCase(fetchActiveCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cartId = action.payload.cartId;
        state.items = action.payload.items || [];
        const { totalItems, totalPrice } = calcTotals(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
      })

      // add item
      .addCase(addCartItem.pending, pending)
      .addCase(addCartItem.rejected, rejected)
      .addCase(addCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.cartId = action.payload.cartId ?? state.cartId;
        state.items = action.payload.items || [];
        const { totalItems, totalPrice } = calcTotals(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
      })

      // set qty
      .addCase(setCartItemQty.pending, pending)
      .addCase(setCartItemQty.rejected, rejected)
      .addCase(setCartItemQty.fulfilled, (state, action) => {
        state.loading = false;
        state.cartId = action.payload.cartId ?? state.cartId;
        state.items = action.payload.items || [];
        const { totalItems, totalPrice } = calcTotals(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
      })

      // remove item
      .addCase(removeCartItem.pending, pending)
      .addCase(removeCartItem.rejected, rejected)
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.cartId = action.payload.cartId ?? state.cartId;
        state.items = action.payload.items || [];
        const { totalItems, totalPrice } = calcTotals(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
      })

      // clear cart db
      .addCase(clearCartDb.pending, pending)
      .addCase(clearCartDb.rejected, rejected)
      .addCase(clearCartDb.fulfilled, (state) => {
        state.loading = false;
        state.cartId = null;
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
      });
  },
});

export const { hydrateCart, clearCartState, clearCartError } = cartSlice.actions;
export default cartSlice.reducer;

/**
 * SELECTORS
 */
export const selectCartId = (state) => state.cart.cartId;
export const selectCartItems = (state) => state.cart.items;
export const selectTotalItems = (state) => state.cart.totalItems;
export const selectTotalPrice = (state) => state.cart.totalPrice;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;

// chuẩn DB: tìm theo cartItemId
export const selectCartItemByCartItemId = (cartItemId) => (state) =>
  state.cart.items.find((i) => i.cartItemId === cartItemId);
