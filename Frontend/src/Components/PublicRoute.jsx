import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    const user = JSON.parse(localStorage.getItem("user"));
    // Redirect based on role
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === "waiter") {
      return <Navigate to="/waiter" replace />;
    } else if (user?.role === "kitchen") {
      return <Navigate to="/kitchen" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
