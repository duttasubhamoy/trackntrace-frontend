import React from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";

const Header = ({ userData }) => {
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

  return (
    <div className="bg-white p-4 shadow-md">
      <div className="flex justify-between items-center">
        {/* Left-aligned Welcome message */}
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-teal-800">Welcome,</h1>
          <h2 className="text-2xl font-bold text-teal-800">{userData.name}</h2>
        </div>

        {/* User info */}
        <div className="flex items-center space-x-4">
          <div className="text-base font-normal text-left">
            <span className="font-bold text-teal-800">Last Login: </span>
            <span className="text-teal-800">{userData.lastLogin}</span>
            <br />
            <span className="font-bold text-teal-800">Role: </span>
            <span className="text-teal-800">{userData.role}</span>
            <br />
            <span className="font-bold text-teal-800">Company: </span>
            <span className="text-teal-800">
              {userData.role === "admin"
                ? "" // Blank for admin
                : userData.companyName || ""}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="text-teal-800 pl-5 pr-5 text-lg font-bold"
          >
            <FiLogOut size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
