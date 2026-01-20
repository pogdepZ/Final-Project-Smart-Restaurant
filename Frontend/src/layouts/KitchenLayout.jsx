import { Outlet } from "react-router-dom";
import Navbar from "../Components/NavBar";

const KitchenLayout = () => {
  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar></Navbar>
        <main className="flex-1 pt-14">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default KitchenLayout;
