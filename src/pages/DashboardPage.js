import React from "react";
import Dashboard from "../components/Dashboard";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();

  return <Dashboard userData={userData} companyCashbackEnabled={companyCashbackEnabled} />;
};

export default DashboardPage;
