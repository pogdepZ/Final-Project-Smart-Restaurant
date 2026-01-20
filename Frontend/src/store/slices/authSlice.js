import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient, { injectStore } from "../axiosClient";
import { toast } from "react-toastify";

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


      const accessToken = res?.accessToken || null;
      const user = res?.user || null;

      console.log('loginThunk received user:', user);
      return { accessToken, user };
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Network error";
      return rejectWithValue(msg);
    }
  },
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/register", userData);
      return res;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Network error";
      return rejectWithValue(msg);
    }
  },
);

/** ======================
 * Slice
 ======================= */

const initialState = {
  accessToken: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),
  isLoading: false,
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
        state.user = user ? { ...(state.user || {}), ...user } : null;

        console.log("Updating user in authSlice:", state.user);

        if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
        else localStorage.removeItem("user");
      }
    },

    updateUser: (state, action) => {
      const patch = action.payload || {};
      state.user = { ...(state.user || {}), ...patch };

      if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
    },

    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("qrToken");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("tableCode");
      localStorage.removeItem("tableNumber");
      localStorage.removeItem("tableSession");
      localStorage.removeItem("tableSessionId");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        console.log(action.payload)
        state.isLoading = false;
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
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
      })
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        toast.success(
          action.payload?.message ||
          "Register successful and please verify your email",
        );
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Register failed";
      });
  },
});

export const { logout, setCredentials, updateUser } = authSlice.actions;
export default authSlice.reducer;

/** ======================
 * Selectors
 ======================= */
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
