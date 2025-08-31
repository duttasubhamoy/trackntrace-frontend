import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import OtpVerification from "../components/OtpVerification";
import { CgSpinner } from "react-icons/cg";

const RequestUserPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchRequestUser = async () => {
      const requestUserId = searchParams.get("id");
      try {
        const response = await axios.get(`/request/${requestUserId}`);
        setMobile(response.data.mobile); // Set the mobile number
        setLoading(false);
      } catch (error) {
        console.error("Error fetching request user:", error);
        
        // Handle 400 error and display message
        if (error.response && error.response.status === 400) {
          setErrorMessage(error.response.data.msg || "Invalid Request");
        } else {
          navigate("/login");
        }
        setLoading(false)
      }
    };

    fetchRequestUser();
  }, [searchParams, navigate]);

  return (
    <div className="bg-orange-200 flex justify-center items-center min-h-screen">
      {loading ? (
        <CgSpinner size={40} className="animate-spin text-teal-600" />
      ) : errorMessage ? (
        <h1 className="text-3xl font-bold text-red-600">{errorMessage}</h1>
      ) : (
        <OtpVerification initialMobile={mobile} />
      )}
    </div>
  );
};

export default RequestUserPage;
