import { LABEL_SPECS, type LabelData } from "../types/label";
import { LabelBarcode } from "./LabelBarcode";

interface Label40x60Props {
  data: LabelData;
}

/**
 * 40×60 mm thermal label template (58×40 mm printable area on standard rolls).
 *
 * Layout:
 *   top:    title / company name (1–2 lines)
 *   center: main code / identifier (dominant element)
 *   bottom: location text (left) + barcode (right)
 */
export function Label40x60({ data }: Label40x60Props) {
  const spec = LABEL_SPECS["40x60"];

  return (
    <div
      className="label-template"
      style={{
        width: `${spec.width}mm`,
        height: `${spec.height}mm`,
        padding: `${spec.padding.top}mm ${spec.padding.right}mm ${spec.padding.bottom}mm ${spec.padding.left}mm`,
        boxSizing: "border-box",
        fontFamily: "'Inter', 'Arial', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        backgroundColor: "#fff",
        color: "#000",
        position: "relative",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "5.5mm",
          fontWeight: 700,
          lineHeight: 1.2,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          textOverflow: "ellipsis",
          maxHeight: "7.5mm",
        }}
      >
        {data.title || "\u00A0"}
      </div>

      {/* Main code */}
      <div
        style={{
          fontSize: data.mainCode.length > 10 ? "5mm" : "6.5mm",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "0 1mm",
        }}
      >
        {data.mainCode || "\u00A0"}
      </div>

      {/* Bottom row: location (left) + barcode (right) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "2mm",
        }}
      >
        {/* Location text */}
        <div
          style={{
            fontSize: "5mm",
            fontWeight: 600,
            color: "#333",
            lineHeight: 1.2,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            flex: 1,
          }}
        >
          {data.location || "\u00A0"}
        </div>

        {/* Barcode */}
        <LabelBarcode value={data.qrValue} widthMm={16} heightMm={16} />
      </div>
    </div>
  );
}
