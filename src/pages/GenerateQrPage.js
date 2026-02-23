import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import PrintQr from "../components/PrintQr";
import "./print.css";

const URL_PREFIX = process.env.REACT_APP_QR_PREFIX || "";

const GenerateQrPage = () => {
  const { userData } = useAuth();
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
    const fetchBatches = async () => {
      try {
        if (userData?.role === "salesman") {
          navigate("/dashboard");
          return;
        }

        const batchesResponse = await axios.get("/batches");
        setBatches(batchesResponse.data);
        setFilteredBatches(sortBatches(batchesResponse.data));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching batches:", error);
        setIsLoading(false);
      }
    };

    if (userData) {
      fetchBatches();
    }
  }, [navigate, userData]);

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
      let endpoint;
    let data;

    if (qrType === "box") {
      endpoint = "/print-secondary-pdf";
      data = {
        batch_id: selectedBatch,
        num_entries: parseInt(numEntries, 10),
        width: parseInt(labelWidth, 10),
        height: parseInt(labelHeight, 10),
        dates_included: datesIncluded,
      };
      const n = noOfInnerBoxes === "" ? 0 : parseInt(noOfInnerBoxes, 10);
      if (!isNaN(n) && n > 0) {
        data.no_of_inner_boxes = n;
      }
    } else {
      endpoint = "/print-primary-pdf";
      data = {
        batch_id: selectedBatch,
        num_entries: parseInt(numEntries, 10),
        width: parseInt(labelWidth, 10),
        height: parseInt(labelHeight, 10),
        url_prefix: URL_PREFIX,      // only for primary
        dates_included: datesIncluded,
      };
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
    <>
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-full bg-gray-100 min-h-screen">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="no-print p-6">
          <h1>Generate QR</h1>
  
          <div className="flex justify-center bg-gray-100">
            <div className="w-full max-w-xs bg-white p-6 shadow-md rounded-lg">
              
              {/* Batch selector */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Select Batch
              </label>
  
              <div className="relative w-full">
                <input
                  type="text"
                  value={batchDisplay}
                  onChange={handleBatchSearch}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 400)}
                  className={`block w-full p-2 border rounded ${
                    inputError.batch ? "border-red-500" : "border-gray-300"
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
                        {batch.batch_number} - {batch.product_alias?.product_alias}
                      </div>
                    ))}
                  </div>
                )}
              </div>
  
              {/* Number of QR */}
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
                    {numEntries &&
                    Number(numEntries) > (inputError.maxEntries || 9999)
                      ? `Cannot be greater than ${inputError.maxEntries || 9999}`
                      : "Required"}
                  </span>
                )}
              </div>
  
              {/* QR Type */}
              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  QR Type
                </label>
  
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="primaryQR"
                    name="qrType"
                    checked={qrType === "primary"}
                    onChange={() => setQrType("primary")}
                    className="mr-2"
                  />
                  <label htmlFor="primaryQR" className="text-sm text-gray-700">
                    Primary QR
                  </label>
                </div>
  
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="boxQR"
                    name="qrType"
                    checked={qrType === "box"}
                    onChange={() => setQrType("box")}
                    className="mr-2"
                  />
                  <label htmlFor="boxQR" className="text-sm text-gray-700">
                    Box QR
                  </label>
                </div>
              </div>
  
              {/* Generate */}
              <div className="mt-6">
                <button
                  onClick={handleGenerateQr}
                  disabled={generateLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-60"
                >
                  {generateLoading ? "Please wait..." : "Generate and Download QR"}
                </button>
              </div>
  
              {/* Print PDF */}
              <div className="mt-6">
                <button
                  onClick={handlePrintPdf}
                  disabled={printPdfLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full disabled:opacity-60"
                >
                  {printPdfLoading ? "Please wait..." : "Print PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <p className="text-lg mb-4">
              QR already generated for given Batch Number
            </p>
  
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleRegenerateQr}
                disabled={regenLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {regenLoading ? "Please wait..." : "Regenerate QR"}
              </button>
  
              <button
                onClick={handleReprintPdf}
                className="bg-purple-600 text-white px-4 py-2 rounded"
              >
                Reprint PDF
              </button>
  
              <button
                onClick={() => setShowDialog(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions Modal */}
      {showDimensionsModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Set Label Dimensions</h2>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Height (mm)
              </label>
              <input
                type="number"
                value={labelHeight}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10) || 0;
                  setLabelHeight(h);
                  if (activeInput === "height") {
                    setLabelWidth(Math.round(h * 1.3));
                  }
                }}
                onFocus={() => setActiveInput("height")}
                className={`block w-full p-2 border rounded ${
                  inputError.height ? "border-red-500" : "border-gray-300"
                }`}
                min="1"
              />
              {inputError.height && (
                <span className="text-red-500 text-xs">Height must be greater than 0</span>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Width (mm)
              </label>
              <input
                type="number"
                value={labelWidth}
                onChange={(e) => {
                  const w = parseInt(e.target.value, 10) || 0;
                  setLabelWidth(w);
                  if (activeInput === "width") {
                    setLabelHeight(Math.round(w / 1.3));
                  }
                }}
                onFocus={() => setActiveInput("width")}
                className={`block w-full p-2 border rounded ${
                  inputError.width ? "border-red-500" : "border-gray-300"
                }`}
                min="1"
              />
              {inputError.width && (
                <span className="text-red-500 text-xs">Width must be greater than 0</span>
              )}
            </div>

            {qrType === "box" && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Number of Inner Boxes (optional)
                </label>
                <input
                  type="number"
                  value={noOfInnerBoxes}
                  onChange={(e) => setNoOfInnerBoxes(e.target.value)}
                  className="block w-full p-2 border rounded border-gray-300"
                  min="0"
                  placeholder="Leave empty if not applicable"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={datesIncluded}
                  onChange={(e) => setDatesIncluded(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include Dates</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDimensionsModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (labelHeight <= 0 || labelWidth <= 0) {
                    setInputError(prev => ({
                      ...prev,
                      height: labelHeight <= 0,
                      width: labelWidth <= 0
                    }));
                    return;
                  }
                  
                  if (dimensionAction === "print") {
                    executePrintPdf();
                  } else if (dimensionAction === "reprint") {
                    executeReprintPdf();
                  }
                }}
                disabled={printPdfLoading || reprintPdfLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-60"
              >
                {(printPdfLoading || reprintPdfLoading) ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Print-only */}
      <div className="print-only">
        <PrintQr qrList={qrList} sendDataToParent={handleValueFromChild} />
      </div>
  
      {receivedValue && <PrintQr qrList={qrList} />}
    </>
  );
};  

export default GenerateQrPage;
