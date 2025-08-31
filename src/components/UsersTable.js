import React from "react";

const UserTable = ({
  tableHeaders,
  tableRows,
  searchTerm,
  setSearchTerm,
  buttonText,
  onButtonClick,
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={onButtonClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {buttonText}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              {tableHeaders.map((header, index) => (
                <th key={index} className="px-4 py-2 border-b">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length > 0 ? (
              tableRows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, i) => (
                    <td key={i} className="px-4 py-2 border-b">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="text-center py-4">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserTable;
