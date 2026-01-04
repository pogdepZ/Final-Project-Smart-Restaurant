import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";

// Auth
import SignIn from "../features/Auth/SignIn/SignIn";
import SignUp from "../features/Auth/SignUp/SignUp";

// Layouts
import Layout from "../layouts/Layout";
import AdminLayout from "../layouts/AdminLayout";
import WaiterLayout from "../layouts/WaiterLayout";
import KitchenLayout from "../layouts/KitchenLayout";

// Public - Customer
import ScanQR from "../features/Customer/ScanQR";
import Menu from "../features/Customer/Menu";
import Cart from "../features/Customer/Cart";
import OrderStatus from "../features/Customer/OrderStatus";
import Bill from "../features/Customer/Bill";

// Admin
import DashBoard from "../features/Admin/Dashboard";
import MenuManagement from "../features/Admin/MenuManagement";
import TableManagement from "../features/Admin/TableManagement";
import OrderManagement from "../features/Admin/OrderManagement";
import UserManagement from "../features/Admin/UserManagement";
import Reports from "../features/Admin/Reports";

// Waiter
import WaiterOrders from "../features/Waiter/Orders";
import WaiterTables from "../features/Waiter/Tables";

// Kitchen
import KitchenOrders from "../features/Kitchen/Orders";

const routers = [
  // ===== PUBLIC ROUTES =====
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
    ],
  },

  // ===== CUSTOMER (LOGIN OPTIONAL) =====
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "order/status",
        element: <OrderStatus />,
      },
      {
        path: "bill",
        element: <Bill />,
      },
    ],
  },

  // ===== ADMIN =====
  {
    path: "/admin",
    element: <ProtectedRoute roles={["ADMIN"]} />,
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
            path: "users",
            element: <UserManagement />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
        ],
      },
    ],
  },

  // ===== WAITER =====
  {
    path: "/waiter",
    element: <ProtectedRoute roles={["WAITER"]} />,
    children: [
      {
        element: <WaiterLayout />,
        children: [
          {
            path: "orders",
            element: <WaiterOrders />,
          },
          {
            path: "tables",
            element: <WaiterTables />,
          },
        ],
      },
    ],
  },

  // ===== KITCHEN =====
  {
    path: "/kitchen",
    element: <ProtectedRoute roles={["KITCHEN"]} />,
    children: [
      {
        element: <KitchenLayout />,
        children: [
          {
            path: "orders",
            element: <KitchenOrders />,
          },
        ],
      },
    ],
  },
];

export default routers;
