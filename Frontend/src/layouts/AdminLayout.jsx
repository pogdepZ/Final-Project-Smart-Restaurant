import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <>
      <h1>AdminLayout</h1>
      <Outlet/>
    </>
  );
};

export default AdminLayout;
