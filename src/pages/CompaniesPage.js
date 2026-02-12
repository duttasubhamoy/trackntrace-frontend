import React, { useState, useEffect } from "react";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";

const CompaniesPage = () => {
  const { userData, companies: authCompanies } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [companiesPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editCompanyData, setEditCompanyData] = useState({
    name: "",
    address: "",
    gstno: "",
    mobile: "",
    email: "",
    type: "Manufacturer",
    prop_name: "",
    // Company features/settings
    cashback_enabled: false,
    packing_enabled: false,
    tracing_enabled: false,
    salesman_tracking_enabled: false,
    accounting_enabled: false,
    // Additional fields
    registration_no: "",
    customer_care_no: "",
    // Extra fields for dynamic configuration
    extra_field_products: {},
    extra_field_batch: {},
  });
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: "",
    gstno: "",
    mobile: "",
    email: "",
    type: "Manufacturer", // Default value
    prop_name: "",
    // Company features/settings
    cashback_enabled: false,
    packing_enabled: false,
    tracing_enabled: false,
    salesman_tracking_enabled: false,
    accounting_enabled: false,
    // Additional fields
    registration_no: "",
    customer_care_no: "",
    // Extra fields for dynamic configuration
    extra_field_products: {},
    extra_field_batch: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedCompanyForFeatures, setSelectedCompanyForFeatures] = useState(null);
  const [featuresData, setFeaturesData] = useState({
    cashback_enabled: false,
    packing_enabled: false,
    tracing_enabled: false,
    salesman_tracking_enabled: false,
    accounting_enabled: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      // Ensure only admin can access this page
      if (userData.role !== "admin") {
        navigate("/login");
        return;
      }

      try {
        // Fetch companies data
        const companiesRes = await axios.get("/companies");
        setCompanies(companiesRes.data);
        setFilteredCompanies(companiesRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate, userData]);

  useEffect(() => {
    // Filter companies based on the search term
    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
    setCurrentPage(0); // Reset to first page when search term changes
  }, [searchTerm, companies]);

  const handlePageClick = (page) => {
    setCurrentPage(page); // Use `page` directly instead of `data.selected`
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setNewCompany((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAddCompany = async () => {
    if (
      !newCompany.name.trim() ||
      !newCompany.address.trim() ||
      !newCompany.mobile.trim() ||
      !newCompany.prop_name.trim()
    ) {
      alert(
        "Please fill in all the required fields: Name, Address, Mobile, and Proprietor Name."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("/register", newCompany);
      alert("Company added successfully!");

      const companiesRes = await axios.get("/companies");
      setCompanies(companiesRes.data);
      setFilteredCompanies(companiesRes.data);
      setShowModal(false);
      setNewCompany({
        name: "",
        address: "",
        gstno: "",
        mobile: "",
        email: "",
        type: "Manufacturer",
        prop_name: "",
        // Company features/settings
        cashback_enabled: false,
        packing_enabled: false,
        tracing_enabled: false,
        salesman_tracking_enabled: false,
        accounting_enabled: false,
        // Additional fields
        registration_no: "",
        customer_care_no: "",
        // Extra fields for dynamic configuration
        extra_field_products: {},
        extra_field_batch: {},
      });
    } catch (error) {
      console.error("Error adding company:", error);
      alert("Failed to add company. Please check your input.");
    }
    setIsSubmitting(false);
  };

  const indexOfLastCompany = (currentPage + 1) * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;

  // Slice the companies for the current page
  const currentCompanies = filteredCompanies.slice(
    indexOfFirstCompany,
    indexOfLastCompany
  );

  // Calculate the total page count
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

    const handleEditCompany = (index) => {
      const companyToEdit = filteredCompanies[index];
      setSelectedCompany(companyToEdit);
      setEditCompanyData({
        name: companyToEdit.name,
        address: companyToEdit.address,
        gstno: companyToEdit.gstno || "",
        mobile: companyToEdit.mobile,
        email: companyToEdit.email || "",
        type: companyToEdit.type || "Manufacturer",
        prop_name: companyToEdit.prop_name || "",
        // Company features/settings
        cashback_enabled: companyToEdit.cashback_enabled || false,
        packing_enabled: companyToEdit.packing_enabled || false,
        tracing_enabled: companyToEdit.tracing_enabled || false,
        salesman_tracking_enabled: companyToEdit.salesman_tracking_enabled || false,
        accounting_enabled: companyToEdit.accounting_enabled || false,
        // Additional fields
        registration_no: companyToEdit.registration_no || "",
        customer_care_no: companyToEdit.customer_care_no || "",
        // Extra fields for dynamic configuration
        extra_field_products: companyToEdit.extra_field_products || {},
        extra_field_batch: companyToEdit.extra_field_batch || {},
      });
      setShowEditModal(true);
    };

    const handleEditInputChange = (e) => {
      setEditCompanyData({
        ...editCompanyData,
        [e.target.name]: e.target.value,
      });
    };

  const handleEditCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEditCompanyData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };    const handleUpdateCompany = async () => {
      if (!selectedCompany) return;

      // Validate required fields
      if (
        !editCompanyData.name.trim() ||
        !editCompanyData.address.trim() ||
        !editCompanyData.mobile.trim() ||
        !editCompanyData.prop_name.trim()
      ) {
        alert(
          "Please fill in all the required fields: Name, Address, Mobile, and Proprietor Name."
        );
        return;
      }

      try {
        await axios.put(
          `/update-company?company_id=${selectedCompany.id}`,
          editCompanyData
        );
        alert("Company updated successfully!");

        const updatedCompanies = companies.map((company) =>
          company.id === selectedCompany.id
            ? { ...company, ...editCompanyData }
            : company
        );

        setCompanies(updatedCompanies);
        setFilteredCompanies(updatedCompanies);
        setShowEditModal(false);
      } catch (error) {
        console.error("Error updating company:", error);
        alert("Failed to update company. Please try again.");
      }
    };

  const handleManageFeatures = (index) => {
    const company = filteredCompanies[index];
    setSelectedCompanyForFeatures(company);
    setFeaturesData({
      cashback_enabled: company.cashback_enabled || false,
      packing_enabled: company.packing_enabled || false,
      tracing_enabled: company.tracing_enabled || false,
      salesman_tracking_enabled: company.salesman_tracking_enabled || false,
      accounting_enabled: company.accounting_enabled || false,
    });
    setShowFeaturesModal(true);
  };

  const handleFeatureCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFeaturesData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleUpdateFeatures = async () => {
    if (!selectedCompanyForFeatures) return;

    try {
      const response = await axios.put(
        `/update-company-features/${selectedCompanyForFeatures.id}`,
        featuresData
      );
      
      alert(response.data.msg || "Company features updated successfully!");

      // Update local state
      const updatedCompanies = companies.map((company) =>
        company.id === selectedCompanyForFeatures.id
          ? { ...company, ...featuresData }
          : company
      );

      setCompanies(updatedCompanies);
      setFilteredCompanies(updatedCompanies);
      setShowFeaturesModal(false);
    } catch (error) {
      console.error("Error updating company features:", error);
      alert(error.response?.data?.msg || "Failed to update company features. Please try again.");
    }
  };

  // Updated Table Headers
  const tableHeaders = [
    "Name",
    "Type",
    "Proprietor",
    "Mobile",
    "Address",
    "Email",
    "GST No",
    "Features",
  ];

  // Updated Table Rows
  const tableRows = currentCompanies.map((company) => [
    company.name,
    company.type || "Manufacturer",
    company.prop_name || "N/A",
    company.mobile,
    company.address,
    company.email || "N/A",
    company.gstno || "N/A",
    <div className="flex flex-wrap gap-1">
      {company.cashback_enabled && (
        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
          Cashback
        </span>
      )}
      {company.packing_enabled && (
        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          Packing
        </span>
      )}
      {company.tracing_enabled && (
        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          Tracing
        </span>
      )}
      {company.salesman_tracking_enabled && (
        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
          Tracking
        </span>
      )}
      {company.accounting_enabled && (
        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
          Accounting
        </span>
      )}
    </div>,
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
                buttonText="Add New Company"
                onButtonClick={() => setShowModal(true)}
                pageCount={totalPages} // Correct page count
                onPageChange={handlePageClick} // Update the page click handler
                currentPage={currentPage} // Pass the current page
                onEditClick={handleManageFeatures}
                userRole={userData.role}
                customActionButtons={{
                  editLabel: "Manage Features",
                  editColor: "blue",
                }}
              />
            </div>

        )}


      {showFeaturesModal && (
        <Modal
          isOpen={showFeaturesModal}
          onRequestClose={() => setShowFeaturesModal(false)}
          contentLabel="Manage Company Features"
          className="bg-white p-6 rounded-xl shadow-xl w-[500px] mx-auto mt-20"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-900">Manage Company Features</h2>
          <p className="text-sm text-gray-600 mb-4">
            Company: <span className="font-semibold">{selectedCompanyForFeatures?.name}</span>
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                id="feat_cashback_enabled"
                name="cashback_enabled"
                checked={featuresData.cashback_enabled}
                onChange={handleFeatureCheckboxChange}
                className="w-4 h-4 text-teal-600 mr-3"
              />
              <label htmlFor="feat_cashback_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Cashback Enabled
              </label>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                id="feat_packing_enabled"
                name="packing_enabled"
                checked={featuresData.packing_enabled}
                onChange={handleFeatureCheckboxChange}
                className="w-4 h-4 text-teal-600 mr-3"
              />
              <label htmlFor="feat_packing_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Packing Enabled
              </label>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                id="feat_tracing_enabled"
                name="tracing_enabled"
                checked={featuresData.tracing_enabled}
                onChange={handleFeatureCheckboxChange}
                className="w-4 h-4 text-teal-600 mr-3"
              />
              <label htmlFor="feat_tracing_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Tracing Enabled
              </label>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                id="feat_salesman_tracking_enabled"
                name="salesman_tracking_enabled"
                checked={featuresData.salesman_tracking_enabled}
                onChange={handleFeatureCheckboxChange}
                className="w-4 h-4 text-teal-600 mr-3"
              />
              <label htmlFor="feat_salesman_tracking_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Salesman Tracking Enabled
              </label>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                id="feat_accounting_enabled"
                name="accounting_enabled"
                checked={featuresData.accounting_enabled}
                onChange={handleFeatureCheckboxChange}
                className="w-4 h-4 text-teal-600 mr-3"
              />
              <label htmlFor="feat_accounting_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Accounting Enabled
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowFeaturesModal(false)}
              className="mr-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateFeatures}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Update Features
            </button>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          contentLabel="Edit Company"
          className="bg-white p-6 rounded shadow-lg w-3/4 mx-auto mt-10"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
          style={{
            content: {
              maxHeight: "90vh",
              overflowY: "auto",
            },
          }}
        >
          <h2 className="text-xl font-bold mb-4">Edit Company</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editCompanyData.name}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={editCompanyData.type}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Retailer">Retailer</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Proprietor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prop_name"
                    value={editCompanyData.prop_name}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registration_no"
                    value={editCompanyData.registration_no}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstno"
                    value={editCompanyData.gstno}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={editCompanyData.address}
                    onChange={handleEditInputChange}
                    className="w-full p-2 border rounded"
                    rows="3"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={editCompanyData.mobile}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editCompanyData.email}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Customer Care Number
                    </label>
                    <input
                      type="text"
                      name="customer_care_no"
                      value={editCompanyData.customer_care_no}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature Settings */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Feature Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="edit_cashback_enabled"
                    name="cashback_enabled"
                    checked={editCompanyData.cashback_enabled}
                    onChange={handleEditCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="edit_cashback_enabled" className="text-sm font-medium">
                    Cashback Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="edit_packing_enabled"
                    name="packing_enabled"
                    checked={editCompanyData.packing_enabled}
                    onChange={handleEditCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="edit_packing_enabled" className="text-sm font-medium">
                    Packing Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="edit_tracing_enabled"
                    name="tracing_enabled"
                    checked={editCompanyData.tracing_enabled}
                    onChange={handleEditCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="edit_tracing_enabled" className="text-sm font-medium">
                    Tracing Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="edit_salesman_tracking_enabled"
                    name="salesman_tracking_enabled"
                    checked={editCompanyData.salesman_tracking_enabled}
                    onChange={handleEditCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="edit_salesman_tracking_enabled" className="text-sm font-medium">
                    Salesman Tracking Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="edit_accounting_enabled"
                    name="accounting_enabled"
                    checked={editCompanyData.accounting_enabled}
                    onChange={handleEditCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="edit_accounting_enabled" className="text-sm font-medium">
                    Accounting Enabled
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowEditModal(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCompany}
              className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700"
            >
              Update Company
            </button>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          contentLabel="Add New Company"
          className="bg-white p-6 rounded shadow-lg w-3/4 mx-auto mt-10"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
          style={{
            content: {
              maxHeight: "90vh",
              overflowY: "auto",
            },
          }}
        >
          <h2 className="text-xl font-bold mb-4">Add New Company</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCompany.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={newCompany.type}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Retailer">Retailer</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Proprietor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prop_name"
                    value={newCompany.prop_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    GST No
                  </label>
                  <input
                    type="text"
                    name="gstno"
                    value={newCompany.gstno}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Registration No
                  </label>
                  <input
                    type="text"
                    name="registration_no"
                    value={newCompany.registration_no}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="mb-4 col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={newCompany.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    rows="3"
                    required
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={newCompany.mobile}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newCompany.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Customer Care No
                  </label>
                  <input
                    type="text"
                    name="customer_care_no"
                    value={newCompany.customer_care_no}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Feature Settings */}
            <div className="col-span-2 bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Feature Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="cashback_enabled"
                    name="cashback_enabled"
                    checked={newCompany.cashback_enabled}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="cashback_enabled" className="text-sm font-medium">
                    Cashback Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="packing_enabled"
                    name="packing_enabled"
                    checked={newCompany.packing_enabled}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="packing_enabled" className="text-sm font-medium">
                    Packing Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="tracing_enabled"
                    name="tracing_enabled"
                    checked={newCompany.tracing_enabled}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="tracing_enabled" className="text-sm font-medium">
                    Tracing Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="salesman_tracking_enabled"
                    name="salesman_tracking_enabled"
                    checked={newCompany.salesman_tracking_enabled}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="salesman_tracking_enabled" className="text-sm font-medium">
                    Salesman Tracking Enabled
                  </label>
                </div>
                
                <div className="mb-2 flex items-center">
                  <input
                    type="checkbox"
                    id="accounting_enabled"
                    name="accounting_enabled"
                    checked={newCompany.accounting_enabled}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="accounting_enabled" className="text-sm font-medium">
                    Accounting Enabled
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompany}
              className={`bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Company"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CompaniesPage;
