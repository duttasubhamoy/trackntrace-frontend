import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import { Input } from "@material-tailwind/react";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

const UsersPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
    companyId: "",
  });

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]); // Initialize as an array
  const [showModal, setShowModal] = useState(false);
  const [usersPerPage] = useState(10);
  const [newUser, setNewUser] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "staff",
  });

  const [selectedCompany, setSelectedCompany] = useState("");

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
          companyId: company_id,
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
        
        if (role === "salesman" || role === "staff") {
          navigate("/dashboard");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const companyParam =
          userData.role === "admin"
            ? `?company_id=${selectedCompany}`
            : `?company_id=${userData.companyId}`;
        const response = await axios.get(`/users${companyParam}`);
        setUsers(Array.isArray(response.data) ? response.data : []); // Ensure response.data is an array
        setFilteredUsers(Array.isArray(response.data) ? response.data : []); // Ensure filteredUsers is an array
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users list:", error);
        setUsers([]); // Fallback to empty array
        setFilteredUsers([]); // Fallback to empty array
      }
    };
    if (userData.role === "admin" ? selectedCompany : userData.companyId) {
      fetchUsers();
    }
  }, [userData.role, userData.companyId, selectedCompany]);

  const handleCompanyChange = (newCompanyId) => {
    setSelectedCompany(newCompanyId);
  };

  const handleAddUser = () => {
    setNewUser({
      ...newUser,
      company_id:
        userData.role === "admin" ? selectedCompany : userData.companyId,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Ensure company_id is properly assigned
    const finalCompanyId =
      userData.role === "admin" ? selectedCompany : userData.companyId;

    // Prepare the request payload
    const payload = {
      name: newUser.name,
      mobile: newUser.mobile,
      email: newUser.email || null, // Ensure null if empty
      role: newUser.role,
    };

    try {
      console.log("Submitting User Data:", payload); // Debugging log

      await axios.post("/request-user", payload);
      alert("User added successfully");
      setIsSubmitting(false);
      // Reset modal state
      setShowModal(false);
      setNewUser({
        name: "",
        mobile: "",
        email: "",
        role: "staff",
      });
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error adding new user:", error);
      console.error("Error Response Data:", error.response?.data); // Print backend error message
      alert("Failed to add user");
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastUser = (currentPage + 1) * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = Array.isArray(filteredUsers) // Safeguard to ensure filteredUsers is an array
    ? filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
    : [];

  const tableHeaders = ["Name", "Role", "Mobile", "Email"];
  const tableRows = currentUsers.map((user) => [
    user.name,
    user.role,
    user.mobile,
    user.email || "N/A",
  ]);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar
        userData={userData}
        companyCashbackEnabled={companyCashbackEnabled}
      />
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <CgSpinner className="animate-spin text-4xl" />
          </div>
        ) : (
          <>
            <Header
              userData={userData}
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
              onCompanyChange={handleCompanyChange}
            />
            <div className="p-6">
              <TableWithSearchAndPagination
                tableHeaders={tableHeaders}
                tableRows={tableRows}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                buttonText="Add User"
                onButtonClick={handleAddUser}
                pageCount={Math.ceil(filteredUsers.length / usersPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
              />
              {/* Modal for adding a new user */}
              {showModal && (
                <div
                  className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
                  onClick={() => setShowModal(false)} // Close modal when clicking outside
                >
                  <div
                    className="bg-white p-6 rounded-lg shadow-lg w-1/2"
                    onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
                  >
                    <h2 className="text-2xl font-bold mb-4">Add New User</h2>
                    <form onSubmit={handleSubmit} className="w-full">
                      {/* Input fields arranged in two columns */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={newUser.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700">Mobile</label>
                          <input
                            type="text"
                            name="mobile"
                            value={newUser.mobile}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={newUser.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700">Role</label>
                          <select
                            name="role"
                            value={newUser.role}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded"
                          >
                            <option value="staff">Staff</option>
                            <option value="salesman">Salesman</option>
                          </select>
                        </div>
                      </div>

                      {/* Full-Width Buttons */}
                      <div className="mt-6 flex justify-between">
                        <button
                          type="submit"
                          className={`w-full bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg hover:bg-teal-700 ${
                            isSubmitting
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-teal-700"
                          }`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Adding..." : "ADD USER"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
