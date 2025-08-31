import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { CgSpinner } from "react-icons/cg";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

const ExportPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");

  useEffect(() => {
    console.log("Header useEffect triggered"); // Log to check if useEffect is triggered

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
        // Fetch batches for dropdown
        const batchesRes = await axios.get("/batches");
        setBatches(batchesRes.data);
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
        setIsLoading(false);
        console.log("User Data fetched:", response.data); // Log fetched data
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleExportToExcel = async () => {
    if (!selectedBatch) {
      alert("Please select a batch to export.");
      return;
    }
    try {
      // Start download
      const response = await axios.get(`/get-scheme-data/${selectedBatch}`, {
        responseType: "blob", // Important for file download
      });

      // Create a link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `scheme_data_batch_${selectedBatch}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting scheme data:", error);
      alert("Failed to export scheme data.");
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar
        userData={userData}
        companyCashbackEnabled={companyCashbackEnabled}
      />
      <div className="flex-1 flex flex-col h-screen">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <CgSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <>
            <Header userData={userData} />
            <div className="flex flex-col h-full">
              <div className="flex-1 flex flex-col justify-start">
                <h1 className="text-3xl font-bold mb-6 text-teal-800 mx-8 mt-2">
                  Export
                </h1>
                {companyCashbackEnabled && (
                  <div className="bg-white rounded shadow p-6 mb-8 min-h-[180px] flex flex-col justify-start mx-4 md:mx-8">
                    <h2 className="text-xl font-bold mb-4 text-left">
                      Export Scheme Data
                    </h2>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <select
                          className="w-full p-2 border rounded"
                          value={selectedBatch}
                          onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                          <option value="">Select Batch</option>
                          {batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_number}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded text-lg"
                        onClick={handleExportToExcel}
                      >
                        Export to Excel
                      </button>
                    </div>
                  </div>
                )}
                {/* ...other export UI can go here... */}
              </div>
              {/* Optionally, add another vertical section below if needed */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportPage;
