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
  filters, // Optional: array of filter objects
  onFiltersChange, // Optional: callback when filters change
  onRowClick, // Optional: callback when a row is clicked, receives (rowIndex, cellIndex)
  clickableColumns, // Optional: array of column indices that should be clickable (e.g., [0] for first column)
  customActionButtons, // Optional: customize action button labels and colors { editLabel, editColor, deleteLabel, deleteColor }
  onAssociateClick, // Optional: callback when associate button is clicked
  showAssociateButton, // Optional: boolean to control visibility of Associate button
  onRowSelect, // Optional: callback when a row is selected via radio button
  selectedRowIndex, // Optional: controlled selected row index from parent (null to deselect)
}) => {
  // Extract custom button settings or use defaults
  const editButtonLabel = customActionButtons?.editLabel || "Edit";
  const deleteButtonLabel = customActionButtons?.deleteLabel || "Delete";
  const editButtonColor = customActionButtons?.editColor || "teal"; // teal, green, blue, purple, etc.
  const deleteButtonColor = customActionButtons?.deleteColor || "red"; // red, orange, yellow, etc.
  // State to handle selected row
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  
  // Sync internal state with parent's controlled selectedRowIndex
  useEffect(() => {
    if (selectedRowIndex !== undefined) {
      setSelectedRow(selectedRowIndex);
    }
  }, [selectedRowIndex]);
  
  // Log the user role for debugging
  console.log("TableWithSearchAndPagination received userRole:", userRole);

  // Handle radio button selection
  const handleRadioChange = (index) => {
    setSelectedRow(index);
    console.log(index);
    // Call the parent callback if provided
    if (onRowSelect) {
      onRowSelect(index);
    }
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
  // Also reset when tableRows change (e.g., when modal closes and data might update)
  useEffect(() => {
    setIsEditLoading(false);
    setIsVariantLoading(false);
    setIsDeleteLoading(false);
  }, [productsData, tableRows]);

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
            {/* Optional Filter Row - Renders inline with columns */}
            {filters && filters.length > 0 && (
              <tr className="bg-teal-50">
                {canSelectRows && (
                  <th className="p-2 border-b border-white"></th>
                )}
                {tableHeaders.map((header, headerIndex) => {
                  // Find all filters matching this column by columnIndex
                  const columnFilters = filters.filter(
                    f => f.columnIndex === headerIndex
                  );
                  
                  return (
                    <th key={headerIndex} className="p-2 border-b border-white">
                      {columnFilters.length > 0 ? (
                        <div className="w-full space-y-1">
                          {columnFilters.map((filter, filterIdx) => (
                            <div key={filterIdx}>
                              {filter.type === "select" ? (
                                <select
                                  value={filter.value}
                                  onChange={(e) => onFiltersChange && onFiltersChange(filter.name, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-700"
                                >
                                  <option value="">{filter.placeholder || "All"}</option>
                                  {filter.options?.map((option, optIndex) => (
                                    <option key={optIndex} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : filter.type === "date" ? (
                                <input
                                  type="date"
                                  value={filter.value}
                                  onChange={(e) => onFiltersChange && onFiltersChange(filter.name, e.target.value)}
                                  placeholder={filter.placeholder}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-700"
                                  title={filter.placeholder} // Show placeholder as tooltip
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={filter.value}
                                  onChange={(e) => onFiltersChange && onFiltersChange(filter.name, e.target.value)}
                                  placeholder={filter.placeholder}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-gray-700"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            )}
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
                      ) : clickableColumns && clickableColumns.includes(cellIndex) ? (
                        <span 
                          className="cursor-pointer text-blue-600 hover:underline"
                          onClick={() => onRowClick && onRowClick(rowIndex, cellIndex)}
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
      {canSelectRows && selectedRow !== null && (onEditClick || onDeleteRequest || onAssociateClick) && (
        <div className="flex justify-end mt-4">
          {onEditClick && (
            <button
            className={`bg-${editButtonColor}-600 text-white px-4 py-2 rounded mr-2 ${
              isEditLoading ? "opacity-50 cursor-not-allowed" : `hover:bg-${editButtonColor}-700`
            }`}
            style={{
              backgroundColor: isEditLoading ? undefined : 
                editButtonColor === 'green' ? '#16a34a' :
                editButtonColor === 'orange' ? '#ea580c' :
                editButtonColor === 'blue' ? '#2563eb' :
                editButtonColor === 'purple' ? '#9333ea' :
                '#0d9488', // teal default
            }}
            onMouseEnter={(e) => {
              if (!isEditLoading) {
                e.currentTarget.style.backgroundColor = 
                  editButtonColor === 'green' ? '#15803d' :
                  editButtonColor === 'orange' ? '#c2410c' :
                  editButtonColor === 'blue' ? '#1d4ed8' :
                  editButtonColor === 'purple' ? '#7e22ce' :
                  '#0f766e'; // teal-700
              }
            }}
            onMouseLeave={(e) => {
              if (!isEditLoading) {
                e.currentTarget.style.backgroundColor = 
                  editButtonColor === 'green' ? '#16a34a' :
                  editButtonColor === 'orange' ? '#ea580c' :
                  editButtonColor === 'blue' ? '#2563eb' :
                  editButtonColor === 'purple' ? '#9333ea' :
                  '#0d9488';
              }
            }}
            onClick={() => {
              if (!isEditLoading) {
                setIsEditLoading(true);
                onEditClick && onEditClick(selectedRow);
              }
            }}
            disabled={isEditLoading}
          >
            {isEditLoading ? "Processing..." : editButtonLabel}
          </button>
          )}
          {/* Add Variant button - only shown for products (when productsData exists) */}
          {productsData && onEditClick && (
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
          {onAssociateClick && showAssociateButton && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mr-2 hover:bg-blue-700"
              onClick={() => onAssociateClick(selectedRow)}
            >
              Associate Seller
            </button>
          )}
          {onDeleteRequest && (
            <button
            className={`text-white px-4 py-2 rounded ${
              isDeleteLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              backgroundColor: isDeleteLoading ? undefined :
                deleteButtonColor === 'orange' ? '#ea580c' :
                deleteButtonColor === 'yellow' ? '#ca8a04' :
                deleteButtonColor === 'red' ? '#dc2626' :
                '#dc2626', // red default
            }}
            onMouseEnter={(e) => {
              if (!isDeleteLoading) {
                e.currentTarget.style.backgroundColor = 
                  deleteButtonColor === 'orange' ? '#c2410c' :
                  deleteButtonColor === 'yellow' ? '#a16207' :
                  deleteButtonColor === 'red' ? '#b91c1c' :
                  '#b91c1c';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleteLoading) {
                e.currentTarget.style.backgroundColor = 
                  deleteButtonColor === 'orange' ? '#ea580c' :
                  deleteButtonColor === 'yellow' ? '#ca8a04' :
                  deleteButtonColor === 'red' ? '#dc2626' :
                  '#dc2626';
              }
            }}
            onClick={() => {
              if (!isDeleteLoading) {
                setShowDeleteModal(true);
              }
            }}
            disabled={isDeleteLoading}
          >
            {isDeleteLoading ? "Processing..." : deleteButtonLabel}
          </button>
          )}
        </div>
      )}

      {/* DELETE/REJECT CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        contentLabel={`${deleteButtonLabel} Confirmation`}
        className="bg-white p-6 rounded-lg shadow-lg w-1/3 mx-auto mt-40"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          {deleteButtonLabel === "Reject" 
            ? "Are you sure you want to reject this indent?" 
            : "Items will be deleted permanently, do you wish to continue?"}
        </h2>
        <div className="flex justify-center space-x-4">
          <button
            className={`text-white px-6 py-2 rounded ${
              isDeleteLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              backgroundColor: isDeleteLoading ? undefined :
                deleteButtonColor === 'orange' ? '#ea580c' :
                deleteButtonColor === 'yellow' ? '#ca8a04' :
                deleteButtonColor === 'red' ? '#dc2626' :
                '#dc2626',
            }}
            onMouseEnter={(e) => {
              if (!isDeleteLoading) {
                e.currentTarget.style.backgroundColor = 
                  deleteButtonColor === 'orange' ? '#c2410c' :
                  deleteButtonColor === 'yellow' ? '#a16207' :
                  deleteButtonColor === 'red' ? '#b91c1c' :
                  '#b91c1c';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleteLoading) {
                e.currentTarget.style.backgroundColor = 
                  deleteButtonColor === 'orange' ? '#ea580c' :
                  deleteButtonColor === 'yellow' ? '#ca8a04' :
                  deleteButtonColor === 'red' ? '#dc2626' :
                  '#dc2626';
              }
            }}
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
