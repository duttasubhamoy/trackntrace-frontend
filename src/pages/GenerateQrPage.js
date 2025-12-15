import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import PrintQr from "../components/PrintQr";
import "./print.css";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

const URL_PREFIX = process.env.REACT_APP_QR_PREFIX || "";

const GenerateQrPage = () => {
  // Dialog button loading states
  const [regenLoading, setRegenLoading] = useState(false);
  const [reprintQrLoading, setReprintQrLoading] = useState(false);
  const [reprintPdfLoading, setReprintPdfLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(""); // Store only the batch ID
  const [batchDisplay, setBatchDisplay] = useState(""); // Store the display name
  const [numEntries, setNumEntries] = useState("");
  const [qrType, setQrType] = useState("primary");
  const [showDialog, setShowDialog] = useState(false);
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [labelWidth, setLabelWidth] = useState(32); // Default width in mm (height*1.3)
  const [labelHeight, setLabelHeight] = useState(25); // Default height in mm
  const [dimensionAction, setDimensionAction] = useState(""); // "print" or "reprint"
  const [activeInput, setActiveInput] = useState("height"); // Which input is active: "height" or "width"
  const [noOfInnerBoxes, setNoOfInnerBoxes] = useState(""); // optional for box QR dimensions modal
  const navigate = useNavigate();
  const [qrList, setQrList] = useState([]);
  const [receivedValue, setReceivedValue] = useState(false);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [datesIncluded, setDatesIncluded] = useState(true);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  // Main page button loading states
  const [generateLoading, setGenerateLoading] = useState(false);
  const [printPdfLoading, setPrintPdfLoading] = useState(false);
  const [inputError, setInputError] = useState({ batch: false, num: false, width: false, height: false });

  // Helper to sort batches: primary by numeric batch_number (fallback to string),
  // secondary by product alias alphabetically.
  const sortBatches = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const aBatch = (a.batch_number || "").toString();
      const bBatch = (b.batch_number || "").toString();

      const aNum = parseFloat(aBatch);
      const bNum = parseFloat(bBatch);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum !== bNum) return aNum - bNum;
      } else {
        const cmp = aBatch.localeCompare(bBatch);
        if (cmp !== 0) return cmp;
      }

      const aAlias = (a.product_alias && a.product_alias.product_alias) ? a.product_alias.product_alias : "";
      const bAlias = (b.product_alias && b.product_alias.product_alias) ? b.product_alias.product_alias : "";
      return aAlias.localeCompare(bAlias);
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/protected");
        const { name, role, last_login, company_name, company_id } =
          response.data;
        setUserData({
          name,
          role,
          lastLogin: last_login,
          companyName: company_name,
        });

        // For admin users, company_id might be null - handle this case
        if (company_id) {
          // Only fetch company details if company_id exists
          try {
            const companyRes = await axios.get(`/company/${company_id}`);
            setCompanyCashbackEnabled(companyRes.data.cashback_enabled);
          } catch (companyError) {
            console.error("Error fetching company data:", companyError);
            // Don't navigate away, just set cashback to false as default
            setCompanyCashbackEnabled(false);
          }
        } else {
          // For admin users without company_id, set cashback to false
          // You could also set it to true if you want admin to see all features
          setCompanyCashbackEnabled(false);
        }

        if (role === "salesman") {
          navigate("/dashboard");
        }

  const batchesResponse = await axios.get("/batches");
  setBatches(batchesResponse.data);
  // sort batches for dropdown display
  setFilteredBatches(sortBatches(batchesResponse.data));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleBatchSearch = (e) => {
    const query = e.target.value;
    setBatchDisplay(query);
    setShowDropdown(true);

    if (query) {
      const q = query.toLowerCase();
      const filtered = batches.filter((batch) => {
        const batchNum = (batch.batch_number || "").toString().toLowerCase();
        const alias = (batch.product_alias && batch.product_alias.product_alias)
          ? batch.product_alias.product_alias.toLowerCase()
          : "";
        return batchNum.includes(q) || alias.includes(q);
      });
      setFilteredBatches(sortBatches(filtered));
    } else {
      setFilteredBatches(sortBatches(batches));
    }
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch.id); // Set only the batch ID
    setBatchDisplay(
      `${batch.batch_number} - ${batch.product_alias?.product_alias}`
    );
    setShowDropdown(false);
  };

  const validateInputs = (isPdf = false) => {
    const batchErr = !selectedBatch;
    // Different validation limits based on operation type
    const maxEntries = isPdf ? 200 : 9999;
    const numErr = !numEntries || Number(numEntries) > maxEntries;
    setInputError({ 
      batch: batchErr, 
      num: numErr,
      maxEntries: maxEntries // Store the current limit for error message
    });
    return !(batchErr || numErr);
  };

  const handleGenerateQr = async () => {
    if (!validateInputs(false)) return; // false means use 9999 limit
    setGenerateLoading(true);
    try {
      const endpoint =
        qrType === "primary" ? "/generate-qr" : "/generate-secondary-qr";
      const data = qrType === "primary"
        ? {
            batch_id: selectedBatch,
            num_entries: parseInt(numEntries, 10),
            url_prefix: URL_PREFIX,
          }
        : {
            batch_id: selectedBatch,
            num_entries: parseInt(numEntries, 10),
          };
      const response = await axios.post(
        endpoint,
        data,
        {
          responseType: "blob",
        }
      );
      console.log(response.data.message)
      if (response.data.message === "QR already generated") {
        setShowDialog(true);
      } else {
        // Create a blob from the response data
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        // Set the download filename to "CLARity Data file.csv"
        link.setAttribute("download", "CLARity Data file.csv");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setBatchDisplay("");
        setSelectedBatch("");
        setNumEntries("");
        setInputError({ batch: false, num: false });
      }
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.message === "QR already generated"
      ) {
        setShowDialog(true);
      } else {
        console.error("Error generating QR codes:", error);
      }
    }
    setGenerateLoading(false);
  };

  

  const handleRegenerateQr = async () => {
    setRegenLoading(true);
    try {
      const endpoint =
        qrType === "primary" ? "/regenerate-qr" : "/regenerate-secondary-qr";
      const data = qrType === "primary"
        ? {
            batch_id: selectedBatch,
            url_prefix: URL_PREFIX,
          }
        : {
            batch_id: selectedBatch,
          };
      const response = await axios.post(
        endpoint,
        data,
        {
          responseType: "blob",
        }
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Set the download filename to "CLARity Data file.csv"
      link.setAttribute("download", "CLARity Data file.csv");

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDialog(false);
      setBatchDisplay("");
      setSelectedBatch("");
      setNumEntries("");
    } catch (error) {
      console.error("Error regenerating QR codes:", error);
    } finally {
      setRegenLoading(false);
    }
  };

  // Print PDF handler - now just opens the dimensions modal
  const handlePrintPdf = () => {
    if (!validateInputs(true)) return; // true means use 200 limit for PDF
    setDimensionAction("print"); // Set action to print
    
    // Set default values with correct ratio
    setLabelHeight(25);
    setLabelWidth(Math.round(25 * 1.3)); // Maintain 1.3 ratio
  // reset optional inner boxes when opening modal
  setNoOfInnerBoxes("");
    
    // Reset any dimension errors
    setInputError(prev => ({
      ...prev,
      width: false,
      height: false
    }));
    
    // Default to height input
    setActiveInput("height");
    
    setShowDimensionsModal(true); // Show dimensions modal
  };
  
  // Actual PDF printing function that runs after dimensions are collected
  const executePrintPdf = async () => {
    setPrintPdfLoading(true);
    try {
      let endpoint = "/print-primary-pdf";
      let data = {
        batch_id: selectedBatch,
        num_entries: parseInt(numEntries, 10),
        width: parseInt(labelWidth, 10),
        height: parseInt(labelHeight, 10),
        url_prefix: URL_PREFIX,
        dates_included: datesIncluded,
      };
      if (qrType === "box") {
        endpoint = "/print-secondary-pdf";
        // include optional no_of_inner_boxes only if a non-zero integer was entered
        const n = noOfInnerBoxes === "" ? 0 : parseInt(noOfInnerBoxes, 10);
        if (!isNaN(n) && n > 0) {
          data.no_of_inner_boxes = n;
        }
      }
      const response = await axios.post(
        endpoint,
        data,
        { responseType: "blob" }
      );
      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "qr-codes.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBatchDisplay("");
      setSelectedBatch("");
      setNumEntries("");
      setInputError({ batch: false, num: false });
      setShowDimensionsModal(false);
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.message === "QR already generated"
      ) {
        setShowDimensionsModal(false);
        setShowDialog(true);
      } else {
        console.error("Error printing PDF:", error);
      }
    }
    setPrintPdfLoading(false);
  };

  const handleValueFromChild = (value) => {
    setReceivedValue(value);
  };

  // Reprint PDF handler - now just opens the dimensions modal
  const handleReprintPdf = () => {
    setDimensionAction("reprint"); // Set action to reprint
    
    // Set default values with correct ratio
    setLabelHeight(25);
    setLabelWidth(Math.round(25 * 1.3)); // Maintain 1.3 ratio
  // reset optional inner boxes when opening modal
  setNoOfInnerBoxes("");
    
    // Reset any dimension errors
    setInputError(prev => ({
      ...prev,
      width: false,
      height: false
    }));
    
    // Default to height input
    setActiveInput("height");
    
    setShowDimensionsModal(true); // Show dimensions modal
  };
  
  // Actual PDF reprinting function that runs after dimensions are collected
  const executeReprintPdf = async () => {
    setReprintPdfLoading(true);
    try {
      let endpoint = "/reprint-primary-pdf";
      let data = {
        batch_id: selectedBatch,
        width: parseInt(labelWidth, 10),
        height: parseInt(labelHeight, 10),
        url_prefix: URL_PREFIX,
        dates_included: datesIncluded,
      };
      if (qrType === "box") {
        endpoint = "/reprint-secondary-pdf";
        // include optional no_of_inner_boxes only if a non-zero integer was entered
        const n = noOfInnerBoxes === "" ? 0 : parseInt(noOfInnerBoxes, 10);
        if (!isNaN(n) && n > 0) {
          data.no_of_inner_boxes = n;
        }
      }
      const response = await axios.post(
        endpoint,
        data,
        { responseType: "blob" }
      );
      // Download the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "qr-codes-reprint.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDialog(false);
      setShowDimensionsModal(false);
      setBatchDisplay("");
      setSelectedBatch("");
      setNumEntries("");
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400
      ) {
        // Show the same dialog for known errors
        setShowDimensionsModal(false);
        setShowDialog(true);
      } else {
        console.error("Error reprinting PDF:", error);
      }
    } finally {
      setReprintPdfLoading(false);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-full bg-gray-100 min-h-screen">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <>
          <div className="no-print flex bg-gray-100 min-h-screen">
            <Sidebar userData={userData} companyCashbackEnabled={companyCashbackEnabled} />
            <div className="flex-1">
              <Header userData={userData} />
              <div className="p-6">
                <h1>Generate QR</h1>
                <div className="flex justify-center bg-gray-100">
                  <div className="w-full max-w-xs bg-white p-6 shadow-md rounded-lg">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Select Batch
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={batchDisplay}
                        onChange={handleBatchSearch}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowDropdown(false), 400)
                        }
                        className={`block w-full p-2 border rounded ${
                          inputError.batch
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Type to search batch"
                      />
                      {inputError.batch && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                      {showDropdown && filteredBatches.length > 0 && (
                        <div className="absolute left-0 right-0 bg-white border border-gray-300 mt-1 rounded max-h-40 overflow-y-auto shadow-lg">
                          {filteredBatches.map((batch) => (
                            <div
                              key={batch.id}
                              className="p-2 hover:bg-gray-200 cursor-pointer"
                              onClick={() => handleBatchSelect(batch)}
                            >
                              {batch.batch_number} -{" "}
                              {batch.product_alias?.product_alias}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Number of QR Codes
                      </label>
                      <input
                        type="number"
                        value={numEntries}
                        onChange={(e) => setNumEntries(e.target.value)}
                        className={`block w-full p-2 border rounded ${
                          inputError.num ? "border-red-500" : "border-gray-300"
                        }`}
                        max={9999}
                      />
                      {inputError.num && (
                        <span className="text-red-500 text-xs">
                          {numEntries && Number(numEntries) > (inputError.maxEntries || 9999)
                            ? `Cannot be greater than ${inputError.maxEntries || 9999}`
                            : "Required"}
                        </span>
                      )}
                    </div>

                    {/* Radio buttons for QR type */}
                    <div className="mt-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        QR Type
                      </label>
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          id="primaryQR"
                          name="qrType"
                          value="primary"
                          checked={qrType === "primary"}
                          onChange={() => setQrType("primary")}
                          className="mr-2"
                        />
                        <label
                          htmlFor="primaryQR"
                          className="text-sm text-gray-700"
                        >
                          Primary QR
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="boxQR"
                          name="qrType"
                          value="box"
                          checked={qrType === "box"}
                          onChange={() => setQrType("box")}
                          className="mr-2"
                        />
                        <label
                          htmlFor="boxQR"
                          className="text-sm text-gray-700"
                        >
                          Box QR
                        </label>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={handleGenerateQr}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-60"
                        disabled={generateLoading}
                      >
                        {generateLoading
                          ? "Please wait..."
                          : "Generate and Download QR"}
                      </button>
                    </div>
                    {/* Print QR button hidden as requested */}
                    <div className="mt-6">
                      <button
                        onClick={handlePrintPdf}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full disabled:opacity-60"
                        disabled={printPdfLoading}
                      >
                        {printPdfLoading ? "Please wait..." : "Print PDF"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Box for "QR already generated" */}
          {showDialog && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
              <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
                <p className="text-lg mb-4">
                  QR already generated for given Batch Number
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
                  <button
                    onClick={handleRegenerateQr}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
                    disabled={regenLoading}
                  >
                    {regenLoading ? "Please wait..." : "Regenerate QR"}
                  </button>
                  
                  <button
                    onClick={handleReprintPdf}
                    className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-60"
                    disabled={reprintPdfLoading}
                  >
                    {reprintPdfLoading ? "Please wait..." : "Reprint PDF"}
                  </button>
                  <button
                    onClick={() => {
                      setCancelLoading(true);
                      setShowDialog(false);
                      setTimeout(() => setCancelLoading(false), 500);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-60"
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? "Please wait..." : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PrintQr component */}
          <div className="print-only">
            <PrintQr qrList={qrList} sendDataToParent={handleValueFromChild} />
          </div>

          {/* Dimensions Modal */}
          {showDimensionsModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
              <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
                <h2 className="text-lg font-bold mb-4">Enter Label Dimensions</h2>
                <div className="mb-2">
                  <div className="flex justify-center gap-4 mb-2">
                    <button
                      onClick={() => setActiveInput("height")}
                      className={`px-4 py-2 rounded text-white ${
                        activeInput === "height"
                          ? "bg-teal-600"
                          : "bg-gray-400"
                      }`}
                    >
                      Enter Height
                    </button>
                    <button
                      onClick={() => setActiveInput("width")}
                      className={`px-4 py-2 rounded text-white ${
                        activeInput === "width"
                          ? "bg-teal-600"
                          : "bg-gray-400"
                      }`}
                    >
                      Enter Width
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Width and height maintain a ratio of 1:1.3 (width = height × 1.3)
                  </p>
                </div>

                <div className="flex items-center justify-center mb-4">
                  <input
                    id="datesIncluded"
                    type="checkbox"
                    checked={datesIncluded}
                    onChange={() => setDatesIncluded(prev => !prev)}
                    className="mr-2"
                  />
                  <label htmlFor="datesIncluded" className="text-sm text-gray-700">
                    Include Mfg and Exp Dates
                  </label>
                </div>

                {/* Optional inner boxes field for Box QR */}
                {qrType === 'box' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Inner Boxes (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={noOfInnerBoxes}
                      onChange={(e) => {
                        const v = e.target.value;
                        // allow empty or integer >= 0
                        if (v === "") {
                          setNoOfInnerBoxes("");
                        } else {
                          const parsed = parseInt(v, 10);
                          if (!isNaN(parsed) && parsed >= 0) setNoOfInnerBoxes(String(parsed));
                        }
                      }}
                      className={`w-full p-2 border rounded border-gray-300`}
                      placeholder="Leave empty to skip"
                    />
                    <p className="text-xs text-gray-500 mt-1">Provide a non-zero integer to include this value in the request. Zero or empty will be ignored.</p>
                  </div>
                )}

                {activeInput === "width" ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label Width (mm)
                    </label>
                    <input
                      type="number"
                      value={labelWidth}
                      onChange={(e) => {
                        // Store raw input value
                        const inputValue = e.target.value;
                        
                        // Parse as integer or empty string if invalid
                        const val = inputValue === "" ? "" : parseInt(inputValue, 10);
                        
                        // Update width
                        setLabelWidth(val);
                        
                        // Calculate and update height based on width/1.3 ratio
                        if (val && !isNaN(val) && val > 0) {
                          const calculatedHeight = Math.round(val / 1.3);
                          setLabelHeight(calculatedHeight);
                          
                          // Update error states for both
                          setInputError(prev => ({
                            ...prev,
                            width: false,
                            height: false
                          }));
                        } else {
                          // Update error state
                          setInputError(prev => ({
                            ...prev,
                            width: true
                          }));
                        }
                      }}
                      className={`w-full p-2 border rounded ${
                        inputError.width ? "border-red-500" : "border-gray-300"
                      }`}
                      min="1"
                    />
                    {inputError.width && (
                      <span className="text-red-500 text-xs">Width must be a positive integer</span>
                    )}
                    <div className="mt-2 text-sm text-gray-600">
                      Height: {labelHeight} mm (calculated)
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label Height (mm)
                    </label>
                    <input
                      type="number"
                      value={labelHeight}
                      onChange={(e) => {
                        // Store raw input value
                        const inputValue = e.target.value;
                        
                        // Parse as integer or empty string if invalid
                        const val = inputValue === "" ? "" : parseInt(inputValue, 10);
                        
                        // Update height
                        setLabelHeight(val);
                        
                        // Calculate and update width based on height*1.3 ratio
                        if (val && !isNaN(val) && val > 0) {
                          const calculatedWidth = Math.round(val * 1.3);
                          setLabelWidth(calculatedWidth);
                          
                          // Update error states for both
                          setInputError(prev => ({
                            ...prev,
                            width: false,
                            height: false
                          }));
                        } else {
                          // Update error state
                          setInputError(prev => ({
                            ...prev,
                            height: true
                          }));
                        }
                      }}
                      className={`w-full p-2 border rounded ${
                        inputError.height ? "border-red-500" : "border-gray-300"
                      }`}
                      min="1"
                    />
                    {inputError.height && (
                      <span className="text-red-500 text-xs">Height must be a positive integer</span>
                    )}
                    <div className="mt-2 text-sm text-gray-600">
                      Width: {labelWidth} mm (calculated)
                    </div>
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => {
                      if (dimensionAction === "print") {
                        executePrintPdf();
                      } else {
                        executeReprintPdf();
                      }
                    }}
                    className={`px-4 py-2 rounded text-white ${
                      dimensionAction === "print"
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    disabled={inputError.width || inputError.height || !labelWidth || !labelHeight}
                  >
                    {dimensionAction === "print" ? "Print PDF" : "Reprint PDF"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDimensionsModal(false);
                      // Reset any error states
                      setInputError(prev => ({
                        ...prev,
                        width: false,
                        height: false
                      }));
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GenerateQrPage;
