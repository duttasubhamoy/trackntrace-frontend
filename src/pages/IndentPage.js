import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { CgSpinner } from "react-icons/cg";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import Modal from "react-modal";
import { useAuth } from "../context/AuthContext";

Modal.setAppElement("#root");

const IndentPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Indent state management
  const [indents, setIndents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIndents, setFilteredIndents] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [indentsPerPage] = useState(10);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editIndentId, setEditIndentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [indentDetails, setIndentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Sellers state for dropdown
  const [sellers, setSellers] = useState([]);
  
  // Products state for dropdown
  const [products, setProducts] = useState([]);
  
  // Filter state
  const [filterValues, setFilterValues] = useState({
    status: "",
    from_seller_id: "",
    start_date: "",
    end_date: "",
  });
  
  // New indent form state
  const [newIndent, setNewIndent] = useState({
    from_seller_id: "",
    notes: "",
    items: [{ product_id: "", quantity: "", notes: "" }],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      try {
        // Fetch indents, sellers, and products
        await Promise.all([fetchIndents(), fetchSellers(), fetchProducts()]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  // Fetch indents from API
  const fetchIndents = async (filters = {}) => {
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.from_seller_id) params.append("from_seller_id", filters.from_seller_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      
      const queryString = params.toString();
      const url = queryString ? `/user-indents?${queryString}` : "/user-indents";
      
      const response = await axios.get(url);
      console.log("Fetched indents:", response.data);
      setIndents(response.data);
      setFilteredIndents(response.data);
    } catch (error) {
      console.error("Error fetching indents:", error);
      setIndents([]);
      setFilteredIndents([]);
    }
  };

  // Fetch sellers for dropdown
  const fetchSellers = async () => {
    try {
      const response = await axios.get("/sellers");
      setSellers(response.data);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      setSellers([]);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await axios.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  // Refetch indents when filters change
  useEffect(() => {
    if (sellers.length > 0) {
      // Only fetch when sellers are loaded
      fetchIndents(filterValues);
    }
  }, [filterValues, sellers.length]);

  // Search filter effect
  useEffect(() => {
    if (indents.length > 0) {
      const filtered = indents.filter((indent) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          indent.id?.toString().includes(searchLower) ||
          indent.status?.toLowerCase().includes(searchLower) ||
          indent.notes?.toLowerCase().includes(searchLower) ||
          indent.from_seller?.name?.toLowerCase().includes(searchLower) ||
          indent.to_seller?.name?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredIndents(filtered);
      setCurrentPage(0);
    }
  }, [searchTerm, indents]);

  // Handle page change
  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(0); // Reset to first page when filter changes
  };

  // Calculate current indents to display
  const indexOfLastIndent = (currentPage + 1) * indentsPerPage;
  const indexOfFirstIndent = indexOfLastIndent - indentsPerPage;
  const currentIndents = filteredIndents.slice(indexOfFirstIndent, indexOfLastIndent);

  // Handle add indent button click
  const handleAddIndent = () => {
    setNewIndent({
      from_seller_id: "",
      notes: "",
      items: [{ product_id: "", quantity: "", notes: "" }],
    });
    setEditMode(false);
    setEditIndentId(null);
    setShowModal(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setNewIndent({
      ...newIndent,
      [e.target.name]: e.target.value,
    });
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newIndent.items];
    updatedItems[index][field] = value;
    setNewIndent({
      ...newIndent,
      items: updatedItems,
    });
  };

  // Add new item row
  const handleAddItem = () => {
    setNewIndent({
      ...newIndent,
      items: [...newIndent.items, { product_id: "", quantity: "", notes: "" }],
    });
  };

  // Remove item row
  const handleRemoveItem = (index) => {
    if (newIndent.items.length > 1) {
      const updatedItems = newIndent.items.filter((_, i) => i !== index);
      setNewIndent({
        ...newIndent,
        items: updatedItems,
      });
    } else {
      alert("At least one item is required");
    }
  };

  // Handle form submit (create indent)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate at least one item
      if (!newIndent.items || newIndent.items.length === 0) {
        alert("At least one item is required");
        setIsSubmitting(false);
        return;
      }

      // Validate all items have product and quantity
      for (let i = 0; i < newIndent.items.length; i++) {
        const item = newIndent.items[i];
        if (!item.product_id) {
          alert(`Item ${i + 1}: Product is required`);
          setIsSubmitting(false);
          return;
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          alert(`Item ${i + 1}: Valid quantity is required`);
          setIsSubmitting(false);
          return;
        }
      }

      // Build payload
      const payload = {
        from_seller_id: parseInt(newIndent.from_seller_id),
        notes: newIndent.notes || null,
        items: newIndent.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
          notes: item.notes || null,
        })),
      };

      // Create new indent
      await axios.post("/user-indents/create", payload);
      alert("Indent created successfully");

      // Reset and refresh
      setShowModal(false);
      setNewIndent({
        from_seller_id: "",
        notes: "",
        items: [{ product_id: "", quantity: "", notes: "" }],
      });
      await fetchIndents(filterValues);
    } catch (error) {
      console.error("Error submitting indent:", error);
      alert(error.response?.data?.message || error.response?.data?.description || "Failed to create indent");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle approve indent
  const handleApproveIndent = async (rowIndex) => {
    if (rowIndex !== null && currentIndents[rowIndex]) {
      const indentId = currentIndents[rowIndex].id;
      const indent = currentIndents[rowIndex];
      
      // Check if indent can be approved
      if (indent.status !== "CREATED") {
        alert(`Cannot approve indent in ${indent.status} status. Only CREATED indents can be approved.`);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await axios.post(`/user-indents/${indentId}/approve`);
        alert(response.data?.message || "Indent approved successfully");
        await fetchIndents(filterValues);
      } catch (error) {
        console.error("Error approving indent:", error);
        alert(error.response?.data?.message || error.response?.data?.description || "Failed to approve indent");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle reject indent
  const handleRejectIndent = async (rowIndex) => {
    if (rowIndex !== null && currentIndents[rowIndex]) {
      const indentId = currentIndents[rowIndex].id;
      const indent = currentIndents[rowIndex];
      
      // Check if indent can be rejected
      if (indent.status !== "CREATED") {
        alert(`Cannot reject indent in ${indent.status} status. Only CREATED indents can be rejected.`);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await axios.post(`/user-indents/${indentId}/reject`);
        alert(response.data?.message || "Indent rejected successfully");
        await fetchIndents(filterValues);
      } catch (error) {
        console.error("Error rejecting indent:", error);
        alert(error.response?.data?.message || error.response?.data?.description || "Failed to reject indent");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle clicking on indent ID to view details
  const handleIndentClick = async (indentId) => {
    try {
      setIsLoadingDetails(true);
      setShowDetailsModal(true);
      const response = await axios.get(`/user-indents/${indentId}`);
      setIndentDetails(response.data);
    } catch (error) {
      console.error("Error fetching indent details:", error);
      alert(error.response?.data?.message || "Failed to load indent details");
      setShowDetailsModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Table headers
  const tableHeaders = [
    "Indent ID",
    "From Seller",
    "To Seller",
    "Status",
    "Notes",
    "Created At",
  ];

  // Table rows
  const tableRows = currentIndents.map((indent) => [
    indent.id,
    indent.from_seller?.name || "N/A",
    indent.to_seller?.name || "N/A",
    indent.status,
    indent.notes || "N/A",
    formatDate(indent.created_at),
  ]);

  // Configure filters for the table
  // columnIndex: 0=Indent ID, 1=From Seller, 2=To Seller, 3=Status, 4=Notes, 5=Created At
  const indentFilters = [
    {
      name: "from_seller_id",
      label: "From Seller",
      columnIndex: 1, // Aligns with "From Seller" column
      type: "select",
      value: filterValues.from_seller_id,
      placeholder: "All Sellers",
      options: sellers.map((seller) => ({
        value: seller.id.toString(),
        label: `${seller.name} (${seller.type})`,
      })),
    },
    {
      name: "status",
      label: "Status",
      columnIndex: 3, // Aligns with "Status" column
      type: "select",
      value: filterValues.status,
      placeholder: "All Statuses",
      options: [
        { value: "CREATED", label: "CREATED" },
        { value: "APPROVED", label: "APPROVED" },
        { value: "REJECTED", label: "REJECTED" },
        { value: "FULFILLED", label: "FULFILLED" },
        { value: "PARTIALLY_FULFILLED", label: "PARTIALLY_FULFILLED" },
        { value: "CANCELLED", label: "CANCELLED" },
      ],
    },
    {
      name: "start_date",
      label: "Created At", // Match column header name
      columnIndex: 5, // Aligns with "Created At" column
      type: "date",
      value: filterValues.start_date,
      placeholder: "Start Date",
    },
    {
      name: "end_date",
      label: "Created At", // Same column as start_date
      columnIndex: 5, // Aligns with "Created At" column
      type: "date",
      value: filterValues.end_date,
      placeholder: "End Date",
    },
  ];

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
                buttonText="Create Indent"
                onButtonClick={handleAddIndent}
                pageCount={Math.ceil(filteredIndents.length / indentsPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
                onDeleteRequest={handleRejectIndent}
                onEditClick={handleApproveIndent}
                filters={indentFilters}
                onFiltersChange={handleFilterChange}
                clickableColumns={[0]} // Make Indent ID column clickable
                onRowClick={(rowIndex) => {
                  if (currentIndents[rowIndex]) {
                    handleIndentClick(currentIndents[rowIndex].id);
                  }
                }}
                customActionButtons={{
                  editLabel: "Approve",
                  editColor: "green",
                  deleteLabel: "Reject",
                  deleteColor: "orange",
                }}
              />

              {/* Modal for creating indent */}
              {showModal && (
                <Modal
                  isOpen={showModal}
                  onRequestClose={() => setShowModal(false)}
                  contentLabel="Create Indent"
                  className="bg-white p-6 rounded-lg shadow-lg w-4/5 mx-auto mt-10 max-h-[85vh] overflow-y-auto"
                  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
                >
                  <h2 className="text-2xl font-bold mb-4 text-teal-600">
                    Create New Indent
                  </h2>
                  <form onSubmit={handleSubmit} className="w-full">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">
                            From Seller (Buyer) *
                          </label>
                          <select
                            name="from_seller_id"
                            value={newIndent.from_seller_id}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            required
                          >
                            <option value="">Select Seller</option>
                            {sellers.map((seller) => (
                              <option key={seller.id} value={seller.id}>
                                {seller.name} ({seller.type})
                              </option>
                            ))}
                          </select>
                          <p className="text-sm text-gray-500 mt-1">
                            To Seller (Warehouse) will be automatically determined
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-medium mb-2">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={newIndent.notes}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                            rows="3"
                            placeholder="Enter any additional notes..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Indent Items *</h3>
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                        >
                          + Add Item
                        </button>
                      </div>

                      <div className="space-y-3">
                        {newIndent.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border border-gray-300">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-700">Item #{index + 1}</span>
                              {newIndent.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                  Product *
                                </label>
                                <select
                                  value={item.product_id}
                                  onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  required
                                >
                                  <option value="">Select Product</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.product_alias || product.name} ({product.quantity} {product.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                  Quantity *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="Enter quantity"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                  Notes
                                </label>
                                <input
                                  type="text"
                                  value={item.notes}
                                  onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="Optional notes"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="w-1/2 bg-gray-500 text-white font-bold px-4 py-3 rounded text-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`w-1/2 bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg ${
                          isSubmitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-teal-700"
                        }`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create Indent"}
                      </button>
                    </div>
                  </form>
                </Modal>
              )}

              {/* Modal for viewing indent details */}
              {showDetailsModal && (
                <Modal
                  isOpen={showDetailsModal}
                  onRequestClose={() => setShowDetailsModal(false)}
                  contentLabel="Indent Details"
                  className="bg-white rounded-lg shadow-lg w-4/5 mx-auto mt-10 max-h-[85vh] overflow-y-auto relative"
                  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    &times;
                  </button>

                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white p-6 border-b border-gray-300 z-10">
                    <h2 className="text-2xl font-bold text-teal-600">
                      Indent Details {indentDetails && `#${indentDetails.id}`}
                    </h2>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    {isLoadingDetails ? (
                      <div className="flex justify-center py-8">
                        <CgSpinner className="animate-spin text-4xl text-teal-600" />
                      </div>
                    ) : indentDetails ? (
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">Indent ID:</span>
                              <span className="ml-2 text-gray-900">{indentDetails.id}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700">Status:</span>
                              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                indentDetails.status === 'CREATED' ? 'bg-blue-100 text-blue-800' :
                                indentDetails.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                indentDetails.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                indentDetails.status === 'FULFILLED' ? 'bg-purple-100 text-purple-800' :
                                indentDetails.status === 'PARTIALLY_FULFILLED' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {indentDetails.status}
                              </span>
                              {(indentDetails.status === 'CREATED' || 
                                (indentDetails.status !== 'FULFILLED' && 
                                 indentDetails.status !== 'PARTIALLY_FULFILLED' && 
                                 indentDetails.status !== 'CANCELLED')) && (
                                <div className="ml-3 flex space-x-2">
                                  {indentDetails.status === 'CREATED' && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setIsLoadingDetails(true);
                                            await axios.post(`/user-indents/${indentDetails.id}/approve`);
                                            alert("Indent approved successfully");
                                            // Refresh details
                                            const response = await axios.get(`/user-indents/${indentDetails.id}`);
                                            setIndentDetails(response.data);
                                            // Refresh list
                                            await fetchIndents(filterValues);
                                          } catch (error) {
                                            console.error("Error approving indent:", error);
                                            alert(error.response?.data?.message || "Failed to approve indent");
                                          } finally {
                                            setIsLoadingDetails(false);
                                          }
                                        }}
                                        className="text-xs text-green-600 hover:text-green-800 underline font-medium"
                                      >
                                        Approve
                                      </button>
                                      <span className="text-gray-400">|</span>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setIsLoadingDetails(true);
                                            await axios.post(`/user-indents/${indentDetails.id}/reject`);
                                            alert("Indent rejected successfully");
                                            // Refresh details
                                            const response = await axios.get(`/user-indents/${indentDetails.id}`);
                                            setIndentDetails(response.data);
                                            // Refresh list
                                            await fetchIndents(filterValues);
                                          } catch (error) {
                                            console.error("Error rejecting indent:", error);
                                            alert(error.response?.data?.message || "Failed to reject indent");
                                          } finally {
                                            setIsLoadingDetails(false);
                                          }
                                        }}
                                        className="text-xs text-orange-600 hover:text-orange-800 underline font-medium"
                                      >
                                        Reject
                                      </button>
                                      <span className="text-gray-400">|</span>
                                    </>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm("Are you sure you want to cancel this indent?")) {
                                        return;
                                      }
                                      try {
                                        setIsLoadingDetails(true);
                                        await axios.post(`/user-indents/${indentDetails.id}/cancel`);
                                        alert("Indent cancelled successfully");
                                        // Refresh details
                                        const response = await axios.get(`/user-indents/${indentDetails.id}`);
                                        setIndentDetails(response.data);
                                        // Refresh list
                                        await fetchIndents(filterValues);
                                      } catch (error) {
                                        console.error("Error cancelling indent:", error);
                                        alert(error.response?.data?.message || error.response?.data?.description || "Failed to cancel indent");
                                      } finally {
                                        setIsLoadingDetails(false);
                                      }
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Created At:</span>
                              <span className="ml-2 text-gray-900">{formatDate(indentDetails.created_at)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Updated At:</span>
                              <span className="ml-2 text-gray-900">{formatDate(indentDetails.updated_at)}</span>
                            </div>
                            {indentDetails.approved_at && (
                              <div>
                                <span className="font-medium text-gray-700">Approved At:</span>
                                <span className="ml-2 text-gray-900">{formatDate(indentDetails.approved_at)}</span>
                              </div>
                            )}
                            {indentDetails.fulfilled_at && (
                              <div>
                                <span className="font-medium text-gray-700">Fulfilled At:</span>
                                <span className="ml-2 text-gray-900">{formatDate(indentDetails.fulfilled_at)}</span>
                              </div>
                            )}
                          </div>
                          {indentDetails.notes && (
                            <div className="mt-4">
                              <span className="font-medium text-gray-700">Notes:</span>
                              <p className="mt-1 text-gray-900 bg-white p-3 rounded border border-gray-200">
                                {indentDetails.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Seller Information */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* From Seller */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">From Seller (Buyer)</h3>
                            {indentDetails.from_seller ? (
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-gray-700">Name:</span>
                                  <span className="ml-2 text-gray-900">{indentDetails.from_seller.name}</span>
                                </div>
                                {indentDetails.from_seller.address && (
                                  <div>
                                    <span className="font-medium text-gray-700">Address:</span>
                                    <span className="ml-2 text-gray-900">{indentDetails.from_seller.address}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">N/A</p>
                            )}
                          </div>

                          {/* To Seller */}
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 mb-3">To Seller (Supplier)</h3>
                            {indentDetails.to_seller ? (
                              <div className="space-y-2">
                                <div>
                                  <span className="font-medium text-gray-700">Name:</span>
                                  <span className="ml-2 text-gray-900">{indentDetails.to_seller.name}</span>
                                </div>
                                {indentDetails.to_seller.address && (
                                  <div>
                                    <span className="font-medium text-gray-700">Address:</span>
                                    <span className="ml-2 text-gray-900">{indentDetails.to_seller.address}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500">N/A</p>
                            )}
                          </div>
                        </div>

                        {/* Indent Items */}
                        {indentDetails.items && indentDetails.items.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Indent Items</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead className="bg-teal-100">
                                  <tr>
                                    <th className="p-3 text-left text-teal-800 font-semibold border-b">Item #</th>
                                    <th className="p-3 text-left text-teal-800 font-semibold border-b">Product</th>
                                    <th className="p-3 text-left text-teal-800 font-semibold border-b">Quantity</th>
                                    <th className="p-3 text-left text-teal-800 font-semibold border-b">Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {indentDetails.items.map((item, index) => (
                                    <tr key={item.id || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                      <td className="p-3 border-b">{index + 1}</td>
                                      <td className="p-3 border-b">{item.product_alias || item.product_name || "N/A"}</td>
                                      <td className="p-3 border-b">{item.quantity || "N/A"}</td>
                                      <td className="p-3 border-b">{item.notes || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Shipments */}
                        {indentDetails.shipments && indentDetails.shipments.length > 0 && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-purple-800 mb-3">Associated Shipments</h3>
                            <div className="space-y-2">
                              {indentDetails.shipments.map((shipment) => (
                                <div key={shipment.id} className="bg-white p-3 rounded border border-purple-200">
                                  <span className="font-medium text-gray-700">Shipment ID:</span>
                                  <span className="ml-2 text-gray-900">{shipment.id}</span>
                                  <span className="ml-4 font-medium text-gray-700">Status:</span>
                                  <span className="ml-2 px-2 py-1 rounded text-sm bg-purple-100 text-purple-800">
                                    {shipment.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-red-500">
                        No indent details available.
                      </p>
                    )}
                  </div>
                </Modal>
              )}
            </div>
      )}
    </>
  );
};

export default IndentPage;
