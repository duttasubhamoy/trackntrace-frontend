import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import Modal from "react-modal";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination"; // Import the component

const SellerPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gstno: "",
    mobile: "",
    email: "",
    prop_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const sellersPerPage = 10;

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

        if (role === "staff" || role === "plant_owner") {
          navigate("/dashboard");
        }
        // Fetch sellers based on user role
        const sellerResponse = await axios.get("/sellers");
        setSellers(sellerResponse.data);
        setFilteredSellers(sellerResponse.data); // Set initial filtered sellers
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  // Filter sellers based on the search term
  useEffect(() => {
    const filtered = sellers.filter(
      (seller) =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.mobile.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSellers(filtered);
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
    });
    setModalIsOpen(true);
  };
  const closeModal = () => setModalIsOpen(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/add-seller", formData);

      if (response.status === 201) {
        alert("Success", "Seller added successfully.");
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
    "Date Added",
  ];

  // Table Rows
  const tableRows = currentSellers.map((seller) => [
    seller.name,
    seller.address,
    seller.gstno || "N/A",
    seller.mobile,
    seller.email || "N/A",
    seller.prop_name || "N/A",
    new Date(seller.datetime).toLocaleDateString(),
  ]);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar userData={userData} companyCashbackEnabled={companyCashbackEnabled} />
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <CgSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <>
            <Header userData={userData} />
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
              />

              {/* Modal for Adding Seller */}
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
              >
                <div className="p-6">
                  <h2 className="text-xl mb-4">Add Seller</h2>
                  <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-2 gap-4"
                  >
                    {Object.keys(formData).map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1 capitalize">
                          {key.replace("_", " ")}
                        </label>
                        <input
                          type="text"
                          name={key}
                          value={formData[key]}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                    ))}
                    <div className="col-span-2 mt-4">
                      <button
                        type="submit"
                        className="w-full bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg hover:bg-teal-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              </Modal>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerPage;
