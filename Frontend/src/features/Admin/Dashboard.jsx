import React from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  // Mock Stats
  const stats = [
    { title: 'Doanh thu ngày', value: '12.5M ₫', icon: DollarSign, change: '+12%', color: 'text-green-400' },
    { title: 'Đơn hàng mới', value: '48', icon: ShoppingBag, change: '+5%', color: 'text-orange-400' },
    { title: 'Khách đang ngồi', value: '120', icon: Users, change: 'Full', color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Tổng Quan</h1>
        <p className="text-gray-400 mt-1">Chào mừng trở lại, đây là tình hình kinh doanh hôm nay.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-neutral-900/50 backdrop-blur border border-white/5 p-6 rounded-2xl hover:border-orange-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-xl text-white">
                <stat.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/5 ${stat.color}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.title}</h3>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder Chart / Recent Orders */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 min-h-[400px] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
          <p>Biểu đồ doanh thu sẽ hiển thị ở đây</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;