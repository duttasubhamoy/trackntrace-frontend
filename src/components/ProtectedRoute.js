// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

// Component to protect routes
const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("accessToken");
  console.log(isAuthenticated)

  return isAuthenticated ? element : <Navigate to="/" />;
};

export default ProtectedRoute;
