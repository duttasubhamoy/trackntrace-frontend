import React, { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";

const SettingsPage = () => {
  const { userData, companyCashbackEnabled } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [extraFields, setExtraFields] = useState([null, null, null, null]); // Initialize with 4 fields as null
  const [nonEditableFields, setNonEditableFields] = useState([
    false,
    false,
    false,
    false,
  ]); // Track non-editable status
  const [editableCompanyFields, setEditableCompanyFields] = useState({
    name: false,
    address: false,
    gstno: false,
    mobile: false,
    email: false,
    registration_no: false,
    customer_care_no: false,
  });
  const [companyForm, setCompanyForm] = useState(null);
  const [isApplyingCompanyChanges, setIsApplyingCompanyChanges] =
    useState(false);
  const [fieldsFromServer, setFieldsFromServer] = useState([
    false,
    false,
    false,
    false,
  ]); // Track fields that came from server response

  const [currentExtraFieldProducts, setCurrentExtraFieldProducts] = useState(
    []
  ); // Store current extra fields for products
  const [currentExtraFieldBatches, setCurrentExtraFieldBatches] = useState([]); // Store current extra fields for batches
  
  // Company extra fields state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyExtraFields, setCompanyExtraFields] = useState([]); // Array of {name: "", value: ""}

  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) return;

    const fetchCompanyDetails = async (companyId) => {
      try {
        const response = await axios.get(`/company/${companyId}`);
        setCompanyDetails(response.data);
        setCompanyForm(response.data);
      } catch (error) {
        console.error("Error fetching company details:", error);
      }
    };

    if (userData.role !== "master") {
      navigate("/dashboard");
    }
    fetchCompanyDetails(userData.companyId);
    setIsLoading(false);
  }, [userData, navigate]);

  // Handler to enable editing for a specific company field
  const handleCompanyFieldChange = (field) => {
    setEditableCompanyFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  // Handle input change for company form
  const handleCompanyInputChange = (field, value) => {
    setCompanyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle Apply Changes
  const handleApplyCompanyChanges = async () => {
    // Only send changed fields
    const changedFields = {};
    Object.keys(editableCompanyFields).forEach((key) => {
      if (
        editableCompanyFields[key] &&
        companyForm[key] !== companyDetails[key]
      ) {
        changedFields[key] = companyForm[key];
      }
    });
    if (Object.keys(changedFields).length === 0) {
      alert("No changes to apply.");
      return;
    }
    setIsApplyingCompanyChanges(true); // Disable button
    try {
      await axios.put(
        `/register?company_id=${userData.companyId}`,
        changedFields
      );
      alert("Company updated successfully.");
      // Refresh details and reset edit state
      setCompanyDetails((prev) => ({ ...prev, ...changedFields }));
      setEditableCompanyFields({
        name: false,
        address: false,
        gstno: false,
        mobile: false,
        email: false,
        registration_no: false,
        customer_care_no: false,
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Failed to update company."
      );
    }
    setIsApplyingCompanyChanges(false); // Re-enable button after request
  };

  // Fetch existing extra fields for Products or Batches
  const fetchExtraFields = async (type) => {
    try {
      const response = await axios.get("/company-extra-fields");
      const { extra_field_products, extra_field_batch, extra_field_company } = response.data;

      setCurrentExtraFieldProducts(extra_field_products || []);
      setCurrentExtraFieldBatches(extra_field_batch || []);

      if (type === "product") {
        const fields = [
          extra_field_products[0] || null,
          extra_field_products[1] || null,
          extra_field_products[2] || null,
          extra_field_products[3] || null,
        ];
        setExtraFields(fields);

        // Set non-editable and from-server status for fields with values
        setNonEditableFields(fields.map((field) => !!field));
        setFieldsFromServer(fields.map((field) => !!field));
      } else if (type === "batch") {
        const fields = [
          extra_field_batch[0] || null,
          extra_field_batch[1] || null,
          extra_field_batch[2] || null,
          extra_field_batch[3] || null,
        ];
        setExtraFields(fields);

        // Set non-editable and from-server status for fields with values
        setNonEditableFields(fields.map((field) => !!field));
        setFieldsFromServer(fields.map((field) => !!field));
      } else if (type === "company") {
        // Load company extra fields
        setCompanyExtraFields(extra_field_company || []);
      }
    } catch (error) {
      console.error("Error fetching extra fields:", error);
    }
  };

  // Handlers to open/close modals
  const openProductModal = async () => {
    await fetchExtraFields("product"); // Fetch the product extra fields
    setIsProductModalOpen(true);
  };
  const closeProductModal = () => setIsProductModalOpen(false);

  const openBatchModal = async () => {
    await fetchExtraFields("batch"); // Fetch the batch extra fields
    setIsBatchModalOpen(true);
  };
  const closeBatchModal = () => setIsBatchModalOpen(false);

  const openCompanyModal = async () => {
    await fetchExtraFields("company"); // Fetch the company extra fields
    setIsCompanyModalOpen(true);
  };
  const closeCompanyModal = () => setIsCompanyModalOpen(false);

  // Handle form input changes
  const handleInputChange = (index, value) => {
    const updatedFields = [...extraFields];
    updatedFields[index] = value || null; // Set null if value is empty
    setExtraFields(updatedFields);
  };

  // Edit field: make it editable
  const handleEditField = (index) => {
    const updatedEditableFields = [...nonEditableFields];
    updatedEditableFields[index] = false; // Make the field editable
    setNonEditableFields(updatedEditableFields);
  };

  // Remove field: set value to null and make editable
  const handleRemoveField = (index) => {
    const updatedFields = [...extraFields];
    updatedFields[index] = null; // Set the value to null

    const updatedEditableFields = [...nonEditableFields];
    updatedEditableFields[index] = false; // Make the field editable

    setExtraFields(updatedFields);
    setNonEditableFields(updatedEditableFields);
  };

  // Save updated extra fields
  const handleSaveExtraFields = async (type) => {
    try {
      let payload = {};

      if (type === "product") {
        // Filter out empty fields (null) from the extraFields array before saving
        const filteredFields = extraFields.filter((field) => field !== null);
        payload = {
          extra_field_products: filteredFields,
          extra_field_batch: currentExtraFieldBatches, // Preserve current batch fields
        };
      } else if (type === "batch") {
        const filteredFields = extraFields.filter((field) => field !== null);
        payload = {
          extra_field_products: currentExtraFieldProducts, // Preserve current product fields
          extra_field_batch: filteredFields,
        };
      } else if (type === "company") {
        // Filter out empty company fields
        const filteredCompanyFields = companyExtraFields.filter(
          (field) => field.name && field.value
        );
        payload = {
          extra_field_company: filteredCompanyFields,
        };
      }

      const response = await axios.post("/update-extra-fields", payload);
      console.log("Response after saving:", response.data);
      alert("Extra fields updated successfully.");
      closeProductModal();
      closeBatchModal();
      closeCompanyModal();
    } catch (error) {
      console.error("Error saving extra fields:", error);
      alert("An error occurred while updating extra fields.");
    }
  };

  // Company extra fields handlers
  const handleAddCompanyField = () => {
    setCompanyExtraFields([...companyExtraFields, { name: "", value: "" }]);
  };

  const handleCompanyExtraFieldChange = (index, field, value) => {
    const updatedFields = [...companyExtraFields];
    updatedFields[index][field] = value;
    setCompanyExtraFields(updatedFields);
  };

  const handleRemoveCompanyField = (index) => {
    const updatedFields = companyExtraFields.filter((_, i) => i !== index);
    setCompanyExtraFields(updatedFields);
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CgSpinner className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage extra fields and company information
                  </p>
                </div>
              </div>

              {/* Card Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div
                  onClick={openProductModal}
                  className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-teal-200 transition"
                >
                  <div className="text-sm text-gray-500 mb-2">Products</div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add Extra Fields
                  </h2>
                </div>
                <div
                  onClick={openBatchModal}
                  className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-teal-200 transition"
                >
                  <div className="text-sm text-gray-500 mb-2">Batches</div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add Extra Fields
                  </h2>
                </div>
                <div
                  onClick={openCompanyModal}
                  className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-teal-200 transition"
                >
                  <div className="text-sm text-gray-500 mb-2">Company</div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add Extra Fields
                  </h2>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Company Details</h2>
                  <span className="text-xs text-gray-400">Editable fields on request</span>
                </div>
                  {companyDetails ? (
                    <form
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      onSubmit={(e) => e.preventDefault()}
                    >
                      {[
                        { label: "Name", key: "name" },
                        { label: "Address", key: "address" },
                        { label: "GST No", key: "gstno" },
                        { label: "Mobile", key: "mobile" },
                        { label: "Email", key: "email" },
                        { label: "Registration No", key: "registration_no" },
                        { label: "Customer Care No", key: "customer_care_no" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium mb-1 text-gray-700">
                            {field.label}
                            <button
                              type="button"
                              className="ml-2 text-teal-600 hover:text-teal-700 underline text-xs"
                              onClick={() =>
                                handleCompanyFieldChange(field.key)
                              }
                            >
                              change
                            </button>
                          </label>
                          <input
                            type="text"
                            value={companyForm[field.key] || ""}
                            disabled={!editableCompanyFields[field.key]}
                            onChange={(e) =>
                              handleCompanyInputChange(
                                field.key,
                                e.target.value
                              )
                            }
                            className={`w-full p-2 border rounded-lg ${
                              editableCompanyFields[field.key]
                                ? "bg-white border-gray-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          />
                        </div>
                      ))}
                      <div className="md:col-span-2 flex justify-end pt-2">
                        <button
                          type="button"
                          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleApplyCompanyChanges}
                          disabled={isApplyingCompanyChanges}
                        >
                          {isApplyingCompanyChanges
                            ? "Applying..."
                            : "Apply Changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-gray-500">
                      No company details found.
                    </div>
                  )}
                </div>
          </div>

          {/* Modal for Extra Fields for Products */}
          {isProductModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-xl shadow-xl w-[420px] max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Add Extra Fields for Products
                      </h2>
                    </div>
                    <form>
                      {extraFields.map((field, index) => (
                        <div key={index} className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Field {index + 1}
                          </label>
                          <input
                            type="text"
                            name={`field${index + 1}`}
                            value={field || ""}
                            onChange={(e) =>
                              handleInputChange(index, e.target.value)
                            }
                            className="block w-full p-2.5 border border-gray-300 rounded-lg"
                            readOnly={nonEditableFields[index]} // Make field editable based on nonEditableFields
                          />
                          {/* Show "Edit" and "Remove" only for fields that came from server */}
                          {fieldsFromServer[index] && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-teal-600 hover:underline mr-4 text-sm"
                                onClick={() => handleEditField(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline text-sm"
                                onClick={() => handleRemoveField(index)}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={closeProductModal}
                          className="mr-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveExtraFields("product")}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal for Extra Fields for Batches */}
              {isBatchModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-xl shadow-xl w-[420px] max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Add Extra Fields for Batches
                      </h2>
                    </div>
                    <form>
                      {extraFields.map((field, index) => (
                        <div key={index} className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Field {index + 1}
                          </label>
                          <input
                            type="text"
                            name={`field${index + 1}`}
                            value={field || ""}
                            onChange={(e) =>
                              handleInputChange(index, e.target.value)
                            }
                            className="block w-full p-2.5 border border-gray-300 rounded-lg"
                            readOnly={nonEditableFields[index]} // Make field editable based on nonEditableFields
                          />
                          {/* Show "Edit" and "Remove" only for fields that came from server */}
                          {fieldsFromServer[index] && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-teal-600 hover:underline mr-4 text-sm"
                                onClick={() => handleEditField(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline text-sm"
                                onClick={() => handleRemoveField(index)}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={closeBatchModal}
                          className="mr-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveExtraFields("batch")}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal for Extra Fields for Company */}
              {isCompanyModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-xl shadow-xl w-[640px] max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Add Extra Fields for Company
                      </h2>
                    </div>
                    <form>
                      {companyExtraFields.map((field, index) => (
                        <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field Name
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  handleCompanyExtraFieldChange(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Alt Mobile 1"
                                className="block w-full p-2.5 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field Value
                              </label>
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) =>
                                  handleCompanyExtraFieldChange(
                                    index,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., +91-999..."
                                className="block w-full p-2.5 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-red-600 hover:underline text-sm"
                            onClick={() => handleRemoveCompanyField(index)}
                          >
                            Remove Field
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddCompanyField}
                        className="mb-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        + Add New Field
                      </button>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={closeCompanyModal}
                          className="mr-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveExtraFields("company")}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
        </div>
        )}
    </>
  );
};

export default SettingsPage;
