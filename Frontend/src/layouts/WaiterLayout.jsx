import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../Components/Header";
import BottomNav from "../Components/BottomNav";
import Navbar from "../Components/NavBar";
import BillRequestNotification from "../Components/BillRequestNotification";
import WaiterNavbar from "../Components/WaiterNavbar";

const WaiterLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar></Navbar>
      <main className="flex-1">
        <BillRequestNotification />
        <Outlet />
      </main>
    </div>
  );
};

export default WaiterLayout;
