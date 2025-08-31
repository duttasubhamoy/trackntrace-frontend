import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });

  useEffect(() => {
    console.log("Header useEffect triggered"); // Log to check if useEffect is triggered

    const fetchUserData = async () => {
      try {
        const response = await axios.get("/protected");
        const { name, role, last_login, company_name, company_id } =
          response.data;
        setUserData({
          name,
          role,
          lastLogin: last_login,
          companyName: company_name,
        });

        // For admin users, company_id might be null - handle this case
        if (company_id) {
          // Only fetch company details if company_id exists
          try {
            const companyRes = await axios.get(`/company/${company_id}`);
            setCompanyCashbackEnabled(companyRes.data.cashback_enabled);
          } catch (companyError) {
            console.error("Error fetching company data:", companyError);
            // Don't navigate away, just set cashback to false as default
            setCompanyCashbackEnabled(false);
          }
        } else {
          // For admin users without company_id, set cashback to false
          // You could also set it to true if you want admin to see all features
          setCompanyCashbackEnabled(false);
        }
        setIsLoading(false);
        console.log("User Data fetched:", response.data); // Log fetched data
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar userData={userData} companyCashbackEnabled={companyCashbackEnabled} />
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <CgSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <>
            <Header userData={userData} />
            <div className="p-6">
              <Dashboard userData={userData} companyCashbackEnabled={companyCashbackEnabled} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
