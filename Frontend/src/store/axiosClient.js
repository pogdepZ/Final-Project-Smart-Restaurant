import axios from 'axios';
import { logout, setCredentials } from './slices/authSlice';



let accessToken = null;

let store; 

export const injectStore = (_store) => {
  store = _store;
  console.log("Store injected into axiosClient");
};

//setup baseURL và headers chung
const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});


// Thêm interceptor để tự động gắn token vào header Authorization
axiosClient.interceptors.request.use(
  (config) => {
    console.log("Request interceptor called");
    console.log(store);
    if (store) {
        const accessToken = store.getState().auth.accessToken; 
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý lỗi 403 và làm mới token tự động
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (!store) return Promise.reject(error);
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const result = await axiosClient.post('/user/refresh');
        const newAccessToken = result.accessToken;
        const user = result.user;
        store.dispatch(setCredentials({ accessToken: newAccessToken, user: user }));
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosClient;