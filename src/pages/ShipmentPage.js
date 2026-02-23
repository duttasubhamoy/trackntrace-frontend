import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { CgSpinner } from "react-icons/cg";
import { FiAlertCircle, FiTrash2 } from "react-icons/fi";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";
import Modal from "react-modal";
import { useAuth } from "../context/AuthContext";
import { collapse } from "@material-tailwind/react";


Modal.setAppElement("#root");

const ShipmentPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Shipment state management
  const [shipments, setShipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [indentLinkError, setIndentLinkError] = useState("");
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [shipmentsPerPage] = useState(10);
  
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [linkedIndents, setLinkedIndents] = useState([]);
  const [fromSellerId, setFromSellerId] = useState("");
  const [fromSellerName, setFromSellerName] = useState("");
  const [isFromSellerLocked, setIsFromSellerLocked] = useState(false);
  const [toSellerId, setToSellerId] = useState("");
  const [toSellerName, setToSellerName] = useState("");
  const [isToSellerLocked, setIsToSellerLocked] = useState(false);
  const [indentLoadingStates, setIndentLoadingStates] = useState({});
  const [indentSearchTimers, setIndentSearchTimers] = useState({});
  
  // Shipment allocation modal state
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [indentItemsForShipment, setIndentItemsForShipment] = useState([]);
  const [unitIdInput, setUnitIdInput] = useState("");
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [createdShipmentId, setCreatedShipmentId] = useState(null);
  const [addedUnits, setAddedUnits] = useState([]); // Track unit IDs added to shipment
  const [actualQuantities, setActualQuantities] = useState({}); // Track actual quantities per product
  const [unitSearchTimer, setUnitSearchTimer] = useState(null);
  const [isSearchingUnit, setIsSearchingUnit] = useState(false);
  const [isClosingShipment, setIsClosingShipment] = useState(false);
  
  // Sellers state for dropdown filters
  const [sellers, setSellers] = useState([]);
  const indentInputRefs = useRef({}); 
  const lastAddedIndentUidRef = useRef(null);
  const unitIdInputRef = useRef(null); // Add this ref for unit ID input
  
  
  // Filter state
  const [filterValues, setFilterValues] = useState({
    status: "",
    from_seller_id: "",
    to_seller_id: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      try {
        // Fetch shipments and sellers
        await Promise.all([fetchShipments(), fetchSellers()]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  useEffect(() => {
    if (showAllocationModal && unitIdInputRef.current) {
      setTimeout(() => {
        unitIdInputRef.current.focus();
      }, 100);
    }
  }, [showAllocationModal]);

  useEffect(() => {
    if (!isSearchingUnit && showAllocationModal && unitIdInputRef.current) {
      unitIdInputRef.current.focus();
    }
  }, [isSearchingUnit, showAllocationModal]);

  // Fetch shipments from API
  const fetchShipments = async (filters = {}) => {
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.from_seller_id) params.append("from_seller_id", filters.from_seller_id);
      if (filters.to_seller_id) params.append("to_seller_id", filters.to_seller_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      
      const queryString = params.toString();
      const url = queryString ? `/shipments?${queryString}` : "/shipments";
      
      const response = await axios.get(url);
      console.log("Fetched shipments:", response.data);
      setShipments(response.data);
      setFilteredShipments(response.data);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      setShipments([]);
      setFilteredShipments([]);
    }
  };

  // Fetch sellers for dropdown filters
  const fetchSellers = async () => {
    try {
      const response = await axios.get("/sellers");
      setSellers(response.data);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      setSellers([]);
    }
  };

  // Refetch shipments when filters change
  useEffect(() => {
    if (sellers.length > 0) {
      // Only fetch when sellers are loaded
      fetchShipments(filterValues);
    }
  }, [filterValues, sellers.length]);

  // Search filter effect
  useEffect(() => {
    if (shipments.length > 0) {
      const filtered = shipments.filter((shipment) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          shipment.id?.toString().includes(searchLower) ||
          shipment.status?.toLowerCase().includes(searchLower) ||
          shipment.notes?.toLowerCase().includes(searchLower) ||
          shipment.invoice_no?.toLowerCase().includes(searchLower) ||
          shipment.eway_bill_no?.toLowerCase().includes(searchLower) ||
          shipment.vehicle_no?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredShipments(filtered);
      setCurrentPage(0);
    }
  }, [searchTerm, shipments]);

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

  // Calculate current shipments to display
  const indexOfLastShipment = (currentPage + 1) * shipmentsPerPage;
  const indexOfFirstShipment = indexOfLastShipment - shipmentsPerPage;
  const currentShipments = filteredShipments.slice(indexOfFirstShipment, indexOfLastShipment);

  // Handle create shipment button click
  const handleCreateShipment = () => {
    setLinkedIndents([]);
    setFromSellerId("");
    setFromSellerName("");
    setIsFromSellerLocked(false);
    setToSellerId("");
    setToSellerName("");
    setIsToSellerLocked(false);
    setIndentLoadingStates({});
    setIndentSearchTimers({});
    setShowCreateModal(true);
  };

  useEffect(() => {
    const uid = lastAddedIndentUidRef.current;
    if (!uid) return;
  
    const el = indentInputRefs.current[uid];
    if (el) el.focus();
  
    lastAddedIndentUidRef.current = null;
  }, [linkedIndents]);
  

  // Handle add indent link
  const handleAddIndentLink = () => {
    const uid = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    // store which indent should be focused after render
    lastAddedIndentUidRef.current = uid;
    setLinkedIndents((prev) => [...prev, { uid, indent_id: "" }]);
  };

  // Handle remove indent link
  const handleRemoveIndentLink = (index) => {
    const uid = linkedIndents[index]?.uid;
  
    const updatedIndents = linkedIndents.filter((_, i) => i !== index);
    setLinkedIndents(updatedIndents);
  
    // Clear the ref for this uid
    if (uid) delete indentInputRefs.current[uid];
  
    // Clear any pending timer for this uid
    if (uid && indentSearchTimers[uid]) {
      clearTimeout(indentSearchTimers[uid]);
      setIndentSearchTimers((prev) => {
        const updated = { ...prev };
        delete updated[uid];
        return updated;
      });
    }
  
    // Remove loading state for this uid
    if (uid) {
      setIndentLoadingStates((prev) => {
        const updated = { ...prev };
        delete updated[uid];
        return updated;
      });
    }
  
    // If all indents are removed, unlock both seller fields
    if (updatedIndents.length === 0) {
      setIsFromSellerLocked(false);
      setFromSellerId("");
      setFromSellerName("");
      setIsToSellerLocked(false);
      setToSellerId("");
      setToSellerName("");
    }
  };
  

  // Fetch indent details and set to_seller
  const fetchIndentDetails = async (indentId) => {
    if (!indentId) return null;
    
    try {
      const response = await axios.get(`/user-indents/${indentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching indent ${indentId}:`, error);
      alert(error.response?.data?.message || error.response?.data?.description || `Failed to load indent ${indentId}`);
      return null;
    }
  };

  // Handle indent ID change with debounced search
  const handleIndentIdChange = (index, value) => {
    const updatedIndents = [...linkedIndents];
    updatedIndents[index].indent_id = value;
    setLinkedIndents(updatedIndents);
  
    const uid = updatedIndents[index]?.uid;
    if (!uid) return;
  
    // Clear existing timer for this uid
    if (indentSearchTimers[uid]) {
      clearTimeout(indentSearchTimers[uid]);
    }
  
    // If value is empty / not a number, stop
    if (!value || isNaN(value)) {
      setIndentSearchTimers((prev) => {
        const updated = { ...prev };
        delete updated[uid];
        return updated;
      });
      return;
    }
  
    // Debounce search
    const timerId = setTimeout(() => {
      handleIndentSearch(index);
    }, 800);
  
    setIndentSearchTimers((prev) => ({ ...prev, [uid]: timerId }));
  };
  

  // Handle indent search
  const handleIndentSearch = async (index) => {
    const indentId = linkedIndents[index]?.indent_id;
    const uid = linkedIndents[index]?.uid;
    setIndentLinkError("");
  
    if (!indentId || isNaN(indentId)) return;
  
    if (uid) setIndentLoadingStates((prev) => ({ ...prev, [uid]: true }));
  
    try {
      const indentDetails = await fetchIndentDetails(parseInt(indentId));
  
      if (indentDetails) {
        // Check indent status first
        const indentStatus = indentDetails.status;
        
        if (indentStatus === "FULFILLED") {
          setIndentLinkError(`Indent ${indentId} is already FULFILLED and cannot be linked to a shipment.`);
          const updatedIndents = [...linkedIndents];
          updatedIndents[index].indent_id = "";
          setLinkedIndents(updatedIndents);
          return;
        }
        
        if (indentStatus !== "APPROVED" && indentStatus !== "PARTIALLY_FULFILLED") {
          setIndentLinkError(`Indent ${indentId} must be APPROVED to link to a shipment. Current status: ${indentStatus}`);
          const updatedIndents = [...linkedIndents];
          updatedIndents[index].indent_id = "";
          setLinkedIndents(updatedIndents);
          return;
        }
        
        // Now check seller compatibility
        if (indentDetails.to_seller) {
          const indentToSellerId = indentDetails.to_seller.id || indentDetails.to_seller_id;
          const indentToSellerName = indentDetails.to_seller.name || getSellerName(indentDetails.to_seller_id);
          const indentFromSellerId = indentDetails.from_seller?.id || indentDetails.from_seller_id;
          const indentFromSellerName = indentDetails.from_seller?.name || getSellerName(indentDetails.from_seller_id);
    
          if (index === 0) {
            setFromSellerId(indentToSellerId);
            setFromSellerName(indentToSellerName);
            setIsFromSellerLocked(true);
    
            setToSellerId(indentFromSellerId);
            setToSellerName(indentFromSellerName);
            setIsToSellerLocked(true);
          } else {
            if (indentToSellerId !== fromSellerId) {
              setIndentLinkError(
                `Indent ${indentId} has a different supplier (to_seller). All indents must be from the same supplier.`
              );
              const updatedIndents = [...linkedIndents];
              updatedIndents[index].indent_id = "";
              setLinkedIndents(updatedIndents);
              return;
            }
          }
        }
      }
    } finally {
      if (uid) {
        setIndentLoadingStates((prev) => {
          const updated = { ...prev };
          delete updated[uid];
          return updated;
        });
      }
    }
  };
  

  // Handle create shipment submission
  const handleCreateShipmentSubmit = async () => {
    // Validate that we have at least one indent or sellers selected
    console.log("Submitting shipment with linked indents:", linkedIndents);
    if (linkedIndents.length === 0 && (!fromSellerId || !toSellerId)) {
      alert("Please link at least one indent or select sellers");
      return;
    }

    if (!fromSellerId || !toSellerId) {
      alert("Both From Seller and To Seller are required");
      return;
    }

    setIsCreatingShipment(true);

    try {
      // Fetch all indent details to get items
      const indentDetailsPromises = linkedIndents
        .filter(indent => indent.indent_id && !isNaN(indent.indent_id))
        .map(indent => fetchIndentDetails(parseInt(indent.indent_id)));

      const allIndentDetails = await Promise.all(indentDetailsPromises);

      // Log all indent details to check fulfilled_quantity
      console.log("All indent details:", allIndentDetails);
      
      // Collect all items from indents and aggregate by product
      const itemsMap = {};
      allIndentDetails.forEach(indentDetail => {
        if (indentDetail && indentDetail.items) {
          // Log each indent's items with fulfilled_quantity
          console.log(`Indent #${indentDetail.id} items:`, indentDetail.items);

          indentDetail.items.forEach(item => {
            // Log individual item with fulfilled_quantity
            console.log(`Item: ${item.product?.name || item.product_id}`, {
              quantity: item.quantity,
              fulfilled_quantity: item.fulfilled_quantity,
              remaining_quantity: item.remaining_quantity,
            });

            const productId = item.product?.id || item.product_id;
            const key = productId;
      
            // Prefer remaining_quantity, fall back to quantity - fulfilled_quantity, then quantity
            const remaining =
              item.remaining_quantity != null
                ? item.remaining_quantity
                : (item.quantity - (item.fulfilled_quantity || 0));

            console.log(`Calculated remaining for ${item.product?.name || productId}: ${remaining}`);
      
            if (itemsMap[key]) {
              itemsMap[key].quantity += remaining;
              if (item.notes && !itemsMap[key].notes.includes(item.notes)) {
                itemsMap[key].notes = itemsMap[key].notes
                  ? `${itemsMap[key].notes}; ${item.notes}`
                  : item.notes;
              }
              if (!itemsMap[key].indent_ids.includes(indentDetail.id)) {
                itemsMap[key].indent_ids.push(indentDetail.id);
              }
            } else {
              itemsMap[key] = {
                ...item,
                indent_ids: [indentDetail.id],
                // store remaining quantity here
                quantity: remaining,
              };
            }
          });
        }
      });

      // Convert map to array
      const allItems = Object.values(itemsMap).map(item => ({
        ...item,
        indent_id: item.indent_ids.join(', ') // Show all indent IDs for this item
      }));

      // Create shipment with empty unit_ids
      const shipmentData = {
        from_seller_id: fromSellerId,
        to_seller_id: toSellerId,
        unit_ids: [], // Empty initially
        notes: linkedIndents.map(indent => `Indent #${indent.indent_id}`).join(', ')
      };

      const response = await axios.post("/create-shipment", shipmentData);
      const shipmentId = response.data.shipment_id || response.data.id;

      // Link all indents to the shipment
      const linkPromises = linkedIndents
        .filter(indent => indent.indent_id && !isNaN(indent.indent_id))
        .map(indent => 
          axios
            .post(`/${indent.indent_id}/link-shipment/${shipmentId}`)
            .catch(error => {
              console.error(
                `Error linking indent ${indent.indent_id} to shipment ${shipmentId}:`,
                error
              );
              // Extract the detailed error message from backend
              const msg =
                error.response?.data?.description ||
                error.response?.data?.message ||
                error.message ||
                "Failed to link indent to shipment.";
              alert(`Indent ${indent.indent_id}: ${msg}`);
              // Don't fail the entire process if one link fails
              return null;
            })
        );
      
      await Promise.all(linkPromises);

      // Store shipment ID and items, then open allocation modal
      setCreatedShipmentId(shipmentId);
      setIndentItemsForShipment(allItems);
      setAddedUnits([]);
      setActualQuantities({});
      setShowCreateModal(false);
      setShowAllocationModal(true);
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert(error.response?.data?.message || error.response?.data?.description || "Failed to create shipment. Please try again.");
    } finally {
      setIsCreatingShipment(false);
    }
  };

  // Handle clicking on shipment ID to view details
  const handleShipmentClick = async (shipmentId) => {
    try {
      setIsLoadingDetails(true);
      setShowDetailsModal(true);
      const response = await axios.get(`/shipments?shipment_id=${shipmentId}`);
      setShipmentDetails(response.data);
    } catch (error) {
      console.error("Error fetching shipment details:", error);
      alert(error.response?.data?.message || "Failed to load shipment details");
      setShowDetailsModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle unit ID input change with debounced search
  const handleUnitIdInputChange = (value) => {
    setUnitIdInput(value);
    
    // Clear existing timer
    if (unitSearchTimer) {
      clearTimeout(unitSearchTimer);
    }
    
    // Don't search if empty
    if (!value || value.trim() === "") {
      setUnitSearchTimer(null);
      return;
    }
    
    // Set new timer for auto-search after 800ms
    const timerId = setTimeout(() => {
      handleUnitSearch(value.trim());
    }, 800);
    
    setUnitSearchTimer(timerId);
  };

  // Search for unit by encrypted ID
  const handleUnitSearch = async (encryptedUnitId) => {
    if (!encryptedUnitId) return;
    
    setIsSearchingUnit(true);
    
    try {
      const response = await axios.get(`/${encryptedUnitId}/shipment-info`);
      const unitInfo = response.data;
      
      // Check if unit already added
      if (addedUnits.includes(unitInfo.encrypted_unit_id)) {
        alert(`Unit ${encryptedUnitId} has already been added to this shipment`);
        setUnitIdInput("");
        return;
      }
      
      // Check if product matches any indent item
      const productId = unitInfo.product_id;
      const matchingItemIndex = indentItemsForShipment.findIndex(
        item => (item.product?.id || item.product_id) === productId
      );
      
      if (matchingItemIndex !== -1) {
        // Product matches - increment actual quantity
        setActualQuantities(prev => ({
          ...prev,
          [productId]: (prev[productId] || 0) + 1
        }));
      } else {
        // Product doesn't match - add new row
        const newItem = {
          indent_id: "N/A",
          product: {
            id: productId,
            name: unitInfo.product_name || unitInfo.product_alias
          },
          product_id: productId,
          quantity: 0, // Not from indent
          notes: "Added manually"
        };
        
        setIndentItemsForShipment(prev => [...prev, newItem]);
        setActualQuantities(prev => ({
          ...prev,
          [productId]: 1
        }));
      }
      
      // Add to added units list
      setAddedUnits(prev => [...prev, unitInfo.encrypted_unit_id]);
      
      // Clear input
      setUnitIdInput("");
    } catch (error) {
      console.error("Error searching unit:", error);
      // Show user-friendly error message from backend
      const errorMessage = error.response?.data?.description || 
                          error.response?.data?.message || 
                          "Failed to find unit. Please check the Unit ID.";
      alert(errorMessage);
      // Reset input field on error
      setUnitIdInput("");
    } finally {
      setIsSearchingUnit(false);
    }
  };

  // Handle closing allocation modal (reset state)
  const handleCloseAllocationModal = () => {
    // Clear unit search timer
    if (unitSearchTimer) {
      clearTimeout(unitSearchTimer);
      setUnitSearchTimer(null);
    }
    
    // Reset all allocation state
    setShowAllocationModal(false);
    setIndentItemsForShipment([]);
    setAddedUnits([]);
    setActualQuantities({});
    setUnitIdInput("");
    setCreatedShipmentId(null);
    
    // Refresh shipments list
    fetchShipments(filterValues);
  };

  // Handle close shipment (add all units to shipment)
  const handleCloseShipment = async () => {
    if (addedUnits.length === 0) {
      alert("Please add at least one unit before closing the shipment");
      return;
    }
    
    setIsClosingShipment(true);
    
    try {
      const response = await axios.post(`/shipments/${createdShipmentId}/add-items`, {
        unit_ids: addedUnits
      });
      
      alert(`Successfully added ${response.data.added_units_count} units to shipment #${createdShipmentId}`);
      handleCloseAllocationModal();
    } catch (error) {
      console.error("Error closing shipment:", error);
      alert(error.response?.data?.message || error.response?.data?.description || "Failed to close shipment. Please try again.");
    } finally {
      setIsClosingShipment(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Format date only (without time)
  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get seller name by ID
  const getSellerName = (sellerId) => {
    const seller = sellers.find(s => s.id === sellerId);
    return seller ? seller.name : "N/A";
  };

  // Table headers
  const tableHeaders = [
    "Shipment ID",
    "From Seller",
    "To Seller",
    "Status",
    "Invoice No",
    "Created At",
  ];

  // Table rows
  const tableRows = currentShipments.map((shipment) => [
    shipment.id,
    getSellerName(shipment.from_seller_id),
    getSellerName(shipment.to_seller_id),
    shipment.status,
    shipment.invoice_no || "N/A",
    formatDate(shipment.created_at),
  ]);

  // Configure filters for the table
  // columnIndex: 0=Shipment ID, 1=From Seller, 2=To Seller, 3=Status, 4=Invoice No, 5=Created At
  const shipmentFilters = [
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
      name: "to_seller_id",
      label: "To Seller",
      columnIndex: 2, // Aligns with "To Seller" column
      type: "select",
      value: filterValues.to_seller_id,
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
        { value: "DISPATCHED", label: "DISPATCHED" },
        { value: "RECEIVED", label: "RECEIVED" },
        { value: "CANCELLED", label: "CANCELLED" },
      ],
    },
    {
      name: "start_date",
      label: "Created At",
      columnIndex: 5, // Aligns with "Created At" column
      type: "date",
      value: filterValues.start_date,
      placeholder: "Start Date",
    },
    {
      name: "end_date",
      label: "Created At",
      columnIndex: 5, // Aligns with "Created At" column
      type: "date",
      value: filterValues.end_date,
      placeholder: "End Date",
    },
  ];

  // Filter out items with zero quantity for display
  const visibleIndentItemsForShipment = indentItemsForShipment.filter(
    (item) => Number(item.quantity) > 0
  );

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
                buttonText="Create Shipment"
                onButtonClick={handleCreateShipment}
                pageCount={Math.ceil(filteredShipments.length / shipmentsPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
                filters={shipmentFilters}
                onFiltersChange={handleFilterChange}
                clickableColumns={[0]} // Make Shipment ID column clickable
                onRowClick={(rowIndex) => {
                  if (currentShipments[rowIndex]) {
                    handleShipmentClick(currentShipments[rowIndex].id);
                  }
                }}
              />

              {/* Modal for creating shipment */}
              {showCreateModal && (
                <Modal
                  isOpen={showCreateModal}
                  onRequestClose={() => setShowCreateModal(false)}
                  contentLabel="Create Shipment"
                  className="bg-white p-6 rounded-lg shadow-lg w-3/5 mx-auto mt-10 max-h-[85vh] overflow-y-auto"
                  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
                >
                  <h2 className="text-2xl font-bold mb-4 text-teal-600">
                    Create New Shipment
                  </h2>
                  
                  <div className="mb-6">
                    {/* To Seller Field */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        To Seller *
                      </label>
                      {isToSellerLocked ? (
                        <input
                          type="text"
                          value={toSellerName}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 cursor-not-allowed"
                          title="To Seller is automatically set from linked indent(s)"
                        />
                      ) : (
                        <select
                          value={toSellerId}
                          onChange={(e) => setToSellerId(e.target.value)}
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
                      )}
                      {isToSellerLocked && (
                        <p className="text-sm text-gray-500 mt-1">
                          To Seller is automatically determined from the linked indent(s)
                        </p>
                      )}
                    </div>

                    {/* Link to add indent - only show when no indents exist */}
                    {linkedIndents.length === 0 && (
                      <button
                        type="button"
                        onClick={handleAddIndentLink}
                        className="text-teal-600 hover:text-teal-800 underline font-medium text-sm flex items-center"
                      >
                        + Link with an indent
                      </button>
                    )}

                    {/* List of linked indents */}
                    {linkedIndents.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {linkedIndents.map((indent, index) => (
                          <div key={indent.uid} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <input
                                type="number"
                                ref={(el) => {
                                  if (el) indentInputRefs.current[indent.uid] = el;
                                }}
                                value={indent.indent_id}
                                onChange={(e) => handleIndentIdChange(index, e.target.value)}
                                onBlur={() => handleIndentSearch(index)}
                                placeholder="Enter Indent ID"
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                              {indentLinkError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                  <FiAlertCircle className="text-red-500 text-xl mr-3 mt-0.5" />
                                  <p className="text-red-700">{indentLinkError}</p>
                                </div>
                            )}
                            </div>
                              
                            {indentLoadingStates[indent.uid] ? (
                              <div className="p-2">
                                <CgSpinner className="animate-spin text-teal-600" size={20} />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveIndentLink(index)}
                                className="text-red-600 hover:text-red-800 p-2"
                                title="Remove indent"
                              >
                                <FiTrash2 size={20} />
                              </button>
                            )}
                          </div>
                        ))}


                        {/* Show the link below textboxes */}
                        <button
                          type="button"
                          onClick={handleAddIndentLink}
                          className="text-teal-600 hover:text-teal-800 underline font-medium text-sm flex items-center mt-2"
                        >
                          + Link with an indent
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="w-1/2 bg-gray-500 text-white font-bold px-4 py-3 rounded text-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateShipmentSubmit}
                      disabled={isCreatingShipment}
                      className="w-1/2 bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      {isCreatingShipment ? "Creating..." : "Create Shipment"}
                    </button>
                  </div>
                </Modal>
              )}

              {/* Modal for allocating units to shipment */}
              {showAllocationModal && (
                <Modal
                  isOpen={showAllocationModal}
                  onRequestClose={handleCloseAllocationModal}
                  contentLabel="Allocate Units"
                  className="bg-white rounded-lg shadow-lg w-4/5 mx-auto mt-10 max-h-[85vh] overflow-y-auto relative"
                  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
                >
                  {/* Close Button */}
                  <button
                    onClick={handleCloseAllocationModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    &times;
                  </button>

                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white p-6 border-b border-gray-300 z-10">
                    <h2 className="text-2xl font-bold text-teal-600">
                      Allocate Units to Shipment #{createdShipmentId}
                    </h2>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Indent Items Table */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Indent Items</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Indent ID</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actual Quantity</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleIndentItemsForShipment.length > 0 ? (
                                visibleIndentItemsForShipment.map((item, index) => {
                                  const productId = item.product?.id || item.product_id;
                                  const actualQty = actualQuantities[productId] || 0;
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="border border-gray-300 px-4 py-2">{item.indent_id}</td>
                                      <td className="border border-gray-300 px-4 py-2">{item.product?.name || "N/A"}</td>
                                      <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                                      <td className="border border-gray-300 px-4 py-2">
                                        <span className={actualQty > 0 ? "font-semibold text-teal-600" : ""}>
                                          {actualQty}
                                        </span>
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2">{item.notes || "N/A"}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No indent items found. Link indents to see items here.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Unit ID Input */}
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Enter Unit ID (Total units added: {addedUnits.length})
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="text"
                            ref={unitIdInputRef}
                            value={unitIdInput}
                            onChange={(e) => handleUnitIdInputChange(e.target.value)}
                            placeholder="Enter or scan unit ID"
                            disabled={isSearchingUnit}
                            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          />
                          {isSearchingUnit && (
                            <div className="p-2">
                              <CgSpinner className="animate-spin text-teal-600" size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="sticky bottom-0 bg-white p-6 border-t border-gray-300 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={handleCloseAllocationModal}
                      className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseShipment}
                      disabled={isClosingShipment || addedUnits.length === 0}
                      className="px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClosingShipment ? "Closing..." : "Close Shipment"}
                    </button>
                  </div>
                </Modal>
              )}

              {/* Modal for viewing shipment details */}
              {showDetailsModal && (
                <Modal
                  isOpen={showDetailsModal}
                  onRequestClose={() => setShowDetailsModal(false)}
                  contentLabel="Shipment Details"
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
                      Shipment Details {shipmentDetails && `#${shipmentDetails.id}`}
                    </h2>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    {isLoadingDetails ? (
                      <div className="flex justify-center py-8">
                        <CgSpinner className="animate-spin text-4xl text-teal-600" />
                      </div>
                    ) : shipmentDetails ? (
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">Shipment ID:</span>
                              <span className="ml-2 text-gray-900">{shipmentDetails.id}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Status:</span>
                              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                shipmentDetails.status === 'CREATED' ? 'bg-blue-100 text-blue-800' :
                                shipmentDetails.status === 'DISPATCHED' ? 'bg-yellow-100 text-yellow-800' :
                                shipmentDetails.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                shipmentDetails.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {shipmentDetails.status}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Created At:</span>
                              <span className="ml-2 text-gray-900">{formatDate(shipmentDetails.created_at)}</span>
                            </div>
                            {shipmentDetails.dispatched_at && (
                              <div>
                                <span className="font-medium text-gray-700">Dispatched At:</span>
                                <span className="ml-2 text-gray-900">{formatDate(shipmentDetails.dispatched_at)}</span>
                              </div>
                            )}
                            {shipmentDetails.received_at && (
                              <div>
                                <span className="font-medium text-gray-700">Received At:</span>
                                <span className="ml-2 text-gray-900">{formatDate(shipmentDetails.received_at)}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">Invoice No:</span>
                              <span className="ml-2 text-gray-900">{shipmentDetails.invoice_no || "N/A"}</span>
                            </div>
                            {shipmentDetails.despatch_date && (
                              <div>
                                <span className="font-medium text-gray-700">Despatch Date:</span>
                                <span className="ml-2 text-gray-900">{formatDateOnly(shipmentDetails.despatch_date)}</span>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">E-Way Bill No:</span>
                              <span className="ml-2 text-gray-900">{shipmentDetails.eway_bill_no || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Dispatch Mode:</span>
                              <span className="ml-2 text-gray-900">{shipmentDetails.dispatch_mode || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Vehicle No:</span>
                              <span className="ml-2 text-gray-900">{shipmentDetails.vehicle_no || "N/A"}</span>
                            </div>
                          </div>
                          {shipmentDetails.notes && (
                            <div className="mt-4">
                              <span className="font-medium text-gray-700">Notes:</span>
                              <p className="mt-1 text-gray-900 bg-white p-3 rounded border border-gray-200">
                                {shipmentDetails.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Seller Information */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* From Seller */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">From Seller</h3>
                            <div>
                              <span className="font-medium text-gray-700">Name:</span>
                              <span className="ml-2 text-gray-900">{getSellerName(shipmentDetails.from_seller_id)}</span>
                            </div>
                          </div>

                          {/* To Seller */}
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 mb-3">To Seller</h3>
                            <div>
                              <span className="font-medium text-gray-700">Name:</span>
                              <span className="ml-2 text-gray-900">{getSellerName(shipmentDetails.to_seller_id)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Units */}
                        {shipmentDetails.units && shipmentDetails.units.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Shipment Units</h3>
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="font-medium text-gray-700">Total Units:</span>
                              <span className="ml-2 text-gray-900">{shipmentDetails.units.length}</span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {shipmentDetails.units.map((unitId, index) => (
                                  <span key={index} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-sm">
                                    Unit #{unitId}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-red-500">
                        No shipment details available.
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

export default ShipmentPage;
