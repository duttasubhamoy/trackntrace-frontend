import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiDownload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";

const StocksReportPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const navigate = useNavigate();
  const [stockData, setStockData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    seller_id: "",
    product_id: "",
    batch_id: "",
    exp_date_from: "",
    exp_date_to: "",
  });

  useEffect(() => {
    if (!userData) return;

    setIsLoading(false);
    
    // Fetch filter options and stock report data
    fetchFilterOptions();
    fetchStockReport();
  }, [userData, navigate]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch sellers
      const sellersRes = await axios.get("/sellers");
      setSellers(sellersRes.data || []);

      // Fetch products
      const productsRes = await axios.get("/products");
      setProducts(productsRes.data || []);

      // Don't fetch batches initially - they will be fetched when a product is selected
    } catch (error) {
      console.error("Error fetching filter options:", error);
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

  const fetchStockReport = async () => {
    setIsLoadingReport(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.seller_id) params.append("seller_id", filters.seller_id);
      if (filters.product_id) params.append("product_id", filters.product_id);
      if (filters.batch_id) params.append("batch_id", filters.batch_id);
      if (filters.exp_date_from) params.append("exp_date_from", filters.exp_date_from);
      if (filters.exp_date_to) params.append("exp_date_to", filters.exp_date_to);

      const queryString = params.toString();
      const url = queryString ? `/stock-report?${queryString}` : "/stock-report";
      
      const response = await axios.get(url);
      setStockData(response.data.stock || []);
      setTotalRecords(response.data.total_records || 0);
    } catch (error) {
      console.error("Error fetching stock report:", error);
      alert(error.response?.data?.description || "Failed to load stock report. Please try again.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // If product is changed, clear batch and fetch new batches for the selected product
    if (name === "product_id") {
      setFilters((prev) => ({
        ...prev,
        product_id: value,
        batch_id: "", // Clear batch selection when product changes
      }));
      fetchBatchesForProduct(value);
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleApplyFilters = () => {
    fetchStockReport();
  };

  const handleClearFilters = () => {
    setFilters({
      seller_id: "",
      product_id: "",
      batch_id: "",
      exp_date_from: "",
      exp_date_to: "",
    });
    // Fetch report with cleared filters
    setTimeout(() => {
      fetchStockReport();
    }, 0);
  };

  const exportToExcel = () => {
    if (stockData.length === 0) {
      alert("No data to export.");
      return;
    }

    // Prepare data for Excel
    const excelData = stockData.map((item, index) => ({
      "S.No": index + 1,
      "Product Name": item.product_name,
      "Batch Number": item.batch_number,
      "Expiry Date": item.exp_date || "N/A",
      "Seller Name": item.seller_name,
      "Stock Count": item.stock_count,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
      { wch: 8 },  // S.No
      { wch: 30 }, // Product Name
      { wch: 20 }, // Batch Number
      { wch: 15 }, // Expiry Date
      { wch: 30 }, // Seller Name
      { wch: 12 }, // Stock Count
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Stock_Report_${timestamp}.xlsx`;

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
                    <h2 className="text-2xl font-bold text-teal-700">Stocks Report</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Total Records: <span className="font-semibold">{totalRecords}</span>
                    </p>
                  </div>
                  <button
                    onClick={exportToExcel}
                    disabled={stockData.length === 0}
                    className={`flex items-center px-4 py-2 rounded font-medium ${
                      stockData.length === 0
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
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Seller Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seller
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

                    {/* Product Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <select
                        name="product_id"
                        value={filters.product_id}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">All Products</option>
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
                        Batch
                      </label>
                      <select
                        name="batch_id"
                        value={filters.batch_id}
                        onChange={handleFilterChange}
                        disabled={!filters.product_id}
                        className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          !filters.product_id ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        title={!filters.product_id ? "Please select a product first" : ""}
                      >
                        <option value="">
                          {!filters.product_id ? "Select a product first" : "All Batches"}
                        </option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batch_number}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expiry Date From */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry From
                      </label>
                      <input
                        type="date"
                        name="exp_date_from"
                        value={filters.exp_date_from}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Expiry Date To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry To
                      </label>
                      <input
                        type="date"
                        name="exp_date_to"
                        value={filters.exp_date_to}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleApplyFilters}
                      className="bg-teal-600 text-white px-6 py-2 rounded font-medium hover:bg-teal-700 transition"
                    >
                      Apply Filters
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
                ) : stockData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No stock data available.</p>
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
                            Product Name
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Batch Number
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Expiry Date
                          </th>
                          <th className="p-3 text-left text-teal-700 font-semibold border-b-2 border-teal-200">
                            Seller Name
                          </th>
                          <th className="p-3 text-right text-teal-700 font-semibold border-b-2 border-teal-200">
                            Stock Count
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockData.map((item, index) => (
                          <tr
                            key={`${item.product_id}-${item.batch_id}-${item.seller_id}`}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-teal-50 transition-colors`}
                          >
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {index + 1}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-800 font-medium">
                              {item.product_name}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.batch_number}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.exp_date ? new Date(item.exp_date).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-gray-700">
                              {item.seller_name}
                            </td>
                            <td className="p-3 border-b border-gray-200 text-right text-gray-800 font-semibold">
                              {item.stock_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-teal-50">
                          <td
                            colSpan="5"
                            className="p-3 text-right font-semibold text-teal-800 border-t-2 border-teal-200"
                          >
                            Total Stock:
                          </td>
                          <td className="p-3 text-right font-bold text-teal-800 border-t-2 border-teal-200">
                            {stockData.reduce((sum, item) => sum + item.stock_count, 0)}
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

export default StocksReportPage;
