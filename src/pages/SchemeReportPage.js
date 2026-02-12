import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiDownload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

const SchemeReportPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const navigate = useNavigate();
  const [schemeData, setSchemeData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  useEffect(() => {
    if (!userData) return;

    setIsLoading(false);
    fetchProducts();
  }, [userData, navigate]);

  const fetchProducts = async () => {
    try {
      const productsRes = await axios.get("/products");
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchBatchesForProduct = async (productId) => {
    if (!productId) {
      setBatches([]);
      return;
    }
    
    try {
      const batchesRes = await axios.get(`/batches?product_id=${productId}`);
      setBatches(batchesRes.data || []);
    } catch (error) {
      console.error("Error fetching batches for product:", error);
      setBatches([]);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    setSelectedBatch(""); // Clear batch selection
    setSchemeData([]); // Clear previous data
    setTotalRecords(0);
    if (productId) {
      fetchBatchesForProduct(productId);
    } else {
      setBatches([]);
    }
  };

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
    setSchemeData([]); // Clear previous data
    setTotalRecords(0);
  };

  const handleSubmit = async () => {
    if (!selectedBatch) {
      alert("Please select both product and batch.");
      return;
    }

    setIsLoadingReport(true);
    try {
      const response = await axios.get(`/get-scheme-data-raw/${selectedBatch}`);
      setSchemeData(response.data.data || []);
      setTotalRecords(response.data.total_records || 0);
    } catch (error) {
      console.error("Error fetching scheme report:", error);
      const errorMsg = error.response?.data?.msg || "Failed to load scheme report. Please try again.";
      alert(errorMsg);
      setSchemeData([]);
      setTotalRecords(0);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const exportToExcel = () => {
    if (schemeData.length === 0) {
      alert("No data to export.");
      return;
    }

    // Prepare data for Excel
    const excelData = schemeData.map((item, index) => ({
      "S.No": index + 1,
      "Name": item.name || "N/A",
      "Mobile": item.mobile || "N/A",
      "Retailer Name": item.retailer_name || "N/A",
      "Scheme Item": item.scheme_item_name || "N/A",
      "Address": item.address || "N/A",
      "Pincode": item.pincode || "N/A",
      "Docket No": item.docket_no || "N/A",
      "Date": item.date || "N/A",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 8 },  // S.No
      { wch: 25 }, // Name
      { wch: 15 }, // Mobile
      { wch: 25 }, // Retailer Name
      { wch: 20 }, // Scheme Item
      { wch: 40 }, // Address
      { wch: 10 }, // Pincode
      { wch: 15 }, // Docket No
      { wch: 20 }, // Date
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scheme Report");

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Scheme_Report_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="p-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-teal-700">Scheme Report</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Total Records: <span className="font-semibold">{totalRecords}</span>
                    </p>
                  </div>
                  <button
                    onClick={exportToExcel}
                    disabled={schemeData.length === 0}
                    className={`flex items-center px-4 py-2 rounded font-medium ${
                      schemeData.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    <FiDownload className="mr-2" />
                    Export to Excel
                  </button>
                </div>

                {/* Filters Section */}
                <div className="bg-teal-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-teal-700 mb-3">Select Product & Batch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedProduct}
                        onChange={handleProductChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.product_alias} - {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Batch Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedBatch}
                        onChange={handleBatchChange}
                        disabled={!selectedProduct}
                        className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          !selectedProduct ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        title={!selectedProduct ? "Please select a product first" : ""}
                        required
                      >
                        <option value="">
                          {!selectedProduct ? "Select a product first" : "Select Batch"}
                        </option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batch_number}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedBatch || isLoadingReport}
                      className={`px-6 py-2 rounded font-medium transition ${
                        !selectedBatch || isLoadingReport
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-teal-600 text-white hover:bg-teal-700"
                      }`}
                    >
                      {isLoadingReport ? "Loading..." : "Submit"}
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingReport ? (
                  <div className="flex justify-center items-center py-12">
                    <CgSpinner className="animate-spin text-4xl text-teal-600" />
                  </div>
                ) : schemeData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      {selectedBatch 
                        ? "No scheme data available for the selected batch." 
                        : "Please select a product and batch, then click Submit to view data."}
                    </p>
                  </div>
                ) : (
                  /* Table Section */
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-teal-100">
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            S.No
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Name
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Mobile
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Retailer Name
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Scheme Item
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Address
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Pincode
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Docket No
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {schemeData.map((item, index) => (
                          <tr
                            key={index}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-teal-50 transition-colors`}
                          >
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {index + 1}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-800 font-medium">
                              {item.name || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.mobile || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.retailer_name || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.scheme_item_name || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700 text-sm">
                              {item.address || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.pincode || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.docket_no || "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.date ? new Date(item.date).toLocaleString() : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
        )}
    </>
  );
};

export default SchemeReportPage;
