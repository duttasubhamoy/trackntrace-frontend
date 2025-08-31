// src/components/Sidebar.js
import React from "react";
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
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";

const Sidebar = ({ userData, companyCashbackEnabled }) => {
  const navigate = useNavigate();

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
                <Link
                  to="/seller-report"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiUserX className="inline-block mr-2" /> Seller Report
                </Link>
              </>
            )}
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
            {/* <Link
              to="/analytics"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiBarChart2 className="inline-block mr-2" /> Analytics
            </Link> */}
            {companyCashbackEnabled && (
              <Link
                to="/export"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-yellow-600 hover:text-white font-bold text-lg mt-4"
              >
                <FiArrowRight className="inline-block mr-2" /> Export
              </Link>
            )}
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
            {companyCashbackEnabled && (
              <Link
                to="/export"
                className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
              >
                <FiArrowRight className="inline-block mr-2" /> Export
              </Link>
            )}
            <Link
              to="/generate-qr"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiList className="inline-block mr-2" /> Generate QR
            </Link>
            <Link
              to="/scheme"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiGift className="inline-block mr-2" /> Scheme
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
                <Link
                  to="/seller-report"
                  className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
                >
                  <FiUserX className="inline-block mr-2" /> Seller Report
                </Link>
              </>
            )}
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
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
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
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
            <Link
              to="/settings"
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-teal-900 hover:text-white"
            >
              <FiSettings className="inline-block mr-2" /> Settings
            </Link>
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
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-teal-800 text-white w-64 space-y-6 py-14 px-2">
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
