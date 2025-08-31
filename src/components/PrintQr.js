import React, { useEffect } from "react";
import "./print-qr.css";
import InnerQr from "./InnerQr";

const PrintQr = (props) => {
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm

  const data = {
    numRows: 11, // Number of rows for the A4 page
    numColumns: 6, // Number of columns for the A4 page
    arraySlice: 66, // Number of cells per page (11 rows * 6 columns)
    parentPadding: 2, // Padding inside each parent cell in mm
  };

  const parentCellWidth = pageWidth / data.numColumns; // Width of each parent cell
  const parentCellHeight = pageHeight / data.numRows; // Height of each parent cell
  const childCellWidth = (parentCellWidth - 2 * data.parentPadding) / 4; // Width of each child cell
  const childCellHeight = (parentCellHeight - 2 * data.parentPadding) / 3; // Height of each child cell

  const gridStyles = {
    width: `${pageWidth}mm`,
    height: `${pageHeight}mm`,
    display: "grid",
    gridTemplateColumns: `repeat(${data.numColumns}, ${parentCellWidth}mm)`,
    gridTemplateRows: `repeat(${data.numRows}, ${parentCellHeight}mm)`,
    border: "1px solid black",
    boxSizing: "border-box",
  };

  const arrayOfArrays = Array.from(
    { length: Math.ceil(props.qrList.length / data.arraySlice) },
    (_, index) =>
      props.qrList.slice(index * data.arraySlice, (index + 1) * data.arraySlice)
  );

  useEffect(() => {
    const handleAfterPrint = () => {
      props.sendDataToParent(true);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  useEffect(() => {
    if (props.qrList && props.qrList.length > 0) {
      window.print();
    }
    console.log(props.qrList);
  }, [props.qrList]);

  return (
    <div>
      {arrayOfArrays.map((row, rowIndex) => (
        <div className="container-qr" style={gridStyles} key={rowIndex}>
          {row.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className="parent-cell"
              style={{
                padding: `${data.parentPadding}mm`,
                boxSizing: "border-box",
                display: "grid",
                gridTemplateColumns: `repeat(4, 1fr)`,
                gridTemplateRows: `repeat(3, 1fr)`,
                height: `${parentCellHeight}mm`,
                width: `${parentCellWidth}mm`,
                border: "1px solid red", // Add parent cell border
              }}
            >
              {/* Pass child dimensions and item to InnerQr */}
              <InnerQr
                cellHeight={childCellHeight}
                cellWidth={childCellWidth}
                rowIndex={rowIndex}
                columnIndex={itemIndex}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PrintQr;
