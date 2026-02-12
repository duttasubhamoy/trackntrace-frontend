import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsFillShieldLockFill, BsTelephoneFill } from "react-icons/bs";
import { CgSpinner } from "react-icons/cg";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast, Toaster } from "react-hot-toast";
import Modal from "react-modal";
import OtpInput from "otp-input-react";
import axios from "../utils/axiosConfig";
import BACKEND_URL from "../utils/env";
import { useAuth } from "../context/AuthContext";

const LoginPswdPage = () => {
  const { refetchUserData } = useAuth();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password reset modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Mobile input, 2: OTP and new password
  const [resetMobile, setResetMobile] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const extractLast10Digits = (phoneNumber) => {
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    return digitsOnly.slice(-10);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!mobile || !password) {
      toast.error("Please enter mobile number and password");
      return;
    }

    setLoading(true);
    try {
      const mobileNumber = extractLast10Digits(mobile);
      const response = await axios.post(`${BACKEND_URL}/login`, {
        mobile: mobileNumber,
        password: password,
      });

      localStorage.setItem("accessToken", response.data.access_token);
      localStorage.setItem("refreshToken", response.data.refresh_token);
      toast.success("Login successful!");
      
      // Refetch user data to update AuthContext
      await refetchUserData();
      
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Invalid mobile or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!resetMobile) {
      toast.error("Please enter mobile number");
      return;
    }

    setResetLoading(true);
    try {
      const mobileNumber = extractLast10Digits(resetMobile);
      const response = await axios.post(`${BACKEND_URL}/send-otp`, {
        mobile: mobileNumber,
      });
      toast.success(response.data.msg || "OTP sent successfully");
      setResetStep(2);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to send OTP");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResetLoading(true);
    try {
      const mobileNumber = extractLast10Digits(resetMobile);
      const response = await axios.post(`${BACKEND_URL}/reset-password`, {
        mobile: mobileNumber,
        otp: resetOtp,
        new_password: newPassword,
      });
      toast.success(response.data.msg || "Password reset successful!");
      closeResetModal();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep(1);
    setResetMobile("");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <section className="bg-orange-200 flex items-center justify-center h-screen">
      <div>
        <Toaster toastOptions={{ duration: 4000 }} />
        <div className="w-96 flex flex-col gap-4 rounded-lg p-6 bg-white shadow-lg">
          <h1 className="text-center leading-normal text-orange-950 font-medium text-3xl mb-2">
            Welcome to <br /> REAL & TESTED
          </h1>
          
          <div className="bg-orange-200 text-orange-600 w-fit mx-auto p-4 rounded-full">
            <BsFillShieldLockFill size={30} />
          </div>

          <h2 className="font-bold text-xl text-orange-950 text-center">
            Login with Password
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Mobile Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex items-center border border-gray-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-orange-400">
                <BsTelephoneFill className="text-gray-500 mr-2" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full outline-none"
                  maxLength="10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-orange-400">
                <BsFillShieldLockFill className="text-gray-500 mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-sm text-orange-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-400 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded font-medium hover:bg-orange-500 transition disabled:bg-orange-300"
            >
              {loading && <CgSpinner size={20} className="animate-spin" />}
              <span>{loading ? "Logging in..." : "Login"}</span>
            </button>

            {/* Link to OTP Login */}
            <div className="text-center mt-2">
              <Link to="/login" className="text-sm text-gray-600 hover:text-orange-600">
                Login with OTP instead
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showResetModal}
        onRequestClose={closeResetModal}
        contentLabel="Reset Password"
        className="bg-white rounded-lg shadow-lg w-96 mx-auto mt-20 p-6 relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <button
          onClick={closeResetModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold text-orange-950 mb-4 text-center">
          Reset Password
        </h2>

        {resetStep === 1 ? (
          // Step 1: Enter Mobile Number
          <div className="flex flex-col gap-4">
            <div className="bg-orange-200 text-orange-600 w-fit mx-auto p-4 rounded-full">
              <BsTelephoneFill size={30} />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Enter your registered mobile number to receive OTP
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={resetMobile}
                onChange={(e) => setResetMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                maxLength="10"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={resetLoading}
              className="bg-orange-400 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded font-medium hover:bg-orange-500 transition disabled:bg-orange-300"
            >
              {resetLoading && <CgSpinner size={20} className="animate-spin" />}
              <span>{resetLoading ? "Sending..." : "Send OTP"}</span>
            </button>
          </div>
        ) : (
          // Step 2: Enter OTP and New Password
          <div className="flex flex-col gap-4">
            <div className="bg-orange-200 text-orange-600 w-fit mx-auto p-4 rounded-full">
              <BsFillShieldLockFill size={30} />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Enter OTP and set your new password
            </p>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter OTP
              </label>
              <div className="otp-reset-container">
                <OtpInput
                  value={resetOtp}
                  onChange={setResetOtp}
                  OTPLength={6}
                  otpType="number"
                  disabled={false}
                  autoFocus
                  className="opt-container justify-center"
                />
              </div>
              <style jsx>{`
                .otp-reset-container input {
                  border: 2px solid #000 !important;
                  border-radius: 8px !important;
                }
              `}</style>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="flex items-center border border-gray-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-orange-400">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="flex items-center border border-gray-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-orange-400">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="bg-orange-400 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded font-medium hover:bg-orange-500 transition disabled:bg-orange-300"
            >
              {resetLoading && <CgSpinner size={20} className="animate-spin" />}
              <span>{resetLoading ? "Resetting..." : "Reset Password"}</span>
            </button>

            <button
              onClick={() => setResetStep(1)}
              className="text-sm text-gray-600 hover:text-orange-600 text-center"
            >
              Back to mobile input
            </button>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default LoginPswdPage;
