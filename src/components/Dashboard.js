import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUser,
  FiLogOut,
  FiSettings,
  FiPackage,
  FiCalendar,
  FiList,
  FiUserX,
  FiGift,
  FiArrowRight,
} from "react-icons/fi";

const roleBasedActions = {
  admin: [
    { label: "Users", path: "/users", icon: <FiUser /> },
    { label: "Products", path: "/products", icon: <FiPackage /> },
    { label: "Batches", path: "/batches", icon: <FiCalendar /> },
    { label: "Companies", path: "/companies", icon: <FiList /> },
    {
      label: "Manufacturing Plants",
      path: "/manufacturing-plants",
      icon: <FiHome />,
    },
    { label: "Generate QR", path: "/generate-qr", icon: <FiList /> },
    { label: "Seller", path: "/seller", icon: <FiUserX /> },
    { label: "Seller Report", path: "/seller-report", icon: <FiUserX /> },
    { label: "Settings", path: "/settings", icon: <FiSettings /> },
  ],
  master: [
    { label: "Users", path: "/users", icon: <FiUser /> },
    { label: "Products", path: "/products", icon: <FiPackage /> },
    { label: "Batches", path: "/batches", icon: <FiCalendar /> },
    {
      label: "Manufacturing Plants",
      path: "/manufacturing-plants",
      icon: <FiHome />,
    },
    { label: "Generate QR", path: "/generate-qr", icon: <FiList /> },
    { label: "Seller", path: "/seller", icon: <FiUserX /> },
    { label: "Seller Report", path: "/seller-report", icon: <FiUserX /> },
    { label: "Export", path: "/export", icon: <FiArrowRight /> },
    { label: "Settings", path: "/settings", icon: <FiSettings /> },
  ],
  plant_owner: [
    { label: "Users", path: "/users", icon: <FiUser /> },
    { label: "Products", path: "/products", icon: <FiPackage /> },
    { label: "Batches", path: "/batches", icon: <FiCalendar /> },
    { label: "Generate QR", path: "/generate-qr", icon: <FiList /> },
    { label: "Settings", path: "/settings", icon: <FiSettings /> },
  ],
  staff: [
    { label: "Users", path: "/users", icon: <FiUser /> },
    { label: "Products", path: "/products", icon: <FiPackage /> },
    { label: "Batches", path: "/batches", icon: <FiCalendar /> },
    { label: "Generate QR", path: "/generate-qr", icon: <FiList /> },
    { label: "Settings", path: "/settings", icon: <FiSettings /> },
    {
      label: "Manufacturing Plants",
      path: "/manufacturing-plants",
      icon: <FiHome />,
    },
  ],
  salesman: [{ label: "Seller", path: "/seller", icon: <FiUserX /> }],
};

const Dashboard = ({ userData, companyCashbackEnabled }) => {
  const navigate = useNavigate();

  if (!userData || !userData.role) return null;

  // Get base actions for the user role
  let actions = roleBasedActions[userData.role] || [];
  
  // Filter out Seller, Seller Report, and Export icons if cashback is not enabled
  if (!companyCashbackEnabled) {
    actions = actions.filter(action => 
      !["Seller", "Seller Report", "Export"].includes(action.label)
    );
  }

  return (
    <div className="p-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.path)}
            className="bg-teal-600 hover:bg-teal-700 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-xl font-semibold transition-all duration-200"
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
