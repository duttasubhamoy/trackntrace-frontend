import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { fetchCompanyCashbackStatus } from "../utils/companyUtils";
import TableWithSearchAndPagination from "../components/TableWithSearchAndPagination"; // Import the table component

Modal.setAppElement("#root"); // For accessibility

const ProductsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [variantMode, setVariantMode] = useState(false); // Added for variant creation
  const [editProductId, setEditProductId] = useState(null);
  const [companyCashbackEnabled, setCompanyCashbackEnabled] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_alias: "",
    name: "",
    quantity: "",
    unit: "",
    description: "",
    extra_fields: {},
    technical_name: "", // <-- added
    cautionary_symbol: "", // <-- added
    antidote_statement: "", // <-- added
    cir_reg_no: "", // <-- added for product registration
    company_id: "", // <-- added for admin to select company
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [productsPerPage] = useState(10); // Fixed number of products per page
  const [extraFields, setExtraFields] = useState({
    extra_field_products: [],
    extra_field_batch: [],
  });
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    role: "",
    lastLogin: "",
    companyName: "",
  });
  const [inputError, setInputError] = useState({
    product_alias: false,
    name: false,
    quantity: false,
    unit: false,
    company_id: false,
  });
  const [companies, setCompanies] = useState([]);

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
        console.log("ProductsPage - User role set to:", role); // Debug log
        if (role === "salesman") {
          navigate("/dashboard");
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

        // If user is admin, fetch all companies
        if (role === "admin") {
          try {
            const companiesRes = await axios.get("/companies");
            // Log the companies data to the console for debugging
            console.log("Companies API Response:", companiesRes.data);
            setCompanies(companiesRes.data);
          } catch (error) {
            console.error("Error fetching companies:", error);
          }
        }

        fetchProducts();
        fetchExtraFields(role); // Pass the user role
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get("/products");
        setProducts(response.data);
        setFilteredProducts(response.data); // Initialize filtered products with all products
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      }
    };

    const fetchExtraFields = async (userRole) => {
      // Skip this API call if user is admin
      if (userRole === "admin") {
        return;
      }
      
      try {
        const response = await axios.get("/company-extra-fields");
        setExtraFields(response.data);
      } catch (error) {
        console.error("Error fetching extra fields:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle search functionality
  useEffect(() => {
    const filterProducts = () => {
      const filtered = products.filter(
        (product) =>
          (product.product_alias &&
            product.product_alias
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (product.name &&
            product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.description &&
            product.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    };

    filterProducts();
  }, [searchTerm, products]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setNewProduct({ ...newProduct, [name]: files[0] });
  };

  const handleExtraFieldChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prevProduct) => ({
      ...prevProduct,
      extra_fields: { ...prevProduct.extra_fields, [name]: value },
    }));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const indexOfLastProduct = (currentPage + 1) * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const validateInputs = () => {
    const errors = {
      product_alias: !newProduct.product_alias,
      name: !newProduct.name,
      quantity: !newProduct.quantity,
      unit: !newProduct.unit,
      // Only validate company_id for admin users
      company_id: userData.role === "admin" && !newProduct.company_id
    };
    setInputError(errors);
    return !(
      errors.product_alias ||
      errors.name ||
      errors.quantity ||
      errors.unit ||
      errors.company_id
    );
  };

  const handleFormSubmit = async () => {
    if (!validateInputs()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("product_alias", newProduct.product_alias);
      formData.append("name", newProduct.name);
      formData.append("quantity", newProduct.quantity);
      formData.append("unit", newProduct.unit);
      formData.append("description", newProduct.description);
      formData.append("technical_name", newProduct.technical_name);
      formData.append("cautionary_symbol", newProduct.cautionary_symbol);
      formData.append("antidote_statement", newProduct.antidote_statement);
      formData.append("cir_reg_no", newProduct.cir_reg_no);
      
      // For admin users, include the selected company_id
      if (userData.role === "admin" && newProduct.company_id) {
        formData.append("company_id", newProduct.company_id);
        console.log("Adding company_id to request:", newProduct.company_id);
      }

      // Add extra fields to the form data as a JSON string
      formData.append('extra_fields', JSON.stringify(newProduct.extra_fields));

      // Add files to the form data if available
      if (newProduct.video_file) {
        formData.append("video_file", newProduct.video_file);
      }
      if (newProduct.image_file) {
        formData.append("image_file", newProduct.image_file);
      }
      if (newProduct.pdf_file) {
        formData.append("pdf_file", newProduct.pdf_file);
      }

      // Log the FormData contents
      console.log(editMode ? "Update Product Data:" : "New Product Data:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      // Also log the raw newProduct object for comparison
      console.log("Raw newProduct object:", newProduct);

      if (editMode) {
        // Update existing product
        await axios.put(`/edit-product/${editProductId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Product updated successfully");
      } else if (variantMode) {
        // Create product variant
        await axios.post(`/add-new-variant/${editProductId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Product Variant Created Successfully");
      } else {
        // Create new product
        await axios.post("/add-product", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Product Added Successfully");
      }

      // Reset form and state
      setNewProduct({
        product_alias: "",
        name: "",
        quantity: "",
        unit: "",
        description: "",
        extra_fields: {},
        technical_name: "",
        cautionary_symbol: "",
        antidote_statement: "",
        cir_reg_no: "",
        company_id: "",
        video_file: null,
        image_file: null,
        pdf_file: null,
      });
      setInputError({
        product_alias: false,
        name: false,
        quantity: false,
        unit: false,
      });
      setEditMode(false);
      setVariantMode(false); // Reset variant mode
      setEditProductId(null);
      setShowModal(false);
      setIsSubmitting(false);
      
      // Refetch products after adding/editing
      const response = await axios.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error adding product:", error);
      setIsSubmitting(false);
    }
  };

  // Handle creating a product variant
  const handleAddVariant = async (productId) => {
    try {
      setIsSubmitting(true);
      // Fetch the product data
      const response = await axios.get(`/product/${productId}`);
      const productData = response.data;
      
      // Set the base product data for the variant, but change the alias to indicate it's a variant
      setNewProduct({
        product_alias: `${productData.product_alias} - Variant`, // Suggest a variant name
        name: productData.name || "",
        quantity: productData.quantity || "",
        unit: productData.unit || "",
        description: productData.description || "",
        technical_name: productData.technical_name || "",
        cautionary_symbol: productData.cautionary_symbol || "",
        antidote_statement: productData.antidote_statement || "",
        cir_reg_no: productData.cir_reg_no || "",
        company_id: productData.company_id || "",
        extra_fields: productData.extra_fields || {},
        video_file: null,
        image_file: null,
        pdf_file: null,
      });
      
      // Set a special variant creation mode
      setEditMode(false); // Not in edit mode
      setVariantMode(true); // In variant creation mode
      setEditProductId(productId); // Store the source product ID
      
      // Open the modal
      setShowModal(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error fetching product for variant creation:", error);
      alert("Failed to load product details.");
      setIsSubmitting(false);
    }
  };

  // Handle editing a product
  const handleEditProduct = async (productId) => {
    try {
      setIsSubmitting(true);
      // Fetch the product data
      const response = await axios.get(`/product/${productId}`);
      const productData = response.data;
      
      // Set the product data in the form
      setNewProduct({
        product_alias: productData.product_alias || "",
        name: productData.name || "",
        quantity: productData.quantity || "",
        unit: productData.unit || "",
        description: productData.description || "",
        technical_name: productData.technical_name || "",
        cautionary_symbol: productData.cautionary_symbol || "",
        antidote_statement: productData.antidote_statement || "",
        cir_reg_no: productData.cir_reg_no || "",
        company_id: productData.company_id || "",
        extra_fields: productData.extra_fields || {},
        // Files cannot be pre-filled, so keep them null
        video_file: null,
        image_file: null,
        pdf_file: null,
      });
      
      // Set edit mode
      setEditMode(true);
      setEditProductId(productId);
      
      // Open the modal
      setShowModal(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error fetching product for edit:", error);
      alert("Failed to load product details.");
      setIsSubmitting(false);
    }
  };

  // Handle edit button click from TableWithSearchAndPagination
  const handleEditButtonClick = (rowIndex, mode = 'edit') => {
    if (rowIndex !== null && currentProducts[rowIndex]) {
      const productId = currentProducts[rowIndex].id;
      if (mode === 'variant') {
        handleAddVariant(productId);
      } else {
        handleEditProduct(productId);
      }
    }
  };

  // Handle delete product functionality
  const handleDeleteProduct = async (rowIndex) => {
    if (rowIndex !== null && currentProducts[rowIndex]) {
      const productId = currentProducts[rowIndex].id;
      try {
        setIsLoading(true);
        const response = await axios.delete(`/delete-product/${productId}`);
        
        if (response.status === 200) {
          // Successful deletion
          alert("Product deleted successfully");
          // Refetch products to update the list
          const updatedProducts = await axios.get("/products");
          setProducts(updatedProducts.data);
          setFilteredProducts(updatedProducts.data);
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 403) {
            alert("Permission denied. You can only delete products in your company.");
          } else if (error.response.status === 404) {
            alert("Product not found. It may have been already deleted.");
          } else {
            alert(`Error deleting product: ${error.response.data.msg || "Unknown error"}`);
          }
        } else {
          alert("Error connecting to the server. Please try again later.");
        }
        console.error("Error deleting product:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Table Headers
  const tableHeaders = ["Alias", "Name", "Quantity", "Unit", "Description"];

  // Table Rows (for mapping data to table cells)
  const tableRows = currentProducts.map((product) => [
    product.product_alias,
    product.name,
    product.quantity,
    product.unit,
    product.description || "N/A",
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
                buttonText="Add Product"
                onButtonClick={() => {
                  setNewProduct({
                    product_alias: "",
                    name: "",
                    quantity: "",
                    unit: "",
                    description: "",
                    extra_fields: {},
                    technical_name: "",
                    cautionary_symbol: "",
                    antidote_statement: "",
                    cir_reg_no: "",
                    company_id: "",
                    video_file: null,
                    image_file: null,
                    pdf_file: null,
                  });
                  setEditMode(false);
                  setVariantMode(false);
                  setEditProductId(null);
                  setShowModal(true);
                }}
                pageCount={Math.ceil(filteredProducts.length / productsPerPage)}
                onPageChange={handlePageClick}
                currentPage={currentPage}
                userRole={userData.role}
                onEditClick={handleEditButtonClick}
                onDeleteRequest={handleDeleteProduct}
                productsData={currentProducts}
              />

              <Modal
                isOpen={showModal}
                onRequestClose={() => {
                  setShowModal(false);
                  setEditMode(false);
                  setVariantMode(false);
                  setEditProductId(null);
                }}
                contentLabel={editMode ? "Edit Product" : "Add New Product"}
                className="bg-white rounded shadow-lg w-1/2 mx-auto mt-10 relative"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setVariantMode(false);
                    setEditProductId(null);
                  }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>

                {/* Fixed Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-300 z-10">
                  <h2 className="text-xl font-bold">
                    {editMode 
                      ? "Edit Product" 
                      : variantMode 
                        ? "Add Product Variant" 
                        : "Add New Product"
                    }
                  </h2>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  {/* Input fields arranged in two columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Product Alias
                      </label>
                      <input
                        type="text"
                        name="product_alias"
                        value={newProduct.product_alias}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.product_alias
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.product_alias && (
                        <span className="text-red-500 text-xs">Require</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newProduct.name}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {inputError.name && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={newProduct.quantity}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.quantity
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {inputError.quantity && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        name="unit"
                        value={newProduct.unit}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded ${
                          inputError.unit ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {inputError.unit && (
                        <span className="text-red-500 text-xs">Required</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={newProduct.description}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    
                    {/* Company Dropdown for Admin Users */}
                    {userData.role === "admin" && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Company
                        </label>
                        <select
                          name="company_id"
                          value={newProduct.company_id}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded ${
                            inputError.company_id ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          <option value="">Select Company</option>
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
                          <span className="text-red-500 text-xs">Required for admin users</span>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Technical Name
                      </label>
                      <input
                        type="text"
                        name="technical_name"
                        value={newProduct.technical_name}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Cautionary Symbol
                      </label>
                      <select
                        name="cautionary_symbol"
                        value={newProduct.cautionary_symbol}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select Symbol</option>
                        <option value="Green">Green</option>
                        <option value="Blue">Blue</option>
                        <option value="Yellow">Yellow</option>
                        <option value="Red">Red</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Product Registration No.
                      </label>
                      <input
                        type="text"
                        name="cir_reg_no"
                        value={newProduct.cir_reg_no}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Antidote Statement
                      </label>
                      <input
                        type="text"
                        name="antidote_statement"
                        value={newProduct.antidote_statement}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>

                  {/* File Upload Fields in Two Columns */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Video File
                      </label>
                      <input
                        type="file"
                        name="video_file"
                        onChange={handleFileChange}
                        accept="video/*"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image File
                      </label>
                      <input
                        type="file"
                        name="image_file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        PDF File
                      </label>
                      <input
                        type="file"
                        name="pdf_file"
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>

                  {/* Extra Fields Start from a New Row */}
                  {extraFields.extra_field_products.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {extraFields.extra_field_products.map((field, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium mb-1">
                            {field}
                          </label>
                          <input
                            type="text"
                            name={field}
                            value={newProduct.extra_fields[field] || ""}
                            onChange={handleExtraFieldChange}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Product Button (Full Width, Bold Text) */}
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
                        ? (editMode ? "Updating..." : variantMode ? "Creating Variant..." : "Adding...") 
                        : (editMode ? "UPDATE PRODUCT" : variantMode ? "ADD VARIANT" : "ADD PRODUCT")}
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
