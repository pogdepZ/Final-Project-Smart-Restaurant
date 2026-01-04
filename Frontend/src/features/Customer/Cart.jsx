import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectCartItems, 
  selectTotalItems, 
  selectTotalPrice,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart
} from '../../store/slices/cartSlice';
import { ShoppingBag, Trash2, Plus, Minus, X, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const totalItems = useSelector(selectTotalItems);
  const totalPrice = useSelector(selectTotalPrice);

  const handleRemoveItem = (item) => {
    dispatch(removeFromCart(item.id));
    toast.info(`Đã xóa ${item.name} khỏi giỏ hàng`);
  };

  const handleIncrement = (id) => {
    dispatch(incrementQuantity(id));
  };

  const handleDecrement = (id) => {
    dispatch(decrementQuantity(id));
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      dispatch(clearCart());
      toast.success('Đã xóa toàn bộ giỏ hàng');
    }
  };

  const handleCheckout = () => {
    // Navigate to checkout or order page
    navigate('/order/checkout');
    toast.info('Đang chuyển đến trang thanh toán...');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-neutral-900 flex items-center justify-center">
            <ShoppingCart size={64} className="text-gray-600" />
          </div>
          <h2 className="text-3xl font-black mb-3 text-gray-300">Giỏ hàng trống</h2>
          <p className="text-gray-500 mb-8">
            Bạn chưa thêm món nào vào giỏ hàng. Hãy khám phá thực đơn của chúng tôi!
          </p>
          <Link 
            to="/menu"
            className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-all shadow-lg shadow-orange-500/20 hover:scale-105"
          >
            <ShoppingBag size={20} />
            Xem thực đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-neutral-950/98 backdrop-blur-2xl border-b border-white/10 py-6">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-red-500">
                GIỎ HÀNG
              </h1>
              <p className="text-sm text-gray-400 mt-1">{totalItems} món</p>
            </div>
            
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 size={16} />
                Xóa tất cả
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="container mx-auto max-w-4xl px-4 pt-6">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div 
              key={item.id}
              className="group bg-neutral-900 hover:bg-neutral-800 rounded-2xl p-4 transition-all duration-300 border border-white/5 hover:border-white/10"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-neutral-800">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    {/* Price */}
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-orange-500">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-600">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-neutral-800 rounded-full p-1">
                      <button
                        onClick={() => handleDecrement(item.id)}
                        className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-orange-500 text-white flex items-center justify-center transition-all active:scale-90"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="text-lg font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleIncrement(item.id)}
                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-neutral-900 rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold mb-4 text-gray-300">Chi tiết đơn hàng</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-gray-400">
              <span>Tổng món ({totalItems})</span>
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-gray-400">
              <span>Phí dịch vụ (10%)</span>
              <span className="font-semibold">${(totalPrice * 0.1).toFixed(2)}</span>
            </div>
            
            <div className="h-px bg-white/10 my-3"></div>
            
            <div className="flex justify-between text-xl font-black">
              <span className="text-white">Tổng cộng</span>
              <span className="text-orange-500">${(totalPrice * 1.1).toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            className="w-full mt-6 flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95"
          >
            <span>Đặt món ngay</span>
            <ArrowRight size={20} />
          </button>

          {/* Continue Shopping */}
          <Link
            to="/"
            className="block text-center mt-4 text-sm text-gray-400 hover:text-orange-500 transition-colors"
          >
            ← Tiếp tục xem thực đơn
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;