# Redux Store - Hướng dẫn sử dụng

## Cấu trúc

```
src/store/
├── store.js              # Redux store configuration
├── hooks.js              # Custom hooks
└── slices/
    ├── authSlice.js      # Authentication state
    └── cartSlice.js      # Shopping cart state
```

## 1. Auth Slice (authSlice.js)

### State
- `accessToken`: Token xác thực
- `user`: Thông tin user
- `isAuthenticated`: Trạng thái đăng nhập

### Actions

#### setCredentials
Lưu token và user khi đăng nhập:
```javascript
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/slices/authSlice';

const dispatch = useDispatch();

// Đăng nhập
dispatch(setCredentials({
  accessToken: 'your-token',
  user: { id: 1, name: 'John', email: 'john@example.com', role: 'customer' }
}));
```

#### updateToken
Cập nhật token mới (refresh token):
```javascript
dispatch(updateToken('new-token'));
```

#### updateUser
Cập nhật thông tin user:
```javascript
dispatch(updateUser({ ...user, name: 'New Name' }));
```

#### logout
Đăng xuất:
```javascript
dispatch(logout());
```

### Selectors
```javascript
import { selectCurrentToken, selectCurrentUser, selectIsAuthenticated } from './store/slices/authSlice';
import { useSelector } from 'react-redux';

const token = useSelector(selectCurrentToken);
const user = useSelector(selectCurrentUser);
const isAuthenticated = useSelector(selectIsAuthenticated);
```

---

## 2. Cart Slice (cartSlice.js)

### State
- `items`: Mảng món ăn trong giỏ
- `totalItems`: Tổng số lượng món
- `totalPrice`: Tổng giá trị

### Actions

#### addToCart
Thêm món vào giỏ:
```javascript
import { addToCart } from './store/slices/cartSlice';

dispatch(addToCart({
  id: 1,
  name: 'Buffalo Wings',
  price: 12.99,
  image: 'url',
  description: 'Delicious wings'
}));
```

#### removeFromCart
Xóa món khỏi giỏ:
```javascript
dispatch(removeFromCart(itemId));
```

#### updateQuantity
Cập nhật số lượng cụ thể:
```javascript
dispatch(updateQuantity({ id: 1, quantity: 5 }));
```

#### incrementQuantity
Tăng số lượng:
```javascript
dispatch(incrementQuantity(itemId));
```

#### decrementQuantity
Giảm số lượng (xóa nếu quantity = 1):
```javascript
dispatch(decrementQuantity(itemId));
```

#### clearCart
Xóa toàn bộ giỏ hàng:
```javascript
dispatch(clearCart());
```

#### loadCart
Load giỏ hàng từ server:
```javascript
dispatch(loadCart(cartItemsFromServer));
```

### Selectors
```javascript
import { selectCartItems, selectTotalItems, selectTotalPrice, selectCartItemById } from './store/slices/cartSlice';

const items = useSelector(selectCartItems);
const totalItems = useSelector(selectTotalItems);
const totalPrice = useSelector(selectTotalPrice);
const specificItem = useSelector(selectCartItemById(1)); // Get item by ID
```

---

## 3. Ví dụ Component

### Menu Component (Thêm vào giỏ)
```javascript
import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';

const MenuItem = ({ item }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(item));
  };

  return (
    <div>
      <h3>{item.name}</h3>
      <p>${item.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
};
```

### Cart Component (Hiển thị giỏ hàng)
```javascript
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectCartItems, 
  selectTotalPrice, 
  incrementQuantity, 
  decrementQuantity,
  removeFromCart 
} from '../../store/slices/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);

  return (
    <div>
      <h2>Your Cart</h2>
      {items.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>${item.price} x {item.quantity}</p>
          <button onClick={() => dispatch(decrementQuantity(item.id))}>-</button>
          <button onClick={() => dispatch(incrementQuantity(item.id))}>+</button>
          <button onClick={() => dispatch(removeFromCart(item.id))}>Remove</button>
        </div>
      ))}
      <h3>Total: ${totalPrice.toFixed(2)}</h3>
    </div>
  );
};
```

### Protected Route (Kiểm tra authentication)
```javascript
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/slices/authSlice';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

---

## 4. Axios Interceptor (Tự động thêm token)

```javascript
// src/services/api.js
import axios from 'axios';
import store from '../store/store';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 5. LocalStorage Persistence

Redux store tự động lưu vào localStorage:
- `accessToken` → `localStorage.getItem('accessToken')`
- `user` → `localStorage.getItem('user')`
- `cart` → `localStorage.getItem('cart')`

Khi reload page, data sẽ được restore tự động từ localStorage.

---

## 6. Toast Notifications

Đã tích hợp `react-toastify` trong App.jsx:

```javascript
import { toast } from 'react-toastify';

// Success
toast.success('Đã thêm vào giỏ hàng!');

// Error
toast.error('Có lỗi xảy ra!');

// Info
toast.info('Thông báo!');

// Warning
toast.warning('Cảnh báo!');
```
