import { createSlice } from '@reduxjs/toolkit';

// Kiểm tra LocalStorage khi khởi động app
const userFromStorage = localStorage.getItem('user') 
  ? JSON.parse(localStorage.getItem('user')) 
  : null;

const tokenFromStorage = localStorage.getItem('token');

const initialState = {
  currentUser: userFromStorage,
  isAuthenticated: !!tokenFromStorage, // true nếu có token
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.currentUser = action.payload.user;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    // --- QUAN TRỌNG: Action Logout ---
    logout: (state) => {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.error = null;
    },
  },
});

// Export Actions
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

// Export Selectors
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;