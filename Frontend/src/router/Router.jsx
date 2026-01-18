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
import UserProfile from "../features/Customer/UserProfile"; // (NEW) Cập nhật thông tin khách

// Admin
import DashBoard from "../features/Admin/Dashboard";
import MenuManagement from "../features/Admin/MenuManagement";
import TableManagement from "../features/Admin/TableManagement";
import OrderManagement from "../features/Admin/OrderManagement";
import Reports from "../features/Admin/Reports";
import AccountsManagement from "../features/Admin/AccountsManagement";
import AdminProfile from "../features/Admin/AdminProfile";
import Settings from "../features/Admin/Settings"; // (NEW) Cài đặt nhà hàng

// Waiter
import WaiterOrders from "../features/Waiter/Orders";
import WaiterTables from "../features/Waiter/Tables";
import WaiterNotifications from "../features/Waiter/Notifications"; // (NEW) Thông báo gọi phục vụ

// Kitchen
import KitchenOrders from "../features/Kitchen/Orders";
import KitchenHistory from "../features/Kitchen/History"; // (NEW) Lịch sử món đã nấu
import CustomerLayout from "../layouts/CustomerLayout";
import Booking from "../features/Customer/Booking";
import VerifyEmail from "../features/Auth/VerifyEmail/VerifyEmail";
import Forgot from "../features/Auth/Forgot/Forgot";
import ResetPassword from "../features/Auth/ResetPassword/ResetPassword";
import OrderDetail from "../features/Customer/OrderDetail";
import OrderTrackingPage from "../features/Customer/OrderTrackingPage";
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
        path: "/verify-email",
        element: <VerifyEmail />,
      },
      {
        path: "/menu/:tableCode",
        element: <Menu />,
      },
      {
        path: "/cart/:tableCode",
        element: <Cart />,
      },
      {
        path: "/forgot",
        element: <Forgot />,
      },
      {
        path: "/reset-password",
        element: <ResetPassword />,
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
    element: <ProtectedRoute/>,
    children: [
      {
        element: <CustomerLayout />,
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
            element: <Menu />,
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
            path: "booking",
            element: <Booking />,
          },
          {
            path: "orders/:id",
            element: <OrderDetail />,
          },
          {
            path: "history",
            element: <OrderHistory />,
          },
          {
            path: "profile",
            element: <UserProfile />,
          },
          {
            path: "order-tracking",
            element: <OrderTrackingPage />,
          },
        ],
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
          {
            path: "tables",
            element: <TableManagement />,
          },
          {
            path: "orders",
            element: <OrderManagement />,
          },
          {
            path: "accounts",
            element: <AccountsManagement />,
          },
          {
            path: "profile",
            element: <AdminProfile />,
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
        element: <WaiterLayout />,
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
