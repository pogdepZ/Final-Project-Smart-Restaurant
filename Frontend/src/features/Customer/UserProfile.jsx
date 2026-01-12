import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const UserProfile = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
    
  if (!accessToken || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin cá nhân</p>

        <Link
          to="/signin"
          className="px-6 py-2 rounded-lg bg-orange-500 text-white font-bold hover:opacity-90"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  // ✅ Đã đăng nhập
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>

      <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
        <div>
          <span className="text-gray-400 text-sm">Họ tên</span>
          <p className="font-semibold">{user.name}</p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Email</span>
          <p>{user.email}</p>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Vai trò</span>
          <p className="uppercase text-xs font-bold">{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
