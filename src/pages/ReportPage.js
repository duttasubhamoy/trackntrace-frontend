import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";

const ReportPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userData) {
      setIsLoading(false);
    }
  }, [userData]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="p-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-teal-700 mb-4">Reports</h2>
                <p className="text-gray-600">
                  Report functionality will be implemented here.
                </p>
              </div>

          </div>
      )}
    </>
  );
};

export default ReportPage;
