import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { cartApi } from "../../services/cartApi";

const LS_KEY = "cart";

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getInitialCart = () => safeParse(localStorage.getItem(LS_KEY), []);

const persist = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));

// lấy option id an toàn
const getOptionId = (m) =>
  m?.option_id || m?.id || m?.modifier_option_id || m?.modifierOptionId || null;

// ✅ lineKey ổn định
export const buildLineKey = (itemId, modifiers = []) => {
  const ids = (modifiers || [])
    .map(getOptionId)
    .filter(Boolean)
    .sort()
    .join(",");
  return `${itemId}::${ids}`;
};

const calcModifierExtra = (modifiers = []) =>
  (modifiers || []).reduce(
    (sum, m) => sum + Number(m?.price ?? m?.price_adjustment ?? 0),
    0
  );

const calcTotals = (items) => {
  const totalItems = (items || []).reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0
  );

  const totalPrice = (items || []).reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const base = Number(i.price) || 0;
    const extra = calcModifierExtra(i.modifiers);
    return sum + (base + extra) * qty;
  }, 0);

  return { totalItems, totalPrice };
};

const initialItems = getInitialCart().map((i) => {
  const modifiers = i.modifiers || [];
  const lineKey = i.lineKey || buildLineKey(i.id, modifiers);
  return { ...i, modifiers, lineKey };
});

const totals = calcTotals(initialItems);

const initialState = {
  items: initialItems,
  totalItems: totals.totalItems,
  totalPrice: totals.totalPrice,

  syncing: false,
  syncError: null,
  cartId: null,
};

export const syncCartToDb = createAsyncThunk(
  "cart/syncCartToDb",
  async ({ qrToken }, { getState, rejectWithValue }) => {
    try {
      const { items } = getState().cart;

      const payload = {
        items: (items || []).map((i) => ({
          menuItemId: i.id,
          quantity: Number(i.quantity) || 1,
          modifiers: i.modifiers || [],
          note: i.note || "",
        })),
      };

      const res = await cartApi.sync(payload, qrToken);
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
    // ✅ ADD: cộng đúng quantity (không phải +1 cứng)
    addToCartLocal: (state, action) => {
      const item = action.payload || {};
      const modifiers = item.modifiers || [];
      const qtyToAdd = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

      const lineKey = item.lineKey || buildLineKey(item.id, modifiers);
      const existing = state.items.find((i) => i.lineKey === lineKey);

      if (existing) {
        existing.quantity += qtyToAdd;
        // update note nếu muốn (tuỳ bạn)
        if (typeof item.note === "string") existing.note = item.note;
      } else {
        state.items.push({
          ...item,
          modifiers,
          lineKey,
          quantity: qtyToAdd,
        });
      }

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
      persist(state.items);
    },

    // ✅ UPDATE 1 LINE: đổi modifiers/qty/note -> tạo lineKey mới, merge nếu trùng
    updateCartLineLocal: (state, action) => {
      const { fromLineKey, next } = action.payload || {};
      if (!fromLineKey || !next?.id) return;

      const idx = state.items.findIndex((i) => i.lineKey === fromLineKey);
      if (idx === -1) return;

      const nextModifiers = next.modifiers || [];
      const nextQty = Number(next.quantity) > 0 ? Number(next.quantity) : 1;
      const nextLineKey = buildLineKey(next.id, nextModifiers);

      // remove old line
      const old = state.items[idx];
      state.items.splice(idx, 1);

      // if new key exists -> merge
      const existing = state.items.find((i) => i.lineKey === nextLineKey);
      if (existing) {
        existing.quantity += nextQty;
        existing.note = next.note || existing.note || "";
        existing.modifiers = nextModifiers;
        existing.price = Number(next.price ?? existing.price ?? 0);
        existing.name = next.name ?? existing.name;
        existing.image = next.image ?? existing.image;
      } else {
        state.items.push({
          ...old, // giữ các field cũ nếu thiếu
          ...next,
          modifiers: nextModifiers,
          quantity: nextQty,
          lineKey: nextLineKey,
        });
      }

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
      persist(state.items);
    },

    removeFromCartLocal: (state, action) => {
      const { lineKey } = action.payload || {};
      if (!lineKey) return;

      state.items = state.items.filter((i) => i.lineKey !== lineKey);

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
      persist(state.items);
    },

    incrementLocal: (state, action) => {
      const { lineKey } = action.payload || {};
      if (!lineKey) return;

      const item = state.items.find((i) => i.lineKey === lineKey);
      if (item) item.quantity += 1;

      const { totalItems, totalPrice } = calcTotals(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
      persist(state.items);
    },

    decrementLocal: (state, action) => {
      const { lineKey } = action.payload || {};
      if (!lineKey) return;

      const item = state.items.find((i) => i.lineKey === lineKey);
      if (!item) return;

      if (item.quantity > 1) item.quantity -= 1;
      else state.items = state.items.filter((i) => i.lineKey !== lineKey);

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
        state.cartId = action.payload?.cart?.id || null;

        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
        localStorage.removeItem(LS_KEY);
      });
  },
});

export const {
  addToCartLocal,
  updateCartLineLocal,
  removeFromCartLocal,
  incrementLocal,
  decrementLocal,
  clearCartLocal,
  clearSyncError,
} = cartSlice.actions;

export default cartSlice.reducer;

export const selectCartItems = (state) => state.cart.items;
export const selectTotalItems = (state) => state.cart.totalItems;
export const selectTotalPrice = (state) => state.cart.totalPrice;
export const selectSyncing = (state) => state.cart.syncing;
export const selectSyncError = (state) => state.cart.syncError;
export const selectCartId = (state) => state.cart.cartId;
