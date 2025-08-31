import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import axios from "../utils/axiosConfig";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import Modal from "react-modal";
import { CgSpinner } from "react-icons/cg";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

const SchemePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newScheme, setNewScheme] = useState({
    scheme_name: "",
    description: "",
    type: "",
    expiry_date: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [schemesPerPage] = useState(10);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [inputError, setInputError] = useState({
    scheme_name: false,
    type: false,
  });
  // Scheme Items for Add Scheme Modal
  const [schemeItems, setSchemeItems] = useState([{ item_name: "", percentage: "", description: "" }]);
  const [itemInputError, setItemInputError] = useState([
    { item_name: false, percentage: false }, // Changed from true to false
  ]);

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

        if (role !== "master") {
          navigate("/dashboard");
        }
        fetchSchemes();
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    const fetchSchemes = async () => {
      try {
        const response = await axios.get("/view-scheme");
        setSchemes(response.data);
        setFilteredSchemes(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching schemes:", error);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle search functionality
  useEffect(() => {
    const filterSchemes = () => {
      const filtered = schemes.filter(
        (scheme) =>
          (scheme.scheme_name &&
            scheme.scheme_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (scheme.description &&
            scheme.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSchemes(filtered);
    };
    filterSchemes();
  }, [searchTerm, schemes]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewScheme({
      ...newScheme,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastScheme = (currentPage + 1) * schemesPerPage;
  const indexOfFirstScheme = indexOfLastScheme - schemesPerPage;
  const currentSchemes = filteredSchemes.slice(
    indexOfFirstScheme,
    indexOfLastScheme
  );

  const validateInputs = () => {
    const errors = {
      scheme_name: !newScheme.scheme_name,
      type: !newScheme.type,
    };
    setInputError(errors);
    return !(errors.scheme_name || errors.type);
  };

  const resetModal = () => {
    setNewScheme({
      scheme_name: "",
      description: "",
      type: "",
      expiry_date: "",
      is_active: true,
    });
    setSchemeItems([]);
    setInputError({
      scheme_name: false,
      type: false,
    });
    setItemInputError([]);
    setShowModal(false);
    setIsSubmitting(false);
  };

  const handleAddScheme = async () => {
    if (!validateInputs()) return;
    
    // Validate all scheme items if any exist
    if (schemeItems.length > 0) {
      const itemErrors = schemeItems.map((item) => ({
        item_name: !item.item_name,
        percentage: !item.percentage,
      }));

      if (itemErrors.some((error) => error.item_name || error.percentage)) {
        setItemInputError(itemErrors);
        return;
      }
      // Check if total percentage is 100 or less
      const totalPercentage = schemeItems.reduce(
        (sum, item) => sum + Number(item.percentage || 0),
        0
      );
      if (totalPercentage > 100) {
        alert("Total percentage cannot exceed 100.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Step 1: Add the scheme
      const schemePayload = {
        scheme_name: newScheme.scheme_name,
        description: newScheme.description,
        type: newScheme.type,
        expiry_date: newScheme.expiry_date,
        is_active: newScheme.is_active,
      };
      const schemeResponse = await axios.post("/add-scheme", schemePayload);
      const schemeId = schemeResponse.data.scheme_id;

      // Step 2: Add all scheme items if any exist
      if (schemeItems.length > 0) {
        // Calculate total percentage and add no-scheme item if needed
        const totalPercentage = schemeItems.reduce(
          (sum, item) => sum + Number(item.percentage || 0),
          0
        );
        
        const itemsToSubmit = [...schemeItems];
        if (totalPercentage < 100) {
          const remainingPercentage = 100 - totalPercentage;
          itemsToSubmit.push({
            item_name: "no-scheme",
            percentage: remainingPercentage.toString(),
            description: "better luck next time"
          });
        }

        const itemPromises = itemsToSubmit.map(item =>
          axios.post("/add-scheme-item", {
            scheme_id: schemeId,
            item_name: item.item_name,
            percentage: item.percentage,
            description: item.description
          })
        );

        await Promise.all(itemPromises);
      }

      // Show success toast
      alert("Scheme created successfully"); // Replace with your toast implementation

      // Reset the modal and refetch schemes
      resetModal();
      const response = await axios.get("/view-scheme");
      setSchemes(response.data);
    } catch (error) {
      console.error("Error adding scheme:", error);
      alert(error.response?.data?.msg || "Error creating scheme"); // Replace with your toast implementation
      setIsSubmitting(false);
    }
  };

  // Table Headers
  const tableHeaders = [
    "Scheme Name",
    "Type",
    "Description",
    "Active?",
    "Actions",
  ];

  // View Items Modal State
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [itemsModalLoading, setItemsModalLoading] = useState(false);
  const [itemsModalError, setItemsModalError] = useState("");
  const [itemsModalData, setItemsModalData] = useState([]);

  const handleViewItems = async (schemeId) => {
    setShowItemsModal(true);
    setItemsModalLoading(true);
    setItemsModalError("");
    setItemsModalData([]);
    try {
      const resp = await axios.get(`/view-scheme-item?scheme_id=${schemeId}`);
      setItemsModalData(resp.data);
      console.log("Items fetched:", resp.data);
    } catch (err) {
      setItemsModalError(err.response?.data?.msg || "Failed to fetch items");
    }
    setItemsModalLoading(false);
  };

  // Table Rows
  const tableRows = currentSchemes.map((scheme) => [
    scheme.scheme_name,
    scheme.type,
    scheme.description || "N/A",
    scheme.is_active ? "Yes" : "No",
    <button
      className="text-blue-600 underline text-sm"
      onClick={() => handleViewItems(scheme.id)}
      type="button"
    >
      View Items
    </button>,
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
            <Header userData={userData} />
            <div className="p-6">
              <TableWithSearchAndPagination
                tableHeaders={tableHeaders}
                tableRows={tableRows}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                buttonText="Add Scheme"
                onButtonClick={() => setShowModal(true)}
                pageCount={Math.ceil(filteredSchemes.length / schemesPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
              />

              <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                contentLabel="Add New Scheme"
                className="bg-white rounded shadow-lg w-1/2 mx-auto mt-10 relative"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
              >
                {/* View Items Modal */}

                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>

                {/* Fixed Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-300 z-10">
                  <h2 className="text-xl font-bold">Add New Scheme</h2>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Scheme Name
                      </label>
                      <input
                        type="text"
                        name="scheme_name"
                        value={newScheme.scheme_name}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.scheme_name
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.scheme_name && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Type
                      </label>
                      <input
                        type="text"
                        name="type"
                        value={newScheme.type}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.type ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {inputError.type && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={newScheme.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="datetime-local"
                        name="expiry_date"
                        value={newScheme.expiry_date}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {/* Add Scheme Item Link and Inputs */}
                    <div className="col-span-2 mt-2">
                      <button
                        type="button"
                        className="text-blue-600 underline text-sm mb-2"
                        onClick={() => {
                          setSchemeItems((items) => [
                            ...items,
                            { item_name: "", percentage: "", description: "" },
                          ]);
                          setItemInputError((errors) => [
                            ...errors,
                            { item_name: false, percentage: false }, // Initialize new items with no errors
                          ]);
                        }}
                      >
                        + Add Scheme Item
                      </button>
                      {schemeItems.length > 0 && (
                        <div className="space-y-2">
                          {schemeItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2"
                            >
                              <div className="flex flex-col">
                                <input
                                  type="text"
                                  placeholder="Item Name"
                                  value={item.item_name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSchemeItems((items) =>
                                      items.map((it, i) =>
                                        i === idx
                                          ? { ...it, item_name: val }
                                          : it
                                      )
                                    );
                                    setItemInputError((errors) =>
                                      errors.map((err, i) =>
                                        i === idx
                                          ? { ...err, item_name: false }
                                          : err
                                      )
                                    );
                                  }}
                                  className={`p-2 border rounded w-40 ${
                                    itemInputError[idx]?.item_name
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                {itemInputError[idx]?.item_name && (
                                  <span className="text-red-500 text-xs">
                                    Required
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <input
                                  type="number"
                                  placeholder="Percentage"
                                  value={item.percentage}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSchemeItems((items) =>
                                      items.map((it, i) =>
                                        i === idx
                                          ? { ...it, percentage: val }
                                          : it
                                      )
                                    );
                                    setItemInputError((errors) =>
                                      errors.map((err, i) =>
                                        i === idx
                                          ? { ...err, percentage: false }
                                          : err
                                      )
                                    );
                                  }}
                                  className={`p-2 border rounded w-32 ${
                                    itemInputError[idx]?.percentage
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                {itemInputError[idx]?.percentage && (
                                  <span className="text-red-500 text-xs">
                                    Required
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSchemeItems((items) =>
                                    items.map((it, i) =>
                                      i === idx
                                        ? { ...it, description: val }
                                        : it
                                    )
                                  );
                                }}
                                className="p-2 border rounded w-56"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center mt-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={newScheme.is_active}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium">Active</label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={handleAddScheme}
                      className={`w-full bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg ${
                        isSubmitting
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-teal-700"
                      }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adding..." : "ADD SCHEME"}
                    </button>
                  </div>
                </div>
              </Modal>
              <Modal
                isOpen={showItemsModal}
                onRequestClose={() => setShowItemsModal(false)}
                contentLabel="Scheme Items"
                className="bg-white rounded shadow-lg w-1/2 mx-auto mt-10 relative"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
              >
                <button
                  onClick={() => setShowItemsModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
                <div className="sticky top-0 bg-white p-4 border-b border-gray-300 z-10">
                  <h2 className="text-xl font-bold">Scheme Items</h2>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  {itemsModalLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <CgSpinner className="animate-spin text-3xl" />
                    </div>
                  ) : itemsModalError ? (
                    <div className="text-red-600">{itemsModalError}</div>
                  ) : itemsModalData.length === 0 ? (
                    <div className="text-gray-500">
                      No items found for this scheme.
                    </div>
                  ) : (
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-4 py-2">Item Name</th>
                          <th className="border px-4 py-2">Percentage</th>
                          <th className="border px-4 py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsModalData.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border px-4 py-2">
                              {item.item_name}
                            </td>
                            <td className="border px-4 py-2">
                              {item.percentage}
                            </td>
                            <td className="border px-4 py-2">
                              {item.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Modal>

              {/* Add Scheme Item Modal removed */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SchemePage;
