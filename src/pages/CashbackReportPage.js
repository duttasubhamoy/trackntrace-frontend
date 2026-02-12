import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiDownload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

const CashbackReportPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const navigate = useNavigate();
  const [cashbackData, setCashbackData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sellers, setSellers] = useState([]);
  const [reportType, setReportType] = useState("detailed"); // "detailed" or "consolidated"
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    seller_id: "",
  });

  useEffect(() => {
    if (userData) {
      setIsLoading(false);
      fetchSellers();
    }
  }, [userData]);

  const fetchSellers = async () => {
    try {
      const sellersRes = await axios.get("/sellers");
      setSellers(sellersRes.data || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchCashbackReport = async () => {
    // Validate date fields
    if (!filters.start_date || !filters.end_date) {
      alert("Please select both start date and end date.");
      return;
    }

    setIsLoadingReport(true);
    try {
      const payload = {
        start_date: filters.start_date,
        end_date: filters.end_date,
      };

      // Add seller_id only if selected
      if (filters.seller_id) {
        payload.seller_id = parseInt(filters.seller_id);
      }

      const response = await axios.post("/show-redeem-master", payload);
      setCashbackData(response.data.redeemed_cashbacks || []);
      setTotalRecords(response.data.total_records || 0);
      setTotalAmount(response.data.total_amount_redeemed || 0);
    } catch (error) {
      console.error("Error fetching cashback report:", error);
      const errorMsg = error.response?.data?.message || "Failed to load cashback report. Please try again.";
      alert(errorMsg);
      // Clear data on error
      setCashbackData([]);
      setTotalRecords(0);
      setTotalAmount(0);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchCashbackReport();
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      seller_id: "",
    });
    setReportType("detailed");
    // Clear report data
    setCashbackData([]);
    setTotalRecords(0);
    setTotalAmount(0);
  };

  // Group cashback data by seller for consolidated view
  const getConsolidatedData = () => {
    const grouped = {};
    
    cashbackData.forEach((item) => {
      const sellerId = item.seller_id;
      if (!grouped[sellerId]) {
        grouped[sellerId] = {
          seller_id: sellerId,
          seller_name: item.seller_name,
          seller_mobile: item.seller_mobile,
          total_amount: 0,
          redemption_count: 0,
        };
      }
      grouped[sellerId].total_amount += item.amount_redeemed;
      grouped[sellerId].redemption_count += 1;
    });

    return Object.values(grouped);
  };

  const exportToExcel = () => {
    if (cashbackData.length === 0) {
      alert("No data to export.");
      return;
    }

    // Prepare data for Excel
    const excelData = cashbackData.map((item, index) => ({
      "S.No": index + 1,
      "Redeem ID": item.redeem_id,
      "Seller Name": item.seller_name,
      "Seller Mobile": item.seller_mobile,
      "Redeemed Date": new Date(item.current_datetime).toLocaleDateString(),
      "Redeemed Time": new Date(item.current_datetime).toLocaleTimeString(),
      "Amount Redeemed": item.amount_redeemed,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 8 },  // S.No
      { wch: 15 }, // Redeem ID
      { wch: 30 }, // Seller Name
      { wch: 15 }, // Seller Mobile
      { wch: 15 }, // Redeemed Date
      { wch: 15 }, // Redeemed Time
      { wch: 15 }, // Amount Redeemed
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cashback Report");

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Cashback_Report_${timestamp}.xlsx`;

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
                    <h2 className="text-2xl font-bold text-teal-700">Cashback Report</h2>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <p>
                        Total Records: <span className="font-semibold">{totalRecords}</span>
                      </p>
                      <p>
                        Total Amount Redeemed: <span className="font-semibold text-green-700">₹{totalAmount.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={exportToExcel}
                    disabled={cashbackData.length === 0}
                    className={`flex items-center px-4 py-2 rounded font-medium ${
                      cashbackData.length === 0
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
                  <h3 className="text-lg font-semibold text-teal-700 mb-3">Filters</h3>
                  
                  {/* Report Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="reportType"
                          value="detailed"
                          checked={reportType === "detailed"}
                          onChange={(e) => setReportType(e.target.value)}
                          className="mr-2 cursor-pointer"
                        />
                        <span className="text-gray-700">Detailed View</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="reportType"
                          value="consolidated"
                          checked={reportType === "consolidated"}
                          onChange={(e) => setReportType(e.target.value)}
                          className="mr-2 cursor-pointer"
                        />
                        <span className="text-gray-700">Consolidated View (Total by Seller)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Start Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    {/* End Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    {/* Seller Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seller (Optional)
                      </label>
                      <select
                        name="seller_id"
                        value={filters.seller_id}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">All Sellers</option>
                        {sellers.map((seller) => (
                          <option key={seller.id} value={seller.id}>
                            {seller.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleApplyFilters}
                      disabled={!filters.start_date || !filters.end_date}
                      className={`px-6 py-2 rounded font-medium transition ${
                        !filters.start_date || !filters.end_date
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-teal-600 text-white hover:bg-teal-700"
                      }`}
                    >
                      Generate Report
                    </button>
                    <button
                      onClick={handleClearFilters}
                      className="bg-gray-500 text-white px-6 py-2 rounded font-medium hover:bg-gray-600 transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingReport ? (
                  <div className="flex justify-center items-center py-12">
                    <CgSpinner className="animate-spin text-4xl text-teal-600" />
                  </div>
                ) : cashbackData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      {filters.start_date && filters.end_date 
                        ? "No cashback redemption data found for the selected criteria." 
                        : "Please select date range and click 'Generate Report' to view data."}
                    </p>
                  </div>
                ) : reportType === "detailed" ? (
                  /* Detailed Table Section */
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-teal-100">
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            S.No
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Redeem ID
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Seller Name
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Seller Mobile
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Redeemed Date
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Redeemed Time
                          </th>
                          <th className="p-3 text-right text-teal-700 font-semibold border-b-2 border-teal-200">
                            Amount Redeemed
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashbackData.map((item, index) => (
                          <tr
                            key={item.redeem_id}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-teal-50 transition-colors`}
                          >
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {index + 1}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-800 font-medium">
                              {item.redeem_id}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-800">
                              {item.seller_name}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.seller_mobile}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {new Date(item.current_datetime).toLocaleDateString()}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {new Date(item.current_datetime).toLocaleTimeString()}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-right text-green-700 font-semibold">
                              ₹{item.amount_redeemed.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-teal-50">
                          <td
                            colSpan="6"
                            className="p-3 text-right font-semibold text-teal-800 border-t-2 border-teal-200"
                          >
                            Total Amount Redeemed:
                          </td>
                          <td className="p-3 text-right font-bold text-green-700 border-t-2 border-teal-200 text-lg">
                            ₹{totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  /* Consolidated Table Section */
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-teal-100">
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            S.No
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Seller Name
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Seller Mobile
                          </th>
                          <th className="p-3 text-center text-teal-700 font-semibold border-b-2 border-teal-200">
                            Total Redemptions
                          </th>
                          <th className="p-3 text-right text-teal-700 font-semibold border-b-2 border-teal-200">
                            Total Amount Redeemed
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getConsolidatedData().map((item, index) => (
                          <tr
                            key={item.seller_id}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-teal-50 transition-colors`}
                          >
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {index + 1}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-800 font-medium">
                              {item.seller_name}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.seller_mobile}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-center text-gray-700">
                              {item.redemption_count}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-right text-green-700 font-semibold">
                              ₹{item.total_amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-teal-50">
                          <td
                            colSpan="4"
                            className="p-3 text-right font-semibold text-teal-800 border-t-2 border-teal-200"
                          >
                            Grand Total:
                          </td>
                          <td className="p-3 text-right font-bold text-green-700 border-t-2 border-teal-200 text-lg">
                            ₹{totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

        </div>
      )}
    </>
  );
};

export default CashbackReportPage;
