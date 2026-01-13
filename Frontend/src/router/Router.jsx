import ProtectedRoute from "../Components/ProtectedRoute";
import PublicRoute from "../Components/PublicRoute";

// Auth
import SignIn from "../features/Auth/SignIn/SignIn";
import SignUp from "../features/Auth/SignUp/SignUp";

// Layouts
import Layout from "../layouts/Layout";
import AdminLayout from "../layouts/AdminLayout";
import WaiterLayout from "../layouts/WaiterLayout";
import KitchenLayout from "../layouts/KitchenLayout";

// Public - Common & Error Pages (NEW)
import LandingPage from "../features/Public/LandingPage"; // Trang giới thiệu khi vào domain chính
import NotFound from "../features/Public/NotFound"; // Trang 404
import Unauthorized from "../features/Public/Unauthorized"; // Trang 403

// Public - Customer
import ScanQR from "../features/Customer/ScanQR";
import Menu from "../features/Customer/Menu";
import Cart from "../features/Customer/Cart";
import OrderStatus from "../features/Customer/OrderStatus";
import Bill from "../features/Customer/Bill";
import OrderHistory from "../features/Customer/OrderHistory"; // (NEW) Xem lịch sử ăn uống
import UserProfile from "../features/Customer/UserProfile";   // (NEW) Cập nhật thông tin khách

// Admin
import DashBoard from "../features/Admin/Dashboard";
import MenuManagement from "../features/Admin/MenuManagement";
import TableManagement from "../features/Admin/TableManagement";
import OrderManagement from "../features/Admin/OrderManagement";
import UserManagement from "../features/Admin/UserManagement";
import Reports from "../features/Admin/Reports";
import Settings from "../features/Admin/Settings"; // (NEW) Cài đặt nhà hàng

// Waiter
import WaiterOrders from "../features/Waiter/Orders";
import WaiterTables from "../features/Waiter/Tables";
import WaiterNotifications from "../features/Waiter/Notifications"; // (NEW) Thông báo gọi phục vụ

// Kitchen
import KitchenOrders from "../features/Kitchen/Orders";
import KitchenHistory from "../features/Kitchen/History"; // (NEW) Lịch sử món đã nấu
import MainLayout from "../layouts/MainLayout";
import Booking from "../features/Customer/Booking";

const routers = [
  // ===== PUBLIC ROUTES (Login/Register/Scan) =====
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/signin",
        element: <SignIn />,
      },
      {
        path: "/signup",
        element: <SignUp />,
      },
      {
        path: "/scan/:tableCode",
        element: <ScanQR />,
      },
      {
        path: "/menu/:tableCode",
        element: <Menu />,
      },
      {
        path: "/cart/:tableCode",
        element: <Cart />,
      },
      // Trang báo lỗi không có quyền truy cập
      {
        path: "/unauthorized",
        element: <Unauthorized />,
      },
    ],
  },

  // ===== CUSTOMER (Main Layout) =====
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true, // Mặc định khi vào "/"
        element: <LandingPage />,
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "menu",
        element: <Menu />
      },
      {
        path: "order/status",
        element: <OrderStatus />,
      },
      {
        path: "bill",
        element: <Bill />,
      },
      {
        path: 'booking',
        element: <Booking />
      },
      // (NEW) Các trang bổ sung cho khách hàng
      {
        path: "history",
        element: <OrderHistory />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
    ],
  },

  // ===== ADMIN =====
  {
    path: "/admin",
    element: <ProtectedRoute roles={["admin"]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <DashBoard />,
          },
          {
            path: "menu",
            element: <MenuManagement />,
          },
          // (Option) Thêm route con nếu muốn edit chi tiết
          // { path: "menu/edit/:id", element: <EditMenuItem /> },
          {
            path: "tables",
            element: <TableManagement />,
          },
          {
            path: "orders",
            element: <OrderManagement />,
          },
          {
            path: "users",
            element: <UserManagement />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          // (NEW) Cài đặt thông tin nhà hàng, thuế, giờ mở cửa
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },

  // ===== WAITER =====
  {
    path: "/waiter",
    element: <ProtectedRoute roles={["waiter"]} />,
    children: [
      {
        children: [
          {
            index: true, // Mặc định vào danh sách bàn hoặc order
            element: <WaiterOrders />,
          },
          {
            path: "orders",
            element: <WaiterOrders />,
          },
          {
            path: "tables",
            element: <WaiterTables />,
          },
          // (NEW) Xem các yêu cầu hỗ trợ từ khách
          {
            path: "notifications",
            element: <WaiterNotifications />,
          },
        ],
      },
    ],
  },

  // ===== KITCHEN =====
  {
    path: "/kitchen",
    element: <ProtectedRoute roles={["kitchen"]} />,
    children: [
      {
        children: [
          {
            index: true,
            element: <KitchenOrders />,
          },
          {
            path: "orders",
            element: <KitchenOrders />,
          },
          // (NEW) Xem lại các món đã trả trong ngày
          {
            path: "history",
            element: <KitchenHistory />,
          },
        ],
      },
    ],
  },

  // ===== CATCH ALL (404) =====
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routers;