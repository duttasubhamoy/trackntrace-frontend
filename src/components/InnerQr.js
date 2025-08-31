import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const InnerQr = (props) => {
  const { cellHeight, cellWidth, rowIndex, columnIndex, item } = props;

  // Generate unique color for borders based on row and column index
  const borderColor = `hsl(${
    (rowIndex * 10 + columnIndex * 20) % 360
  }, 70%, 50%)`;

  return (
    <div
      className="child-cell"
      style={{
        width: `${cellWidth}mm`,
        height: `${cellHeight}mm`,
        border: `1px solid ${borderColor}`, // Unique border color
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {/* Adjust QRCodeCanvas size to fit the cell */}
      <QRCodeCanvas
        value={item}
        size={Math.min(cellWidth * 3.78, cellHeight * 3.78)} // Convert mm to px
        level="H" // Error correction level (L, M, Q, H)
        scale={10} // Increases resolution while keeping physical size
      />
    </div>
  );
};

export default InnerQr;
