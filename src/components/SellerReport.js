import React, { useState, useEffect } from "react";
import TableWithSearchAndPagination from "./TableWithSearchAndPagination";
import axios from "../utils/axiosConfig";
import * as XLSX from "xlsx";

const SellerReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(["Seller"]); // Dynamic headers
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [reportGenerated, setReportGenerated] = useState(false); // Track if report is generated

  // Fetch products to set table headers dynamically
  const fetchProducts = async () => {
    try {
      const response = await axios.get("/products");
      const products = response.data.map((product) => product.name);
      setTableHeaders(["Seller", ...products]); // Set headers with Seller + Product names
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch sales report data from API
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    try {
      const response = await axios.post("/company-sales-report", {
        start_date: startDate,
        end_date: endDate,
      });
      setData(response.data);
      setFilteredData(response.data);
      setPageCount(Math.ceil(Object.keys(response.data).length / 10)); // 10 rows per page
      setReportGenerated(true); // Set report as generated
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products for headers
  }, []);

  // Filter data based on search term
  useEffect(() => {
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = Object.keys(data)
        .filter(
          (seller) =>
            seller.toLowerCase().includes(lowerSearchTerm) ||
            data[seller].some((item) =>
              item.product_name.toLowerCase().includes(lowerSearchTerm)
            )
        )
        .reduce((acc, seller) => {
          acc[seller] = data[seller];
          return acc;
        }, {});
      setFilteredData(filtered);
      setPageCount(Math.ceil(Object.keys(filtered).length / 10));
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  // Transform data for table rows
  const tableRows = Object.keys(filteredData).map((seller) => {
    const row = [seller];
    tableHeaders.slice(1).forEach((header) => {
      const product = filteredData[seller].find(
        (item) => item.product_name === header
      );
      row.push(product ? product.record_count : 0);
    });
    return row;
  });

  // Handle page change for pagination
  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage.selected);
  };

  // Export table data to Excel
  const exportToExcel = () => {
    const exportData = tableRows.map((row) => {
      const rowData = {};
      tableHeaders.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Seller Report");
    XLSX.writeFile(workbook, "Seller_Report.xlsx");
  };

  // Render table component with pagination and search
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Seller Report</h2>
      <div className="flex space-x-4 mb-6">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-4 py-2 border rounded-lg border-gray-300"
        />
        <button
          onClick={fetchReport}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg"
        >
          Generate Report
        </button>
        {reportGenerated && (
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Export to Excel
          </button>
        )}
      </div>

      {reportGenerated && (
        <TableWithSearchAndPagination
          tableHeaders={tableHeaders}
          tableRows={tableRows.slice(currentPage * 10, (currentPage + 1) * 10)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          buttonText="Refresh Data"
          onButtonClick={fetchReport}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          currentPage={currentPage}
        />
      )}
    </div>
  );
};

export default SellerReport;
