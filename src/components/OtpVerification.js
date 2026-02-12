import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsFillShieldLockFill, BsTelephoneFill } from "react-icons/bs";
import { CgSpinner } from "react-icons/cg";
import OtpInput from "otp-input-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { toast, Toaster } from "react-hot-toast";
import axios from "../utils/axiosConfig";
import BACKEND_URL from "../utils/env";
import { useAuth } from "../context/AuthContext";

const OtpVerification = ({ initialMobile = "" }) => {
  const { refetchUserData } = useAuth();
  const [otp, setOtp] = useState("");
  const [ph, setPh] = useState("");
  const [wrongOtp, setWrongOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  // If initialMobile is provided, set it to the phone input field
  useEffect(() => {
    if (initialMobile && !ph) {  // Only set if not already set
      setPh(initialMobile);
      onSignup();  // Send OTP once when mobile is first set
      setShowOTP(true);
      console.log("Backend URL:", BACKEND_URL);
    }
    // eslint-disable-next-line
  }, [initialMobile]);

  // Timer for resend OTP
  useEffect(() => {
    let timer;
    if (showOTP && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOTP, resendTimer]);

  // Function to extract the last 10 digits from a phone number
  const extractLast10Digits = (phoneNumber) => {
    const digitsOnly = phoneNumber.replace(/\D/g, ""); // Remove non-digit characters
    return digitsOnly.slice(-10); // Get the last 10 digits
  };

  const onSignup = async () => {

    setLoading(true);
    try {
      const mobileNumber = extractLast10Digits(ph); // Extract only 10-digit number
      console.log(mobileNumber);
      const response = await axios.post(
        `${BACKEND_URL}/send-otp`,
        {
          mobile: mobileNumber,
        }
      );
      toast.success(response.data.msg);
      setShowOTP(true);
      setResendTimer(60);
      setResendCount(0);

    } catch (error) {
      toast.error(error.response?.data?.msg || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const mobileNumber = extractLast10Digits(ph);
      const response = await axios.post(`${BACKEND_URL}/resend-otp`, {
        mobile: mobileNumber,
      });
      toast.success(response.data.msg);
      setResendCount((prev) => prev + 1);
      setResendTimer(60);
    } catch (error) {
      toast.error(error.response?.data?.msg || "An error occurred");
    } finally {
      setResendLoading(false);
    }
  };

  const onOTPVerify = async () => {
    setLoading(true);
    try {
      const mobileNumber = extractLast10Digits(ph); // Extract only 10-digit number
      console.log(mobileNumber);
      const response = await axios.post(`${BACKEND_URL}/verify-otp`, {
        mobile: mobileNumber,
        otp,
      });

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("refreshToken", response.data.refresh_token);
      
      // Refetch user data to update AuthContext
      await refetchUserData();
      
      navigate("/dashboard");
    } catch (error) {
      setWrongOtp(true);
      console.log(error);
      //toast.error(error.response?.data?.msg || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-orange-200 flex items-center justify-center h-screen">
      <div>
        <Toaster toastOptions={{ duration: 4000 }} />
        <div id="recaptcha-container"></div>
        <div className="w-80 flex flex-col gap-4 rounded-lg p-4">
          <h1 className="text-center leading-normal text-orange-950 font-medium text-3xl mb-6">
            Welcome to <br /> REAL & TESTE
          </h1>
          {showOTP ? (
            <>
              <div className="bg-white text-orange-200 w-fit mx-auto p-4 rounded-full">
                <BsFillShieldLockFill size={30} />
              </div>
              <label
                htmlFor="otp"
                className="font-bold text-xl text-orange-950 text-center"
              >
                Enter your OTP
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                OTPLength={6}
                otpType="number"
                disabled={false}
                autoFocus
                className="opt-container "
              />
              {/* Resend OTP link and timer */}
              <div className="text-center mt-2">
                {resendTimer > 0 && resendCount < 3 ? (
                  <span className="text-gray-600 text-sm">Resend OTP in {resendTimer} secs</span>
                ) : resendCount < 3 ? (
                  <button
                    className="text-blue-600 underline text-sm disabled:text-gray-400"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                  >
                    {resendLoading ? "Sending..." : "Resend OTP"}
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm">Resend OTP limit reached</span>
                )}
              </div>
              {wrongOtp && (
                <div className="text-center text-red-600">
                  Please Enter A Valid OTP
                </div>
              )}
              <button
                onClick={onOTPVerify}
                className="bg-orange-400 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded"
              >
                {loading && (
                  <CgSpinner size={20} className="mt-1 animate-spin" />
                )}
                <span>Verify OTP</span>
              </button>
            </>
          ) : (
            <>
              <div className="bg-white text-orange-200 w-fit mx-auto p-4 rounded-full">
                <BsTelephoneFill size={30} />
              </div>
              <label
                htmlFor=""
                className="font-bold text-xl text-orange-950 text-center"
              >
                Verify your phone number
              </label>
              <PhoneInput country={"in"} value={ph} onChange={setPh} />
                <button
                  onClick={onSignup}
                  className="bg-orange-400 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded"
                >
                  {loading && (
                    <CgSpinner size={20} className="mt-1 animate-spin" />
                  )}
                  <span>Send code via SMS</span>
                </button>
                
                {/* Link to Password Login */}
                <div className="text-center mt-2">
                  <Link to="/login-password" className="text-sm text-gray-600 hover:text-orange-600">
                    Login with Password instead
                  </Link>
                </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default OtpVerification;
