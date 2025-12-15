import React, { useState, useEffect } from "react";
import Pagination from "rc-pagination";
import Modal from "react-modal";
import "rc-pagination/assets/index.css";
import axios from "../utils/axiosConfig";

const TableWithSearchAndPagination = ({
  tableHeaders,
  tableRows,
  searchTerm,
  setSearchTerm,
  buttonText,
  onButtonClick,
  pageCount,
  onPageChange,
  currentPage,
  userRole,
  onDeleteRequest,
  onEditClick,
  productsData,
}) => {
  // State to handle selected row
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
  // Log the user role for debugging
  console.log("TableWithSearchAndPagination received userRole:", userRole);

  // Handle radio button selection
  const handleRadioChange = (index) => {
    setSelectedRow(index);
    console.log(index);
  };

  // Check if the user is admin, master, plant_owner, or staff
  const canSelectRows = ["admin", "master", "plant_owner", "staff"].includes(userRole);

  const handleDeleteConfirm = () => {
    if (selectedRow !== null) {
      setIsDeleteLoading(true);
      // Pass the selected row index to the parent component
      onDeleteRequest && onDeleteRequest(selectedRow);
      setShowDeleteModal(false); // Close modal after confirming deletion
      // Note: isDeleteLoading is not reset here as it will remain disabled until the operation completes
      // It should be reset in the parent component or when the state changes
    }
  };
  
  // Handle clicking on a product alias to view details
  const handleProductAliasClick = async (rowIndex) => {
    if (productsData && productsData[rowIndex]) {
      try {
        setIsLoadingDetails(true);
        const productId = productsData[rowIndex].id;
        const response = await axios.get(`/product/${productId}`);
        setProductDetails(response.data);
        setShowProductDetailsModal(true);
      } catch (error) {
        console.error("Error fetching product details:", error);
        alert("Failed to load product details. Please try again.");
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };
  
  // Reset button states when productsData changes (indicates a refresh/update)
  useEffect(() => {
    setIsEditLoading(false);
    setIsVariantLoading(false);
    setIsDeleteLoading(false);
  }, [productsData]);

  return (
    <>
      <div className="flex justify-between items-center mb-4 heading">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Reset to first page whenever search term changes
              onPageChange(0);
            }}
            className="px-4 py-2 border-2 rounded-lg border-green-600"
          />
          <button
            onClick={onButtonClick}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            {buttonText}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full shadow-md rounded my-6 border-collapse">
          <thead className="bg-teal-100">
            <tr>
              {canSelectRows && (
                <th className="p-4 border-b border-white text-teal-600 text-left">
                  Select
                </th>
              )}
              {tableHeaders.map((header, index) => (
                <th
                  key={index}
                  className="p-4 border-b border-white text-teal-600 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length > 0 ? (
              tableRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`h-12 ${
                    rowIndex % 2 === 0 ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  {canSelectRows && (
                    <td className="p-4 border-b">
                      <input
                        type="radio"
                        name="rowSelect"
                        checked={selectedRow === rowIndex}
                        onChange={() => handleRadioChange(rowIndex)}
                      />
                    </td>
                  )}
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-4 border-b">
                      {/* Make the first column (product alias) clickable when we have product data */}
                      {cellIndex === 0 && productsData ? (
                        <span 
                          className="cursor-pointer text-blue-600 hover:underline"
                          onClick={() => handleProductAliasClick(rowIndex)}
                        >
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableHeaders.length + 1}
                  className="text-center p-4"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {canSelectRows && selectedRow !== null && (
        <div className="flex justify-end mt-4">
          <button
            className={`bg-teal-600 text-white px-4 py-2 rounded mr-2 ${
              isEditLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-teal-700"
            }`}
            onClick={() => {
              if (!isEditLoading) {
                setIsEditLoading(true);
                onEditClick && onEditClick(selectedRow);
              }
            }}
            disabled={isEditLoading}
          >
            {isEditLoading ? "Processing..." : "Edit"}
          </button>
          {/* Add Variant button - only shown for products (when productsData exists) */}
          {productsData && (
            <button
              className={`bg-purple-600 text-white px-4 py-2 rounded mr-2 ${
                isVariantLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
              }`}
              onClick={() => {
                if (!isVariantLoading) {
                  setIsVariantLoading(true);
                  onEditClick && onEditClick(selectedRow, 'variant');
                }
              }}
              disabled={isVariantLoading}
            >
              {isVariantLoading ? "Processing..." : "Add Variant"}
            </button>
          )}
          <button
            className={`bg-red-600 text-white px-4 py-2 rounded ${
              isDeleteLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
            }`}
            onClick={() => {
              if (!isDeleteLoading) {
                setShowDeleteModal(true);
              }
            }}
            disabled={isDeleteLoading}
          >
            {isDeleteLoading ? "Processing..." : "Delete"}
          </button>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        contentLabel="Delete Confirmation"
        className="bg-white p-6 rounded-lg shadow-lg w-1/3 mx-auto mt-40"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Items will be deleted permanently, do you wish to continue?
        </h2>
        <div className="flex justify-center space-x-4">
          <button
            className={`bg-red-600 text-white px-6 py-2 rounded ${
              isDeleteLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
            }`}
            onClick={handleDeleteConfirm}
            disabled={isDeleteLoading}
          >
            {isDeleteLoading ? "Processing..." : "OK"}
          </button>
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={() => setShowDeleteModal(false)} // Close modal on cancel
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Pagination Controls */}
      <div className="mt-4">
        <Pagination
          current={currentPage + 1} // Pagination component expects 1-indexed page numbers
          total={pageCount * 10} // Total items for Pagination (pageCount * items per page)
          pageSize={10} // Number of items per page
          onChange={(page) => onPageChange(page - 1)} // Convert 1-indexed back to 0-indexed
          className="pagination"
        />
      </div>

      {/* Product Details Modal */}
      <Modal
        isOpen={showProductDetailsModal}
        onRequestClose={() => setShowProductDetailsModal(false)}
        contentLabel="Product Details"
        className="bg-white rounded shadow-lg w-2/3 mx-auto mt-10 relative max-h-[80vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        {/* Close Button */}
        <button
          onClick={() => setShowProductDetailsModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>

        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-300 z-10">
          <h2 className="text-xl font-bold text-teal-600">
            Product Details
          </h2>
        </div>

        {/* Modal Content */}
        <div className="p-4">
          {isLoadingDetails ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-teal-500 rounded-full border-t-transparent"></div>
            </div>
          ) : productDetails ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="bg-gray-100">
                    <td className="p-3 font-medium border">Product Alias</td>
                    <td className="p-3 border">{productDetails.product_alias || "N/A"}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-medium border">Name</td>
                    <td className="p-3 border">{productDetails.name || "N/A"}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-3 font-medium border">Quantity</td>
                    <td className="p-3 border">{productDetails.quantity || "N/A"}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-medium border">Unit</td>
                    <td className="p-3 border">{productDetails.unit || "N/A"}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-3 font-medium border">Description</td>
                    <td className="p-3 border">{productDetails.description || "N/A"}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-medium border">Technical Name</td>
                    <td className="p-3 border">{productDetails.technical_name || "N/A"}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-3 font-medium border">Cautionary Symbol</td>
                    <td className="p-3 border">{productDetails.cautionary_symbol || "N/A"}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-3 font-medium border">Antidote Statement</td>
                    <td className="p-3 border">{productDetails.antidote_statement || "N/A"}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-3 font-medium border">Registration No.</td>
                    <td className="p-3 border">{productDetails.cir_reg_no || "N/A"}</td>
                  </tr>
                  
                  {/* Display Extra Fields if available */}
                  {productDetails.extra_fields && Object.keys(productDetails.extra_fields).length > 0 && (
                    <>
                      <tr className="bg-teal-100">
                        <td colSpan="2" className="p-3 font-bold border">Extra Fields</td>
                      </tr>
                      {Object.entries(productDetails.extra_fields).map(([key, value], index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                          <td className="p-3 font-medium border">{key}</td>
                          <td className="p-3 border">{value || "N/A"}</td>
                        </tr>
                      ))}
                    </>
                  )}
                  
                  {/* Display product image if available (using base64 data) */}
                  {productDetails.image_file_data && (
                    <tr className="bg-teal-100">
                      <td className="p-3 font-medium border">Product Image</td>
                      <td className="p-3 border">
                        <div className="w-full flex justify-center">
                          <img 
                            src={`data:image/jpeg;base64,${productDetails.image_file_data}`}
                            alt={productDetails.image_file_filename || "Product"} 
                            className="max-h-48 max-w-full object-contain"
                            onClick={() => {
                              // Create blob from base64 and open in new tab
                              const image = new Image();
                              image.src = `data:image/jpeg;base64,${productDetails.image_file_data}`;
                              const w = window.open("");
                              w.document.write(image.outerHTML);
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Display media file links if available */}
                  
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-red-500">
              No product details available.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default TableWithSearchAndPagination;
