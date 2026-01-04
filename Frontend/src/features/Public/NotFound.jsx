import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          to="/"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 inline-block"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
