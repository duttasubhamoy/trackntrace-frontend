import React, { useState, useEffect, useRef } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { FiPackage, FiCheckCircle, FiAlertCircle, FiBox } from "react-icons/fi";

const PackPage = () => {
  const { userData, companyPackingEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Outer QR input and packing info
  const [outerQrInput, setOuterQrInput] = useState("");
  const [isFetchingPackInfo, setIsFetchingPackInfo] = useState(false);
  const [packingInfo, setPackingInfo] = useState(null);
  const [packingError, setPackingError] = useState("");
  
  // Inner QR inputs
  const [innerQrInput, setInnerQrInput] = useState("");
  const [scannedInnerQrs, setScannedInnerQrs] = useState([]);
  const [innerQrError, setInnerQrError] = useState("");
  
  // Completing packing
  const [isCompletingPacking, setIsCompletingPacking] = useState(false);
  
  // Refs for auto-focus
  const outerQrRef = useRef(null);
  const innerQrRef = useRef(null);
  
  // Debounce timer
  const debounceTimer = useRef(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userData) return;

      // Redirect if user doesn't have permission
      if (userData.role === "salesman" || userData.role === "admin") {
        navigate("/dashboard");
        return;
      }

      // Check if packing is enabled
      if (!companyPackingEnabled) {
        navigate("/dashboard");
        return;
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [navigate, userData, companyPackingEnabled]);

  // Debounced outer QR fetch
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (outerQrInput.trim()) {
      debounceTimer.current = setTimeout(() => {
        fetchPackingInfo(outerQrInput.trim());
      }, 50);
    } else {
      // Clear packing info if input is empty
      setPackingInfo(null);
      setPackingError("");
      setScannedInnerQrs([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [outerQrInput]);

  const fetchPackingInfo = async (encryptedUnitId) => {
    setIsFetchingPackInfo(true);
    setPackingError("");
    setPackingInfo(null);
    setScannedInnerQrs([]);

    try {
      const response = await axios.get(`/${encryptedUnitId}/start-packing`);
      setPackingInfo(response.data);
      setPackingError("");
      
      // Focus on inner QR input after successfully fetching packing info
      setTimeout(() => {
        if (innerQrRef.current) {
          innerQrRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching packing info:", error);
      const errorMsg = error.response?.data?.description || error.response?.data?.message || "Failed to fetch packing information";
      setPackingError(errorMsg);
      setPackingInfo(null);
    } finally {
      setIsFetchingPackInfo(false);
    }
  };

  const handleInnerQrSubmit = (e) => {
    e.preventDefault();
    
    if (!innerQrInput.trim()) {
      return;
    }

    const trimmedQr = innerQrInput.trim();

    // Check if already scanned
    if (scannedInnerQrs.includes(trimmedQr)) {
      setInnerQrError("This QR code has already been scanned");
      setInnerQrInput("");
      return;
    }

    // Check if we've reached the limit
    if (scannedInnerQrs.length >= packingInfo.no_of_inner_box) {
      setInnerQrError("All inner boxes have been scanned");
      setInnerQrInput("");
      return;
    }

    // Add to scanned list
    setScannedInnerQrs([...scannedInnerQrs, trimmedQr]);
    setInnerQrInput("");
    setInnerQrError("");
    
    // Keep focus on input
    if (innerQrRef.current) {
      innerQrRef.current.focus();
    }
  };

  const handleCompletePacking = async () => {
    if (!packingInfo || scannedInnerQrs.length !== packingInfo.no_of_inner_box) {
      return;
    }

    setIsCompletingPacking(true);

    try {
      const response = await axios.post(`/${packingInfo.encrypted_unit_id}/populate-primary-qrs`, {
        primary_qrs: scannedInnerQrs
      });

      alert("Packing completed successfully!");
      
      // Reset all states
      setOuterQrInput("");
      setPackingInfo(null);
      setScannedInnerQrs([]);
      setInnerQrError("");
      setPackingError("");
      
      // Focus back on outer QR input
      if (outerQrRef.current) {
        outerQrRef.current.focus();
      }
    } catch (error) {
      console.error("Error completing packing:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.description || "Failed to complete packing";
      alert(errorMsg);
    } finally {
      setIsCompletingPacking(false);
    }
  };

  const handleRemoveInnerQr = (index) => {
    const newScannedQrs = scannedInnerQrs.filter((_, i) => i !== index);
    setScannedInnerQrs(newScannedQrs);
    setInnerQrError("");
  };

  const handleReset = () => {
    setOuterQrInput("");
    setPackingInfo(null);
    setScannedInnerQrs([]);
    setInnerQrError("");
    setPackingError("");
    
    if (outerQrRef.current) {
      outerQrRef.current.focus();
    }
  };

  const isPackingComplete = packingInfo && scannedInnerQrs.length === packingInfo.no_of_inner_box;

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiPackage className="text-3xl text-teal-600" />
                  <h1 className="text-3xl font-bold text-gray-800">Packing Station</h1>
                </div>
                {packingInfo && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Outer QR Input - Only show if no packing info */}
            {!packingInfo && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <label className="block text-lg font-semibold mb-3 text-gray-700">
                  Scan Outer Box QR Code
                </label>
                <input
                  ref={outerQrRef}
                  type="text"
                  value={outerQrInput}
                  onChange={(e) => setOuterQrInput(e.target.value)}
                  placeholder="Scan or enter outer box QR code"
                  autoFocus
                  className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {isFetchingPackInfo && (
                  <div className="mt-4 flex items-center text-teal-600">
                    <CgSpinner className="animate-spin text-2xl mr-2" />
                    <span>Fetching packing information...</span>
                  </div>
                )}
                {packingError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <FiAlertCircle className="text-red-500 text-xl mr-3 mt-0.5" />
                    <p className="text-red-700">{packingError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Packing Info Display */}
            {packingInfo && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                    <FiBox className="mr-2 text-teal-600" />
                    Packing Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Batch Number</p>
                      <p className="text-lg font-semibold text-gray-800">{packingInfo.batch_number}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Product Name</p>
                      <p className="text-lg font-semibold text-gray-800">{packingInfo.product_name}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-lg col-span-2">
                      <p className="text-sm text-teal-700 mb-1">Required Inner Boxes</p>
                      <p className="text-2xl font-bold text-teal-600">{packingInfo.no_of_inner_box}</p>
                    </div>
                  </div>
                </div>

                {/* Inner QR Input */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-lg font-semibold text-gray-700">
                      Scan Inner Box QR Codes
                    </label>
                    <div className="text-lg font-bold">
                      <span className={`${isPackingComplete ? 'text-green-600' : 'text-teal-600'}`}>
                        {scannedInnerQrs.length}
                      </span>
                      <span className="text-gray-500"> / {packingInfo.no_of_inner_box}</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleInnerQrSubmit} className="mb-4">
                    <input
                      ref={innerQrRef}
                      type="text"
                      value={innerQrInput}
                      onChange={(e) => setInnerQrInput(e.target.value)}
                      placeholder="Scan or enter inner box QR code"
                      disabled={isPackingComplete}
                      className={`w-full p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isPackingComplete ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                      }`}
                    />
                  </form>

                  {innerQrError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                      <FiAlertCircle className="text-red-500 mr-2" />
                      <p className="text-red-700">{innerQrError}</p>
                    </div>
                  )}

                  {/* Scanned QRs List */}
                  {scannedInnerQrs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Scanned QR Codes:</p>
                      {scannedInnerQrs.map((qr, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg"
                        >
                          <div className="flex items-center">
                            <FiCheckCircle className="text-green-500 mr-3" />
                            <span className="font-mono text-sm text-gray-800">
                              {index + 1}. {qr.substring(0, 30)}...
                            </span>
                          </div>
                          {!isPackingComplete && (
                            <button
                              onClick={() => handleRemoveInnerQr(index)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Complete Packing Button */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <button
                    onClick={handleCompletePacking}
                    disabled={!isPackingComplete || isCompletingPacking}
                    className={`w-full text-white font-bold px-6 py-4 rounded-lg text-lg transition ${
                      isPackingComplete && !isCompletingPacking
                        ? 'bg-teal-600 hover:bg-teal-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCompletingPacking ? (
                      <span className="flex items-center justify-center">
                        <CgSpinner className="animate-spin text-2xl mr-2" />
                        Completing Packing...
                      </span>
                    ) : (
                      'COMPLETE PACKING'
                    )}
                  </button>
                  {!isPackingComplete && scannedInnerQrs.length > 0 && (
                    <p className="text-center text-sm text-gray-600 mt-3">
                      Scan {packingInfo.no_of_inner_box - scannedInnerQrs.length} more inner box{packingInfo.no_of_inner_box - scannedInnerQrs.length !== 1 ? 'es' : ''} to complete packing
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PackPage;
