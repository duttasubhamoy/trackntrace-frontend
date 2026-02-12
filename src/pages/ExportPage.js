import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { CgSpinner } from "react-icons/cg";
import { useAuth } from "../context/AuthContext";

const ExportPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");

  useEffect(() => {
    if (!userData) return;

    const fetchBatches = async () => {
      try {
        const batchesRes = await axios.get("/batches");
        setBatches(batchesRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching batches:", error);
        navigate("/login");
      }
    };

    fetchBatches();
  }, [userData, navigate]);

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
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-teal-800">
            Export
          </h1>
          {companyCashbackEnabled && (
            <div className="bg-white rounded shadow p-6 mb-8 min-h-[180px] flex flex-col justify-start">
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
        </div>
      )}
    </>
  );
};

export default ExportPage;
