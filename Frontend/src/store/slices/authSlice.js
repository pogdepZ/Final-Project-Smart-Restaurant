import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../axiosClient";

const getInitialToken = () => {
  try {
    return localStorage.getItem("accessToken") || null;
  } catch {
    return null;
  }
};

const getInitialUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/** ======================
 * Thunks
 ======================= */

// 1) LOGIN
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      // server thường trả: { token/accessToken, user }
      const res = await axiosClient.post("/auth/login", userData);

      const accessToken = res?.token || null;
      const user = res?.user || null;

      return { accessToken, user };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error";
      return rejectWithValue(msg);
    }
  }
);


/** ======================
 * Slice
 ======================= */

const initialState = {
  accessToken: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),
  isLoaading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // interceptor sẽ dispatch cái này khi refresh xong
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload || {};

      if (typeof accessToken !== "undefined") {
        state.accessToken = accessToken;
        state.isAuthenticated = !!accessToken;

        if (accessToken) localStorage.setItem("accessToken", accessToken);
        else localStorage.removeItem("accessToken");
      }

      if (typeof user !== "undefined") {
        state.user = user;
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
      }
    },

    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoaading = false;
      state.error = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoaading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoaading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.accessToken;

        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        } else {
          localStorage.removeItem("accessToken");
        }

        if (action.payload.user) {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        } else {
          localStorage.removeItem("user");
        }
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoaading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
      })
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;

/** ======================
 * Selectors
 ======================= */
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
