import { Link, useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-300">403</h1>
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Truy cập bị từ chối
        </h2>
        <p className="text-gray-600 mb-8">
          Bạn không có quyền truy cập vào trang này.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 inline-block"
          >
            Quay lại
          </button>
          <Link
            to="/"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 inline-block"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
