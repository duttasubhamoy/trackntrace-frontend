import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
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

  const navigate = useNavigate();

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

        if (role !== "master") {
          navigate("/dashboard");
        }
        fetchCompanyDetails(company_id);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    const fetchCompanyDetails = async (companyId) => {
      try {
        const response = await axios.get(`/company/${companyId}`);
        setCompanyDetails(response.data);
        setCompanyForm(response.data);
      } catch (error) {
        console.error("Error fetching company details:", error);
      }
    };
    fetchUserData();
  }, [navigate]);

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
      const { extra_field_products, extra_field_batch } = response.data;

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
      // Filter out empty fields (null) from the extraFields array before saving
      const filteredFields = extraFields.filter((field) => field !== null);

      // Ensure that we send the correct fields based on type (product or batch)
      const payload = {
        extra_field_products:
          type === "product" ? filteredFields : currentExtraFieldProducts, // Preserve current batch fields when updating products
        extra_field_batch:
          type === "batch" ? filteredFields : currentExtraFieldBatches, // Preserve current product fields when updating batches
      };

      const response = await axios.post("/update-extra-fields", payload);
      console.log("Response after saving:", response.data);
      alert("Extra fields updated successfully.");
      closeProductModal();
      closeBatchModal();
    } catch (error) {
      console.error("Error saving extra fields:", error);
      alert("An error occurred while updating extra fields.");
    }
  };

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
              <h1 className="text-xl font-semibold mb-6">Settings</h1>

              {/* Card Buttons */}
              <div className="grid grid-cols-2 gap-6">
                <div
                  onClick={openProductModal}
                  className="p-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg"
                >
                  <h2 className="text-lg font-bold">
                    Add Extra Fields for Products
                  </h2>
                </div>
                <div
                  onClick={openBatchModal}
                  className="p-6 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg"
                >
                  <h2 className="text-lg font-bold">
                    Add Extra Fields for Batches
                  </h2>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-lg font-bold mb-4">Company Details</h2>
                  {companyDetails ? (
                    <form
                      className="space-y-4"
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
                          <label className="block text-sm font-medium mb-1">
                            {field.label}
                            <button
                              type="button"
                              className="ml-2 text-blue-600 underline text-xs"
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
                            className={`w-full p-2 border rounded ${
                              editableCompanyFields[field.key]
                                ? "bg-white"
                                : "bg-gray-100"
                            }`}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleApplyCompanyChanges}
                        disabled={isApplyingCompanyChanges}
                      >
                        {isApplyingCompanyChanges
                          ? "Applying..."
                          : "Apply Changes"}
                      </button>
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
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                  <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-bold mb-4">
                      Add Extra Fields for Products
                    </h2>
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
                            className="block w-full p-2 border border-gray-300 rounded"
                            readOnly={nonEditableFields[index]} // Make field editable based on nonEditableFields
                          />
                          {/* Show "Edit" and "Remove" only for fields that came from server */}
                          {fieldsFromServer[index] && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-blue-600 hover:underline mr-4"
                                onClick={() => handleEditField(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline"
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
                          className="mr-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveExtraFields("product")}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                  <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-bold mb-4">
                      Add Extra Fields for Batches
                    </h2>
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
                            className="block w-full p-2 border border-gray-300 rounded"
                            readOnly={nonEditableFields[index]} // Make field editable based on nonEditableFields
                          />
                          {/* Show "Edit" and "Remove" only for fields that came from server */}
                          {fieldsFromServer[index] && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-blue-600 hover:underline mr-4"
                                onClick={() => handleEditField(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-red-600 hover:underline"
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
                          className="mr-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveExtraFields("batch")}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
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

export default SettingsPage;
