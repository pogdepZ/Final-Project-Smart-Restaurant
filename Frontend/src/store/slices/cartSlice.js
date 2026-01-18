// src/store/slices/cartSlice.js
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

/** Lấy option id an toàn */
const getOptionId = (m) =>
  m?.option_id || m?.id || m?.modifier_option_id || m?.modifierOptionId || null;

/** ✅ Normalize modifiers: luôn trả về Array */
const normalizeModifiers = (mods) => {
  if (!mods) return [];
  if (Array.isArray(mods)) return mods;

  // mods là JSON string: "[]", "[{...}]"
  if (typeof mods === "string") {
    try {
      const parsed = JSON.parse(mods);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // mods là object đơn: { ... } -> bọc thành mảng
  if (typeof mods === "object") return [mods];

  return [];
};

/** ✅ itemId thống nhất: ưu tiên menuItemId nếu có */
const getItemId = (item) => item?.menuItemId || item?.menu_item_id || item?.id;

/** ✅ lineKey ổn định */
export const buildLineKey = (itemId, modifiers) => {
  const ids = normalizeModifiers(modifiers)
    .map(getOptionId)
    .filter(Boolean)
    .sort()
    .join(",");
  return `${itemId}::${ids}`;
};

const calcModifierExtra = (modifiers) =>
  normalizeModifiers(modifiers).reduce(
    (sum, m) => sum + Number(m?.price ?? m?.price_adjustment ?? 0),
    0,
  );

const calcTotals = (items) => {
  const totalItems = (items || []).reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0,
  );

  const totalPrice = (items || []).reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const base = Number(i.price) || 0;
    const extra = calcModifierExtra(i.modifiers);
    return sum + (base + extra) * qty;
  }, 0);

  return { totalItems, totalPrice };
};

/** ✅ init: normalize modifiers + build lineKey đúng */
const initialItems = getInitialCart().map((i) => {
  const modifiers = normalizeModifiers(i.modifiers);
  const itemId = getItemId(i);
  const lineKey = i.lineKey || buildLineKey(itemId, modifiers);
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
  async ({ qrToken, sessionId, userId }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const items = state.cart.items || [];

      if (!items.length) {
        return rejectWithValue({ message: "Giỏ hàng trống" });
      }

      // Map items to API format
      const payload = {
        items: items.map((it) => ({
          menuItemId: it.id,
          quantity: it.quantity || 1,
          note: it.note || "",
          modifiers: (it.modifiers || []).map((m) => ({
            option_id: m.id || m.option_id,
            name: m.name,
            price: m.price || m.price_adjustment || 0,
            group_name: m.group_name || "",
          })),
        })),
        sessionId: sessionId || null,
        userId: userId || null,
      };

      // console.log("Syncing cart to DB with payload:", payload);

      const res = await cartApi.sync(payload, qrToken);
      return res;
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: err.message });
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /** ✅ ADD: cộng đúng quantity (không phải +1 cứng) */
    addToCartLocal: (state, action) => {
      const item = action.payload || {};
      const modifiers = normalizeModifiers(item.modifiers);
      const qtyToAdd = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

      const itemId = getItemId(item);
      if (!itemId) return;

      const lineKey = item.lineKey || buildLineKey(itemId, modifiers);
      const existing = state.items.find((i) => i.lineKey === lineKey);

      if (existing) {
        existing.quantity += qtyToAdd;
        if (typeof item.note === "string") existing.note = item.note;
      } else {
        state.items.push({
          ...item,
          // đảm bảo có id dùng cho buildLineKey về sau
          id: item.id ?? itemId,
          menuItemId: item.menuItemId ?? itemId,
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

    /** ✅ UPDATE 1 LINE: đổi modifiers/qty/note -> tạo lineKey mới, merge nếu trùng */
    updateCartLineLocal: (state, action) => {
      const { fromLineKey, next } = action.payload || {};
      if (!fromLineKey) return;

      const idx = state.items.findIndex((i) => i.lineKey === fromLineKey);
      if (idx === -1) return;

      const nextItemId = getItemId(next);
      if (!nextItemId) return;

      const nextModifiers = normalizeModifiers(next.modifiers);
      const nextQty = Number(next.quantity) > 0 ? Number(next.quantity) : 1;
      const nextLineKey = buildLineKey(nextItemId, nextModifiers);

      // remove old line
      const old = state.items[idx];
      state.items.splice(idx, 1);

      // if new key exists -> merge
      const existing = state.items.find((i) => i.lineKey === nextLineKey);
      if (existing) {
        existing.quantity += nextQty;
        existing.note = next.note || existing.note || "";
        existing.modifiers = nextModifiers;
        if (next.price != null) existing.price = Number(next.price);
        if (next.name != null) existing.name = next.name;
        if (next.image != null) existing.image = next.image;
      } else {
        state.items.push({
          ...old, // giữ các field cũ nếu thiếu
          ...next,
          id: old.id ?? next.id ?? nextItemId,
          menuItemId: old.menuItemId ?? next.menuItemId ?? nextItemId,
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

        // Sau sync thì clear local cart
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
