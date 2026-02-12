import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination";

Modal.setAppElement("#root");

const BatchesPage = () => {
  const { userData, companyCashbackEnabled, companyPackingEnabled, companies } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batch_number: "",
    exp_date: "",
    mfg_date: "",
    product_id: "",
    extra_fields: {},
    scheme_id: "",
    mrp: "",
    company_id: "",
    no_of_inner_box: "",
    cashback_amount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extraFields, setExtraFields] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [batchesPerPage] = useState(10);
  const [duplicateBatchError, setDuplicateBatchError] = useState("");
  const [packingEnabled, setPackingEnabled] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const navigate = useNavigate();
  const [inputError, setInputError] = useState({
    batch_number: false,
    exp_date: false,
    mfg_date: false,
    product_id: false,
    mrp: false,
    company_id: false,
    no_of_inner_box: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userData?.role === "salesman") {
          navigate("/seller");
          return;
        }

        // Fetch products based on user role
        if (userData?.role === "admin") {
          setProducts([]);
        } else {
          const productsRes = await axios.get("/products");
          setProducts(productsRes.data);
        }

        const batchesRes = await axios.get("/batches");
        setBatches(batchesRes.data);
        setFilteredBatches(batchesRes.data);

        // Skip extra fields API call if user is admin
        if (userData?.role !== "admin") {
          const extraFieldsRes = await axios.get("/company-extra-fields");
          setExtraFields(extraFieldsRes.data.extra_field_batch);
        }

        // Fetch schemes
        if (userData?.role === "admin" && userData.companyId) {
          const schemesRes = await axios.get(`/view-scheme?company_id=${userData.companyId}`);
          setSchemes(schemesRes.data);
        } else {
          const schemesRes = await axios.get("/view-scheme");
          setSchemes(schemesRes.data);
        }

        // Set packing enabled from context
        setPackingEnabled(companyPackingEnabled === true);

        // For non-admin users, set company_id in newBatch
        if (userData?.role !== "admin" && userData.companyId) {
          setNewBatch(prevState => ({
            ...prevState,
            company_id: userData.companyId
          }));
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    if (userData) {
      fetchData();
    }
  }, [navigate, userData, companyPackingEnabled]);

  useEffect(() => {
    const filtered = batches.filter((batch) =>
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBatches(filtered);
    // Reset to first page whenever search results change
    setCurrentPage(0);
  }, [searchTerm, batches]);

    // Function to fetch company details and check packing_enabled
  const fetchCompanyDetails = async (companyId) => {
    try {
      const companyRes = await axios.get(`/company/${companyId}`);
      const isPackingEnabled = companyRes.data.packing_enabled === true;
      setPackingEnabled(isPackingEnabled);
      console.log(`Company ${companyId} packing_enabled:`, isPackingEnabled);
      
      // Also update cashback status while we're fetching company details
      setCashbackEnabled(companyRes.data.cashback_enabled);
      
      return isPackingEnabled;
    } catch (error) {
      console.error(`Error fetching details for company ${companyId}:`, error);
      setPackingEnabled(false);
      return false;
    }
  };

  // Function to fetch products for a specific company
  const fetchProductsForCompany = async (companyId) => {
    try {
      const response = await axios.get(`/products-by-company/${companyId}`);
      setProducts(response.data);
      
      // Also fetch schemes for this company
      try {
        const schemeResponse = await axios.get(`/schemes-by-company/${companyId}`);
        setSchemes(schemeResponse.data);
      } catch (schemeError) {
        console.error("Error fetching schemes:", schemeError);
        setSchemes([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle no_of_inner_box and cashback_amount as integers or empty string
    if (name === "no_of_inner_box" || name === "cashback_amount") {
      // Only set if value is a valid number or empty
      if (value === "" || !isNaN(value)) {
        setNewBatch({ ...newBatch, [name]: value });
      }
    } else {
      // Handle other fields normally
      setNewBatch({ ...newBatch, [name]: value });
    }
    
    // If company_id changes, fetch products and check packing_enabled
    if (name === "company_id" && value) {
      console.log("Company selected, fetching products for company_id:", value);
      fetchProductsForCompany(value);
      
      // Also fetch company details to check packing_enabled
      fetchCompanyDetails(value);
      
      // Reset product and scheme selection
      setNewBatch(prev => ({
        ...prev,
        company_id: value,
        product_id: "",
        scheme_id: "",
        no_of_inner_box: "", // Reset this field too
      }));
    } else if (name === "company_id" && !value) {
      // If company is deselected, clear products and schemes
      setProducts([]);
      setSchemes([]);
      setPackingEnabled(false); // Reset packing enabled state
    }
  };

  const handleExtraFieldChange = (e) => {
    const { name, value } = e.target;
    setNewBatch((prevBatch) => ({
      ...prevBatch,
      extra_fields: { ...prevBatch.extra_fields, [name]: value },
    }));
  };

  const validateInputs = () => {
    const errors = {
      batch_number: !newBatch.batch_number || newBatch.batch_number.length > 7,
      exp_date: !newBatch.exp_date,
      mfg_date: !newBatch.mfg_date,
      product_id: !newBatch.product_id,
      mrp: !newBatch.mrp,
      company_id: userData.role === "admin" && !newBatch.company_id,
      no_of_inner_box: packingEnabled && !newBatch.no_of_inner_box,
    };
    setInputError(errors);
    // If any error is true, return false
    return !(
      errors.batch_number ||
      errors.exp_date ||
      errors.mfg_date ||
      errors.product_id ||
      errors.mrp ||
      errors.company_id ||
      errors.no_of_inner_box
    );
  };

  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      return;
    }
    setIsSubmitting(true);
    setDuplicateBatchError(""); 
    try {
      // Create a copy of the batch data to properly handle integer fields
      const batchData = { ...newBatch };
      
      // Ensure scheme_id is properly handled (null if empty, otherwise convert to integer)
      if (!batchData.scheme_id) {
        batchData.scheme_id = null; // Send null if empty
      } else {
        batchData.scheme_id = parseInt(batchData.scheme_id); // Ensure it's an integer
      }
      
      // Ensure no_of_inner_box is properly handled as an integer when packingEnabled
      if (packingEnabled) {
        if (batchData.no_of_inner_box === "") {
          batchData.no_of_inner_box = null; // Use null for empty values
        } else {
          batchData.no_of_inner_box = parseInt(batchData.no_of_inner_box); // Ensure it's an integer
        }
      } else {
        // If packing not enabled, don't send this field
        delete batchData.no_of_inner_box;
      }
      
      // Ensure cashback_amount is properly handled as an integer when companyCashbackEnabled
      if (companyCashbackEnabled) {
        if (batchData.cashback_amount === "") {
          batchData.cashback_amount = null; // Use null for empty values
        } else {
          batchData.cashback_amount = parseInt(batchData.cashback_amount); // Ensure it's an integer
        }
      } else {
        // If cashback not enabled, don't send this field
        delete batchData.cashback_amount;
      }
      
      if (editMode) {
        // Update existing batch
        // Important: backend rejects updates that include immutable fields like company_id or plant_id.
        // Remove those keys before sending the update payload.
        const updateData = { ...batchData };
        if (updateData.hasOwnProperty('company_id')) delete updateData.company_id;
        if (updateData.hasOwnProperty('plant_id')) delete updateData.plant_id;

        console.log("Batch details being sent for update:", updateData);
        console.log("Edit batch data (JSON):", JSON.stringify(updateData, null, 2));
        await axios.put(`/update-batch/${editBatchId}`, updateData);
        alert("Batch Updated Successfully");
      } else {
        // Create new batch
        console.log("Batch details being sent to backend:", batchData);
        console.log("Add batch data (JSON):", JSON.stringify(batchData, null, 2));
        console.log("User role:", userData.role);
        console.log("Selected company ID:", batchData.company_id);
        console.log("Selected product ID:", batchData.product_id);
        console.log("Selected scheme ID:", batchData.scheme_id);
        await axios.post("/add-batch", batchData);
        alert("Batch Added Successfully");
      }
      
      // Reset form
      setNewBatch({
        batch_number: "",
        exp_date: "",
        mfg_date: "",
        product_id: "",
        extra_fields: {},
        scheme_id: "",
        mrp: "",
        company_id: userData.role === "admin" ? "" : userData.companyId || "",
        no_of_inner_box: "", // Reset inner box count too
        cashback_amount: "", // Reset cashback amount too
      });
      setInputError({
        batch_number: false,
        exp_date: false,
        mfg_date: false,
        product_id: false,
        mrp: false,
        company_id: false,
        no_of_inner_box: false,
      });
      setEditMode(false);
      setEditBatchId(null);
      setShowModal(false);
      setIsSubmitting(false);
      
      // Refetch batches after adding/updating
      const response = await axios.get("/batches");
      setBatches(response.data);
    } catch (error) {
      if (
        error.response &&
        error.response.status === 409 &&
        error.response.data?.error_code === "DUPLICATE_BATCH_NUMBER"
      ) {
        setDuplicateBatchError(error.response.data.msg);
      } else {
        alert(
          error.response?.data?.msg ||
            `Failed to ${editMode ? "update" : "add"} batch`
        );
      }
      setIsSubmitting(false);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastBatch = (currentPage + 1) * batchesPerPage;
  const indexOfFirstBatch = indexOfLastBatch - batchesPerPage;
  const currentBatches = filteredBatches.slice(
    indexOfFirstBatch,
    indexOfLastBatch
  );

  // Calculate the total page count
  const totalPages = Math.ceil(filteredBatches.length / batchesPerPage);

  // Handle editing a batch
  const [editMode, setEditMode] = useState(false);
  const [editBatchId, setEditBatchId] = useState(null);

  const handleEditBatch = async (batchId) => {
    try {
      // Fetch the batch data
      const response = await axios.get(`/batch/${batchId}`);
      const batchData = response.data;
      
      // Check packing_enabled for the company
      let isPacking = false;
      if (userData.role === "admin" && batchData.company_id) {
        isPacking = await fetchCompanyDetails(batchData.company_id);
      } else if (userData.companyId) {
        isPacking = await fetchCompanyDetails(userData.companyId);
      }
      
      // Set the batch data in the form
      setNewBatch({
        batch_number: batchData.batch_number || "",
        exp_date: batchData.exp_date ? batchData.exp_date.split('T')[0] : "",
        mfg_date: batchData.mfg_date ? batchData.mfg_date.split('T')[0] : "",
        product_id: batchData.product_id || "",
        extra_fields: batchData.extra_fields || {},
        scheme_id: batchData.schemes && batchData.schemes.length > 0 ? batchData.schemes[0].id : "",
        mrp: batchData.mrp || "",
        company_id: batchData.company_id || "",
        // Convert no_of_inner_box to string for the input field, or use empty string if null/undefined
        no_of_inner_box: batchData.no_of_inner_box !== null && batchData.no_of_inner_box !== undefined 
                         ? String(batchData.no_of_inner_box) 
                         : "",
      });
      
      // Set edit mode
      setEditMode(true);
      setEditBatchId(batchId);
      
      // Open the modal
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching batch for edit:", error);
      alert("Failed to load batch details.");
    }
  };

  // Handle edit button click from TableWithSearchAndPagination
  const handleEditButtonClick = (rowIndex) => {
    if (rowIndex !== null && currentBatches[rowIndex]) {
      const batchId = currentBatches[rowIndex].id;
      handleEditBatch(batchId);
    }
  };
  
  // Handle delete functionality
  const handleDeleteBatch = async (batchId) => {
    try {
      setIsSubmitting(true);
      // Call API to delete batch
      const response = await axios.delete(`/delete-batch/${batchId}`);
      
      // Show success message
      alert(response.data?.msg || "Batch deleted successfully");
      
      // Refetch batches after deletion
      const batchesResponse = await axios.get("/batches");
      setBatches(batchesResponse.data);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error deleting batch:", error);
      
      // Show appropriate error message
      let errorMessage = "Failed to delete batch";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.msg || errorMessage;
        
        if (error.response.status === 403) {
          errorMessage = "You don't have permission to delete this batch.";
        } else if (error.response.status === 404) {
          errorMessage = "Batch not found. It may have already been deleted.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      } 
      
      alert(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Updated Table Headers
  const tableHeaders = [
    "Batch Number",
    "Product Alias",
    "MRP",
    "Manufacturing Date",
    "Expiration Date",
    "Plant Name",
  ];

  // Table Rows
  const tableRows = currentBatches.map((batch) => [
    batch.batch_number,
    batch.product_alias.product_alias, // Access product_alias from nested object
    batch.mrp,
    batch.mfg_date,
    batch.exp_date,
    batch.plant_name,
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
            buttonText="Add New Batch"
            onButtonClick={() => {
              setNewBatch({
                batch_number: "",
                exp_date: "",
                mfg_date: "",
                product_id: "",
                    extra_fields: {},
                    scheme_id: "",
                    mrp: "",
                    company_id: "",
                    no_of_inner_box: "",
                    cashback_amount: "",
                  });
                  setEditMode(false);
                  setEditBatchId(null);
                  setShowModal(true);
                  // If not admin, check company's packing_enabled
                  if (userData.role !== "admin" && userData.companyId) {
                    fetchCompanyDetails(userData.companyId);
                  } else {
                    setPackingEnabled(false);
                  }
                }}
                pageCount={Math.ceil(filteredBatches.length / batchesPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
                onEditClick={handleEditButtonClick}
                onDeleteRequest={(rowIndex) => {
                  if (rowIndex !== null && currentBatches[rowIndex]) {
                    const batchId = currentBatches[rowIndex].id;
                    handleDeleteBatch(batchId);
                  }
                }}
              />

              <Modal
                isOpen={showModal}
                onRequestClose={() => {
                  setShowModal(false);
                  setEditMode(false);
                  setEditBatchId(null);
                  setIsSubmitting(false);
                  // Force a re-render by updating the filtered batches reference
                  setFilteredBatches([...filteredBatches]);
                }}
                contentLabel={editMode ? "Edit Batch" : "Add New Batch"}
                className="bg-white p-6 rounded shadow-lg w-1/2 mx-auto mt-10"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
                style={{
                  content: {
                    maxHeight: "95vh",
                    overflowY: "auto",
                  },
                }}
              >
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setEditBatchId(null);
                    setIsSubmitting(false);
                    // Force a re-render by updating the filtered batches reference
                    setFilteredBatches([...filteredBatches]);
                  }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-2">
                  {editMode ? "Edit Batch" : "Add New Batch"}
                </h2>

                {/* Input fields arranged in 2 columns. Show only 4 editable fields when editing a batch. */}
                {editMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        name="batch_number"
                        value={newBatch.batch_number}
                        onChange={handleInputChange}
                        maxLength={10}
                        className={`w-full p-2 border rounded ${
                          inputError.batch_number || duplicateBatchError
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.batch_number && (
                        <span className="text-red-500 text-xs">
                          {!newBatch.batch_number
                            ? "Required"
                            : "Max 10 characters allowed"}
                        </span>
                      )}
                      {duplicateBatchError && (
                        <span className="text-red-500 text-xs">
                          {duplicateBatchError}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Max Retail Price<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="mrp"
                        value={newBatch.mrp}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.mrp ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {inputError.mrp && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Expiration Date<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="exp_date"
                        value={newBatch.exp_date}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.exp_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.exp_date && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Manufacturing Date<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="mfg_date"
                        value={newBatch.mfg_date}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.mfg_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.mfg_date && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Batch Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="batch_number"
                        value={newBatch.batch_number}
                        onChange={handleInputChange}
                        maxLength={10}
                        className={`w-full p-2 border rounded ${
                          inputError.batch_number || duplicateBatchError
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.batch_number && (
                        <span className="text-red-500 text-xs">
                          {!newBatch.batch_number
                            ? "Required"
                            : "Max 10 characters allowed"}
                        </span>
                      )}
                      {duplicateBatchError && (
                        <span className="text-red-500 text-xs">
                          {duplicateBatchError}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Max Retail Price<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="mrp"
                        value={newBatch.mrp}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.mrp ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {inputError.mrp && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Expiration Date<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="exp_date"
                        value={newBatch.exp_date}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.exp_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.exp_date && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Manufacturing Date<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="mfg_date"
                        value={newBatch.mfg_date}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.mfg_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.mfg_date && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>

                    {/* Company Dropdown for Admin Users */}
                    {userData.role === "admin" && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Company
                        </label>
                        <select
                          name="company_id"
                          value={newBatch.company_id}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded ${
                            inputError.company_id
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="">Select Company<span className="text-red-500">*</span></option>
                          {console.log("Companies in dropdown render:", companies)}
                            {companies && companies.map((company) => {
                              console.log("Company item:", company);
                              const companyId = company.id || company._id;
                              const companyName = company.company_name || company.name;
                              return (
                                <option key={companyId} value={companyId}>
                                  {companyName}
                                </option>
                              );
                            })}
                        </select>
                        {inputError.company_id && (
                          <span className="text-red-500 text-xs">Required</span>
                        )}
                      </div>
                    )}

                    {/* Product & Cashback Fields in One Row */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="product_id"
                        value={newBatch.product_id}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.product_id
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">
                          {userData.role === "admin" && !newBatch.company_id 
                            ? "Select a company first" 
                            : "Select Product"}
                        </option>
                        {products.map((product) => {
                          const productId = product.id || product._id;
                          return (
                            <option key={productId} value={productId}>
                              {product.product_alias}
                            </option>
                          );
                        })}
                      </select>
                      {inputError.product_id && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    {companyCashbackEnabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Scheme
                          </label>
                          <select
                            name="scheme_id"
                            value={newBatch.scheme_id}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded border-gray-300"
                          >
                            <option value="">
                              {userData.role === "admin" && !newBatch.company_id 
                                ? "Select a company first" 
                                : "Select Scheme"}
                            </option>
                            {schemes.map((scheme) => {
                              const schemeId = scheme.id || scheme._id;
                              return (
                                <option key={schemeId} value={schemeId}>
                                  {scheme.scheme_name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Cashback Amount
                          </label>
                          <input
                            type="number"
                            name="cashback_amount"
                            value={newBatch.cashback_amount}
                            onChange={handleInputChange}
                            min="0"
                            step="1"
                            onKeyPress={(e) => {
                              // Allow only digits and navigation keys
                              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && 
                                  e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                                e.preventDefault();
                              }
                            }}
                            className="w-full p-2 border rounded border-gray-300"
                            placeholder="Enter cashback amount"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Render extra fields dynamically (only when adding a new batch) */}
                {!editMode && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {extraFields.map((field, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium mb-1">
                          {field}
                        </label>
                        <input
                          type="text"
                          name={field}
                          value={newBatch.extra_fields[field] || ""}
                          onChange={handleExtraFieldChange}
                          className="w-full p-2 border rounded border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Number of Inner Pack field if packing is enabled (only when adding) */}
                {!editMode && packingEnabled && (
                  <div className="col-span-2 mt-4">
                    <label className="block text-sm font-medium mb-1">
                      Number of Inner Pack <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="no_of_inner_box"
                      value={newBatch.no_of_inner_box}
                      onChange={handleInputChange}
                      min="1"
                      step="1" // Ensure only whole numbers
                      onKeyPress={(e) => {
                        // Allow only digits and navigation keys
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && 
                            e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full p-2 border rounded ${
                        inputError.no_of_inner_box ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {inputError.no_of_inner_box && (
                      <span className="text-red-500 text-xs">Required</span>
                    )}
                  </div>
                )}

                {/* Add Batch Button */}
                <div className="mt-6">
                  <button
                    onClick={handleFormSubmit}
                    className={`w-full bg-teal-600 text-white font-bold px-4 py-3 rounded text-lg ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-teal-700"
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? editMode
                        ? "Updating..."
                        : "Adding..."
                      : editMode
                      ? "UPDATE BATCH"
                      : "ADD BATCH"}
                  </button>
                </div>
              </Modal>
        </div>
      )}
    </>
  );
};

export default BatchesPage;
