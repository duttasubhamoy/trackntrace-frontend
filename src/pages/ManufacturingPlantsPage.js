import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import Modal from "react-modal";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination"; // Import the component

const ManufacturingPlantsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  const [plants, setPlants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlants, setFilteredPlants] = useState([]);
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
  const plantsPerPage = 10;

  // Fetch user data and manufacturing plants
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get("/protected");
        const { name, role, last_login, company_name, company_id } =
          userResponse.data;
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
        } else {
          // Fetch manufacturing plants
          const plantsResponse = await axios.get("/get-manufacturing-plants");
          setPlants(plantsResponse.data);
          setFilteredPlants(plantsResponse.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user or plants data:", error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  // Filter plants based on search term
  useEffect(() => {
    const filtered = plants.filter(
      (plant) =>
        plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.mobile.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlants(filtered);
  }, [searchTerm, plants]);

  // Handle pagination
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastPlant = (currentPage + 1) * plantsPerPage;
  const indexOfFirstPlant = indexOfLastPlant - plantsPerPage;
  const currentPlants = filteredPlants.slice(
    indexOfFirstPlant,
    indexOfLastPlant
  );

  // Handle modal open/close
  const openModal = () => {
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
      const response = await axios.post("/add-manufacturing-plant", formData);
      if (response.status === 201) {
        alert("Manufacturing plant added successfully.");
        setIsSubmitting(false);
        closeModal();
        // Refresh the plants list
        const plantsResponse = await axios.get("/get-manufacturing-plants");
        setPlants(plantsResponse.data);
        setFilteredPlants(plantsResponse.data);
      }
    } catch (error) {
      console.error("Error adding manufacturing plant:", error);
      setIsSubmitting(false);
      alert("Failed to add manufacturing plant. Please try again.");
    }
  };

  // Handle delete functionality
  const handleDelete = async (plantId) => {
    if (window.confirm("Are you sure you want to delete this plant?")) {
      try {
        await axios.delete(`/delete-manufacturing-plant/${plantId}`);
        const updatedPlants = plants.filter((plant) => plant.id !== plantId);
        setPlants(updatedPlants);
        setFilteredPlants(updatedPlants);
      } catch (error) {
        console.error("Error deleting plant:", error);
        alert("Failed to delete manufacturing plant. Please try again.");
      }
    }
  };

  // Table Headers
  const tableHeaders = [
    "Name",
    "Address",
    "GST No",
    "Mobile",
    "Email",
    "Plant Supervisor",
    "Date Added",
    "Actions",
  ];

  // Table Rows
  const tableRows = currentPlants.map((plant) => [
    plant.name,
    plant.address,
    plant.gstno,
    plant.mobile,
    plant.email || "N/A",
    plant.prop_name,
    new Date(plant.datetime).toLocaleDateString(),
    plant.name !== "main_company" ? (
      <div>
        <button
          className="text-blue-500 mr-2"
          onClick={() => console.log("Edit clicked", plant.id)}
        >
          Edit
        </button>
        <button className="text-red-500" onClick={() => handleDelete(plant.id)}>
          Delete
        </button>
      </div>
    ) : null,
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
                buttonText="Add Manufacturing Plant"
                onButtonClick={openModal}
                pageCount={Math.ceil(filteredPlants.length / plantsPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
              />

              {/* Modal for Adding Manufacturing Plant */}
              {/* Modal for Adding Manufacturing Plant */}
              <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Add Manufacturing Plant"
                className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Add Manufacturing Plant
                  </h2>

                  <form onSubmit={handleSubmit}>
                    {/* Input fields arranged in two columns */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          GST No
                        </label>
                        <input
                          type="text"
                          name="gstno"
                          required
                          value={formData.gstno}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Mobile
                        </label>
                        <input
                          type="text"
                          name="mobile"
                          required
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Plant Supervisor
                        </label>
                        <input
                          type="text"
                          name="prop_name"
                          required
                          value={formData.prop_name}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Submit Button (Full Width, Bold Text) */}
                    <div className="mt-6">
                      <button
                        type="submit"
                        className={`w-full bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg ${
                          isSubmitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-teal-700"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "SUBMIT"}
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

export default ManufacturingPlantsPage;
