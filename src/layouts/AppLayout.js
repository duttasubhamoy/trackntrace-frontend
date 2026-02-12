import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const AppLayout = () => {
  const { userData, companyCashbackEnabled, companyTracingEnabled, companyPackingEnabled } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        userData={userData} 
        companyCashbackEnabled={companyCashbackEnabled}
        companyTracingEnabled={companyTracingEnabled}
        companyPackingEnabled={companyPackingEnabled}
      />
      <div className="flex flex-col flex-1 w-full">
        <Header userData={userData} />
        <main className="h-full overflow-x-hidden overflow-y-auto bg-gray-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
