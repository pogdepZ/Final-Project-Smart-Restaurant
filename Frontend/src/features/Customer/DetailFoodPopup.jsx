import React, { useState } from 'react';
import { X, Star, Send, MessageSquare, Clock } from 'lucide-react';

const mockReviews = [
  { id: 1, user: "Hoàng Nam", rating: 5, comment: "Vị rất đậm đà, đóng gói cẩn thận.", date: "2 giờ trước" },
  { id: 2, user: "Minh Thư", rating: 4, comment: "Món ăn ngon nhưng giao hơi chậm chút.", date: "Hôm qua" },
];

const FoodDetailPopup = ({ food, onClose }) => {
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!food) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Main Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in duration-300">

        {/* Nút đóng */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-orange-500 text-white rounded-full transition-colors">
          <X size={20} />
        </button>

        {/* CỘT TRÁI: Hình ảnh & Thông tin cơ bản */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-neutral-900 via-neutral-900/40 to-transparent">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{food.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-black text-orange-500">${food.price}</span>
              <div className="h-4 w-px bg-white/20 mx-2"></div>
              <div className="flex items-center text-yellow-500 gap-1 text-sm">
                <Star size={14} fill="currentColor" /> 4.8 (120+ đánh giá)
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Mô tả & Feedback */}
        <div className="w-full md:w-1/2 flex flex-col bg-neutral-900 p-6 md:p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Mô tả */}
            <section>
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold mb-2">Mô tả món ăn</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{food.description}</p>
            </section>

            {/* Danh sách Feedback */}
            <section className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold flex items-center gap-2">
                <MessageSquare size={14} /> Khách hàng nói gì
              </h4>

              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {mockReviews.map((rev) => (
                  <div key={rev.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-white">{rev.user}</span>
                      <span className="text-[10px] text-gray-500 italic">{rev.date}</span>
                    </div>
                    <div className="flex text-yellow-600 mb-1">
                      {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                    </div>
                    <p className="text-xs text-gray-400">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Form đánh giá của bạn */}
            <section className="pt-4 border-t border-white/10">
              <h4 className="text-xs uppercase tracking-[0.2em] text-white font-bold mb-3">Đánh giá của bạn</h4>

              {/* Star Rating Selector */}
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setUserRating(s)} className={`${userRating >= s ? 'text-orange-500' : 'text-gray-600'} hover:scale-110 transition-transform`}>
                    <Star size={20} fill={userRating >= s ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về món ăn..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-20 resize-none"
                />
                <button className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailPopup;