import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import Modal from "react-modal";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import { useAuth } from "../context/AuthContext"; // Import the component

const SellerPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [associateModalIsOpen, setAssociateModalIsOpen] = useState(false);
  const [selectedSellerIndex, setSelectedSellerIndex] = useState(null);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState("");
  const [isLoadingSalesmen, setIsLoadingSalesmen] = useState(false);
  const [isAssociating, setIsAssociating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gstno: "",
    mobile: "",
    email: "",
    prop_name: "",
    type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const sellersPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      if (userData.role === "staff" || userData.role === "plant_owner") {
        navigate("/dashboard");
        return;
      }
      
      try {
        // Fetch sellers based on user role
        const sellerResponse = await axios.get("/sellers");
        setSellers(sellerResponse.data);
        setFilteredSellers(sellerResponse.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sellers:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, userData]);

  // Filter sellers based on the search term
  useEffect(() => {
    const filtered = sellers.filter(
      (seller) =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.mobile.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSellers(filtered);
    setCurrentPage(0); // Reset to first page when search term changes
  }, [searchTerm, sellers]);

  // Handle pagination
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastSeller = (currentPage + 1) * sellersPerPage;
  const indexOfFirstSeller = indexOfLastSeller - sellersPerPage;
  const currentSellers = filteredSellers.slice(
    indexOfFirstSeller,
    indexOfLastSeller
  );

  // Handle modal open/close
  const openModal = () => {
    // Reset formData to empty values when the modal opens
    setFormData({
      name: "",
      address: "",
      gstno: "",
      mobile: "",
      email: "",
      prop_name: "",
      type: "",
    });
    setModalIsOpen(true);
  };
  const closeModal = () => setModalIsOpen(false);

  // Handle associate seller modal
  const handleAssociateSeller = async (rowIndex) => {
    setSelectedSellerIndex(rowIndex);
    setSelectedSalesmanId("");
    setAssociateModalIsOpen(true);
    
    // Fetch salesmen
    setIsLoadingSalesmen(true);
    try {
      const response = await axios.get("/users?type=salesman");
      setSalesmen(response.data);
    } catch (error) {
      console.error("Error fetching salesmen:", error);
      alert("Failed to load salesmen. Please try again.");
    } finally {
      setIsLoadingSalesmen(false);
    }
  };
  const closeAssociateModal = () => {
    setAssociateModalIsOpen(false);
    setSelectedSellerIndex(null);
    setSelectedSalesmanId("");
    setSalesmen([]);
  };

  // Handle association submission
  const handleAssociateSubmit = async () => {
    if (!selectedSalesmanId) {
      alert("Please select a salesman.");
      return;
    }
    
    if (selectedSellerIndex === null) {
      alert("No seller selected.");
      return;
    }
    
    const selectedSeller = currentSellers[selectedSellerIndex];
    
    setIsAssociating(true);
    try {
      const response = await axios.post("/associate-seller", {
        salesman_id: parseInt(selectedSalesmanId),
        seller_id: selectedSeller.id
      });
      
      if (response.status === 201 || response.status === 200) {
        alert(response.data.msg || "Seller successfully associated with salesman.");
        closeAssociateModal();
      }
    } catch (error) {
      console.error("Error associating seller:", error);
      const errorMsg = error.response?.data?.msg || "Failed to associate seller. Please try again.";
      alert(errorMsg);
    } finally {
      setIsAssociating(false);
    }
  };

  // Handle delete seller
  const handleDeleteSeller = async (rowIndex) => {
    const sellerToDelete = currentSellers[rowIndex];
    
    try {
      const response = await axios.delete(`/delete-seller/${sellerToDelete.id}`);
      
      if (response.status === 200) {
        alert(response.data.msg || "Seller deleted successfully.");
        
        // Refresh the sellers list
        const sellerResponse = await axios.get("/sellers");
        setSellers(sellerResponse.data);
        setFilteredSellers(sellerResponse.data);
      }
    } catch (error) {
      console.error("Error deleting seller:", error);
      const errorMsg = error.response?.data?.msg || "Failed to delete seller. Please try again.";
      alert(errorMsg);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert type to lowercase before sending to backend
      const submissionData = {
        ...formData,
        type: formData.type.toLowerCase()
      };
      
      const response = await axios.post("/add-seller", submissionData);

      if (response.status === 201) {
        alert("Seller added successfully.");
        setIsSubmitting(false);
        closeModal();
        // Refresh the sellers list
        const sellerResponse = await axios.get("/sellers");
        setSellers(sellerResponse.data);
        setFilteredSellers(sellerResponse.data);
      }
    } catch (error) {
      console.error("Error adding seller:", error);
      setIsSubmitting(false);
      alert("Error", "Failed to add seller. Please try again.");
    }
  };

  // Table Headers
  const tableHeaders = [
    "Name",
    "Address",
    "GST No",
    "Mobile",
    "Email",
    "Proprietor Name",
    "Type",
  ];

  // Table Rows
  const tableRows = currentSellers.map((seller) => [
    seller.name,
    seller.address,
    seller.gstno || "N/A",
    seller.mobile,
    seller.email || "N/A",
    seller.prop_name || "N/A",
    seller.type || "N/A",
  ]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="p-6">
              <TableWithSearchAndPagination
                tableHeaders={tableHeaders}
                tableRows={tableRows}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                buttonText="Add Seller"
                onButtonClick={openModal}
                pageCount={Math.ceil(filteredSellers.length / sellersPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
                onAssociateClick={handleAssociateSeller}
                showAssociateButton={userData.role === "master" || userData.role === "plant_owner"}
                onDeleteRequest={handleDeleteSeller}
              />

              {/* Modal for Adding Seller */}
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
                style={{
                  content: {
                    maxHeight: "90vh",
                    overflowY: "auto",
                  },
                }}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Seller</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Name - Required */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter seller name"
                        />
                      </div>

                      {/* Mobile - Required */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Mobile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter mobile number"
                        />
                      </div>

                      {/* Address - Required */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter address"
                        />
                      </div>

                      {/* GST No - Optional */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          GST No
                        </label>
                        <input
                          type="text"
                          name="gstno"
                          value={formData.gstno}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter GST number"
                        />
                      </div>

                      {/* Email - Optional */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter email"
                        />
                      </div>

                      {/* Proprietor Name - Optional */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Proprietor Name
                        </label>
                        <input
                          type="text"
                          name="prop_name"
                          value={formData.prop_name}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter proprietor name"
                        />
                      </div>

                      {/* Type - Required */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">-- Select Type --</option>
                          <option value="Distributor">Distributor</option>
                          <option value="Retailer">Retailer</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6">
                      <button
                        type="submit"
                        className={`w-full text-white font-bold px-4 py-3 rounded text-lg ${
                          isSubmitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-teal-600 hover:bg-teal-700"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "ADD SELLER"}
                      </button>
                    </div>
                  </form>
                </div>
              </Modal>

              {/* Modal for Associating Seller */}
              <Modal
                isOpen={associateModalIsOpen}
                onRequestClose={closeAssociateModal}
                className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
              >
                <div className="p-6">
                  <h2 className="text-xl mb-4 font-semibold">Associate Seller with Salesman</h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Select Salesman
                    </label>
                    {isLoadingSalesmen ? (
                      <div className="flex justify-center py-4">
                        <CgSpinner className="animate-spin text-2xl text-teal-600" />
                      </div>
                    ) : (
                      <select
                        value={selectedSalesmanId}
                        onChange={(e) => setSelectedSalesmanId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">-- Select a Salesman --</option>
                        {salesmen.map((salesman) => (
                          <option key={salesman.id} value={salesman.id}>
                            {salesman.name} ({salesman.email || salesman.username})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAssociateSubmit}
                      disabled={isAssociating || !selectedSalesmanId}
                      className={`flex-1 text-white font-bold px-4 py-3 rounded text-lg ${
                        isAssociating || !selectedSalesmanId
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-teal-600 hover:bg-teal-700"
                      }`}
                    >
                      {isAssociating ? "Associating..." : "Associate Seller"}
                    </button>
                    <button
                      onClick={closeAssociateModal}
                      disabled={isAssociating}
                      className="flex-1 bg-gray-500 text-white font-bold px-4 py-3 rounded text-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
      )}
    </>
  );
};

export default SellerPage;
