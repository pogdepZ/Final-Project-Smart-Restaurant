import { createSlice } from '@reduxjs/toolkit';

// Lấy token từ localStorage nếu có
const getInitialToken = () => {
  try {
    return localStorage.getItem('accessToken') || null;
  } catch (error) {
    return null;
  }
};

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  accessToken: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      state.accessToken = accessToken;
      state.user = user;
      state.isAuthenticated = true;
      
      // Lưu vào localStorage
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    
    updateToken: (state, action) => {
      state.accessToken = action.payload;
      if (action.payload) {
        localStorage.setItem('accessToken', action.payload);
      }
    },
    
    updateUser: (state, action) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
    },
    
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      
      // Xóa khỏi localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, updateToken, updateUser, logout } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
