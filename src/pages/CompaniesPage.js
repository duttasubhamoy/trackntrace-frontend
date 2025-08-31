import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import axios from "../utils/axiosConfig";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

const CompaniesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [companiesPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState({
    name: "",
    address: "",
    gstno: "",
    mobile: "",
    email: "",
    prop_name: "",
    cashback_enabled: false,
  });
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: "",
    gstno: "",
    mobile: "",
    email: "",
    prop_name: "",
    cashback_enabled: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await axios.get("/protected");
        const { name, role, last_login, company_name, company_id } =
          userRes.data;
        setUserData({
          name,
          role,
          lastLogin: last_login,
          companyName: company_name,
        });

        // Ensure only admin can access this page
        if (role !== "admin") {
          navigate("/login");
          return;
        }

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

        // Fetch companies data
        const companiesRes = await axios.get("/companies");
        setCompanies(companiesRes.data);
        setFilteredCompanies(companiesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        navigate("/login");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    // Filter companies based on the search term
    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [searchTerm, companies]);

  const handlePageClick = (page) => {
    setCurrentPage(page); // Use `page` directly instead of `data.selected`
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setNewCompany((prev) => ({ ...prev, cashback_enabled: e.target.checked }));
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
        prop_name: "",
        cashback_enabled: false,
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
        prop_name: companyToEdit.prop_name,
        cashback_enabled: companyToEdit.cashback_enabled,
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
      setEditCompanyData({
        ...editCompanyData,
        cashback_enabled: e.target.checked,
      });
    };

    const handleUpdateCompany = async () => {
      if (!selectedCompany) return;

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

  // Updated Table Headers
  const tableHeaders = [
    "Name",
    "Address",
    "GST No",
    "Mobile",
    "Email",
    "Cashback Enabled",
  ];

  // Updated Table Rows
  const tableRows = currentCompanies.map((company) => [
    company.name,
    company.address,
    company.gstno || "N/A",
    company.mobile,
    company.email || "N/A",
    <span
      style={{
        color: company.cashback_enabled ? "green" : "red",
        fontWeight: "bold",
      }}
    >
      {company.cashback_enabled ? "True" : "False"}
    </span>,
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
                buttonText="Add New Company"
                onButtonClick={() => setShowModal(true)}
                pageCount={totalPages} // Correct page count
                onPageChange={handlePageClick} // Update the page click handler
                currentPage={currentPage} // Pass the current page
                onEditButtonClick={handleEditCompany}
              />
            </div>
          </>
        )}
      </div>

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          contentLabel="Edit Company"
          className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <h2 className="text-xl font-bold mb-4">Edit Company</h2>
          <input
            type="text"
            name="name"
            value={editCompanyData.name}
            onChange={handleEditInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            name="address"
            value={editCompanyData.address}
            onChange={handleEditInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            name="gstno"
            value={editCompanyData.gstno}
            onChange={handleEditInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            name="mobile"
            value={editCompanyData.mobile}
            onChange={handleEditInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="email"
            name="email"
            value={editCompanyData.email}
            onChange={handleEditInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <input
            type="text"
            name="prop_name"
            value={editCompanyData.prop_name}
            onChange={handleEditInputChange}
            className="w-full p-2 border rounded mb-4"
          />
          <label className="block text-sm font-medium mb-1">
            Cashback Enabled
          </label>
          <input
            type="checkbox"
            name="cashback_enabled"
            checked={editCompanyData.cashback_enabled}
            onChange={handleEditCheckboxChange}
          />
          <button
            onClick={handleUpdateCompany}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 mt-4"
          >
            Update Company
          </button>
        </Modal>
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          contentLabel="Add New Company"
          className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <h2 className="text-xl font-bold mb-4">Add New Company</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
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
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={newCompany.address}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">GST No</label>
            <input
              type="text"
              name="gstno"
              value={newCompany.gstno}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mobile</label>
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
            <label className="block text-sm font-medium mb-1">Email</label>
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
              Proprietor Name
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
          <div className="mb-4 flex items-center">
            <label className="text-sm font-medium mr-2">Cashback Enabled</label>
            <input
              type="checkbox"
              name="cashback_enabled"
              checked={newCompany.cashback_enabled}
              onChange={handleCheckboxChange}
            />
          </div>
          <button
            onClick={handleAddCompany}
            className={`bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Company"}
          </button>
        </Modal>
      )}
    </div>
  );
};

export default CompaniesPage;
