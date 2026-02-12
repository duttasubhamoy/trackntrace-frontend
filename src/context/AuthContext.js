import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [companyTracingEnabled, setCompanyTracingEnabled] = useState(false);
  const [companySalesmanTrackingEnabled, setCompanySalesmanTrackingEnabled] = useState(false);
  const [companyAccountingEnabled, setCompanyAccountingEnabled] = useState(false);
  const [companyPackingEnabled, setCompanyPackingEnabled] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get("/protected");
      const { name, role, last_login, company_name, company_id } = response.data;
      
      const user = {
        name,
        role,
        lastLogin: last_login,
        companyName: company_name,
        companyId: company_id,
      };
      
      setUserData(user);
      setIsAuthenticated(true);

      // Fetch company details if company_id exists
      if (company_id) {
        try {
          const companyRes = await axios.get(`/company/${company_id}`);
          setCompanyCashbackEnabled(companyRes.data.cashback_enabled || false);
          setCompanyTracingEnabled(companyRes.data.tracing_enabled || false);
          setCompanySalesmanTrackingEnabled(companyRes.data.salesman_tracking_enabled || false);
          setCompanyAccountingEnabled(companyRes.data.accounting_enabled || false);
          setCompanyPackingEnabled(companyRes.data.packing_enabled || false);
        } catch (companyError) {
          console.error("Error fetching company data:", companyError);
          // Set defaults if company fetch fails
          setCompanyCashbackEnabled(false);
          setCompanyTracingEnabled(false);
          setCompanySalesmanTrackingEnabled(false);
          setCompanyAccountingEnabled(false);
          setCompanyPackingEnabled(false);
        }
      }

      // Fetch companies list for admin users
      if (role === "admin") {
        try {
          const companiesRes = await axios.get("/companies");
          setCompanies(companiesRes.data || []);
        } catch (error) {
          console.error("Error fetching companies:", error);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    }
  };

  const logout = async () => {
    try {
      await axios.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      setUserData(null);
      setIsAuthenticated(false);
      setCompanyCashbackEnabled(false);
      setCompanyTracingEnabled(false);
      setCompanySalesmanTrackingEnabled(false);
      setCompanyAccountingEnabled(false);
      setCompanyPackingEnabled(false);
      setCompanies([]);
    }
  };

  const value = {
    userData,
    companyCashbackEnabled,
    companyTracingEnabled,
    companySalesmanTrackingEnabled,
    companyAccountingEnabled,
    companyPackingEnabled,
    companies,
    isLoading,
    isAuthenticated,
    logout,
    refetchUserData: fetchUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
