// src/components/Sidebar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiLogOut,
  FiSettings,
  FiPackage,
  FiCalendar,
  FiList,
  FiUserX,
  FiBarChart2,
  FiGift,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";

const Sidebar = ({ userData, companyCashbackEnabled, companyTracingEnabled, companyPackingEnabled }) => {
  const navigate = useNavigate();
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  if (!userData) {
    return null; // Don't show sidebar until userData is loaded
  }

  const renderLinks = () => {
    switch (userData.role) {
      case "admin":
        return (
          <>
            <Link
              to="/dashboard"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Dashboard
            </Link>
            <Link
              to="/users"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiUser className="inline-block mr-2" /> Users
            </Link>
            <Link
              to="/products"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiPackage className="inline-block mr-2" /> Products
            </Link>
            <Link
              to="/batches"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiCalendar className="inline-block mr-2" /> Batches
            </Link>
            <Link
              to="/generate-qr"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiList className="inline-block mr-2" /> Generate QR
            </Link>
            {companyTracingEnabled && (
              <>
                <Link
                  to="/indent"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiList className="inline-block mr-2" /> Indent
                </Link>
                <Link
                  to="/shipment"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiList className="inline-block mr-2" /> Shipment
                </Link>
              </>
            )}
            <Link
              to="/companies"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiList className="inline-block mr-2" /> Companies
            </Link>
            <Link
              to="/manufacturing-plants"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Manufacturing Plants
            </Link>
            {companyCashbackEnabled && (
              <>
                <Link
                  to="/seller"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiUserX className="inline-block mr-2" /> Seller
                </Link>
              </>
            )}
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
            {companyCashbackEnabled && (
              <Link
                to="/report"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiBarChart2 className="inline-block mr-2" /> Report
              </Link>
            )}
            {/* <Link
              to="/analytics"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiBarChart2 className="inline-block mr-2" /> Analytics
            </Link> */}
          </>
        );
      case "master":
        return (
          <>
            <Link
              to="/dashboard"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Dashboard
            </Link>
            <Link
              to="/users"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiUser className="inline-block mr-2" /> Users
            </Link>
            <Link
              to="/products"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiPackage className="inline-block mr-2" /> Products
            </Link>
            <Link
              to="/batches"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiCalendar className="inline-block mr-2" /> Batches
            </Link>
            <Link
              to="/generate-qr"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiList className="inline-block mr-2" /> Generate QR
            </Link>
            {companyPackingEnabled && (
              <Link
                to="/pack"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiPackage className="inline-block mr-2" /> Pack
              </Link>
            )}
            {companyTracingEnabled && (
              <>
                <Link
                  to="/indent"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiList className="inline-block mr-2" /> Indent
                </Link>
                <Link
                  to="/shipment"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiList className="inline-block mr-2" /> Shipment
                </Link>
              </>
            )}
            {companyCashbackEnabled && (
              <Link
                to="/scheme"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiGift className="inline-block mr-2" /> Scheme
              </Link>
            )}
            <Link
              to="/manufacturing-plants"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Manufacturing Plants
            </Link>
            {companyCashbackEnabled && (
              <>
                <Link
                  to="/seller"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiUserX className="inline-block mr-2" /> Seller
                </Link>
              </>
            )}
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
            {companyCashbackEnabled && (
              <div>
                <button
                  onClick={() => setIsReportOpen(!isReportOpen)}
                  className="w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white flex items-center justify-between"
                >
                  <span>
                    <FiBarChart2 className="inline-block mr-2" /> Report
                  </span>
                  {isReportOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {isReportOpen && (
                  <div className="ml-6 mt-1">
                    <Link
                      to="/stocks-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Stocks Report
                    </Link>
                    <Link
                      to="/cashback-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Cashback Report
                    </Link>
                    <Link
                      to="/seller-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Seller Report
                    </Link>
                    <Link
                      to="/scheme-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Scheme Report
                    </Link>
                  </div>
                )}
              </div>
            )}
            {/* <Link
              to="/analytics"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiBarChart2 className="inline-block mr-2" /> Analytics
            </Link> */}
          </>
        );
      case "plant_owner":
        return (
          <>
            <Link
              to="/dashboard"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Dashboard
            </Link>
            <Link
              to="/users"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiUser className="inline-block mr-2" /> Users
            </Link>
            <Link
              to="/products"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiPackage className="inline-block mr-2" /> Products
            </Link>
            <Link
              to="/batches"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiCalendar className="inline-block mr-2" /> Batches
            </Link>
            <Link
              to="/generate-qr"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiList className="inline-block mr-2" /> Generate QR
            </Link>
            {companyPackingEnabled && (
              <Link
                to="/pack"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiPackage className="inline-block mr-2" /> Pack
              </Link>
            )}
            {companyTracingEnabled && (
              <>
                <Link
                  to="/indent"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiList className="inline-block mr-2" /> Indent
                </Link>
                <Link
                  to="/shipment"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiList className="inline-block mr-2" /> Shipment
                </Link>
              </>
            )}
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
            {companyCashbackEnabled && (
              <div>
                <button
                  onClick={() => setIsReportOpen(!isReportOpen)}
                  className="w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white flex items-center justify-between"
                >
                  <span>
                    <FiBarChart2 className="inline-block mr-2" /> Report
                  </span>
                  {isReportOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {isReportOpen && (
                  <div className="ml-6 mt-1">
                    <Link
                      to="/stocks-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Stocks Report
                    </Link>
                    <Link
                      to="/cashback-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Cashback Report
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        );
      case "staff":
        return (
          <>
            <Link
              to="/dashboard"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Dashboard
            </Link>
            <Link
              to="/users"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiUser className="inline-block mr-2" /> Users
            </Link>
            <Link
              to="/products"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiPackage className="inline-block mr-2" /> Products
            </Link>
            <Link
              to="/batches"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiCalendar className="inline-block mr-2" /> Batches
            </Link>
            <Link
              to="/generate-qr"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiList className="inline-block mr-2" /> Generate QR
            </Link>
            {companyPackingEnabled && (
              <Link
                to="/pack"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiPackage className="inline-block mr-2" /> Pack
              </Link>
            )}
            {companyTracingEnabled && (
              <Link
                to="/shipment"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiList className="inline-block mr-2" /> Shipment
              </Link>
            )}
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
            {companyCashbackEnabled && (
              <div>
                <button
                  onClick={() => setIsReportOpen(!isReportOpen)}
                  className="w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white flex items-center justify-between"
                >
                  <span>
                    <FiBarChart2 className="inline-block mr-2" /> Report
                  </span>
                  {isReportOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {isReportOpen && (
                  <div className="ml-6 mt-1">
                    <Link
                      to="/stocks-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Stocks Report
                    </Link>
                    <Link
                      to="/cashback-report"
                      className="block py-2 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white text-sm"
                    >
                      Cashback Report
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        );
      case "salesman":
        return (
          <>
            <Link
              to="/dashboard"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiHome className="inline-block mr-2" /> Dashboard
            </Link>
            {companyCashbackEnabled && (
              <Link
                to="/seller"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiUserX className="inline-block mr-2" /> Seller
              </Link>
            )}
            {companyTracingEnabled && (
              <Link
                to="/indent"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiList className="inline-block mr-2" /> Indent
              </Link>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-teal-800 text-white w-64 space-y-6 py-14 px-2 h-screen overflow-y-auto">
      <h1 className="text-3xl font-bold text-center ">Real & Tested</h1>
      <nav>
        {renderLinks()}
        <button
          onClick={handleLogout}
          className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white w-full text-left"
        >
          <FiLogOut className="inline-block mr-2" /> Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
