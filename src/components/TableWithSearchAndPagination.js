import React, { useState } from "react";
import Pagination from "rc-pagination";
import Modal from "react-modal";
import "rc-pagination/assets/index.css";

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

  // Handle radio button selection
  const handleRadioChange = (index) => {
    setSelectedRow(index);
    console.log(index);
  };

  // Check if the user is admin, master, or plant_owner
  const canSelectRows = ["admin", "master", "plant_owner"].includes(userRole);

  const handleDeleteConfirm = () => {
    if (selectedRow !== null) {
      // Pass the selected row index to the parent component
      onDeleteRequest && onDeleteRequest(selectedRow);
      setShowDeleteModal(false); // Close modal after confirming deletion
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 heading">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                      {cell}
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

      {/* Edit Button */}
      {canSelectRows && selectedRow !== null && (
        <div className="flex justify-end mt-4">
          <button
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 mr-2"
            onClick={() => onEditClick && onEditClick(selectedRow)}
          >
            Edit
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
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
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            onClick={handleDeleteConfirm}
          >
            OK
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
    </>
  );
};

export default TableWithSearchAndPagination;
