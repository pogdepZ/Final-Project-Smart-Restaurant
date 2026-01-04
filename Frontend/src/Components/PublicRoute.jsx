import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const token = localStorage.getItem("token");

  if (token) {
    const user = JSON.parse(localStorage.getItem("user"));
    
    // Redirect based on role
    if (user?.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === "WAITER") {
      return <Navigate to="/waiter/orders" replace />;
    } else if (user?.role === "KITCHEN") {
      return <Navigate to="/kitchen/orders" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
