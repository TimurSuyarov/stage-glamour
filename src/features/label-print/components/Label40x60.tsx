import { LABEL_SPECS, type LabelData } from "../types/label";
import { LabelQRCode } from "./LabelQRCode";

interface Label40x60Props {
  data: LabelData;
}

/**
 * 40×60 mm thermal label template (58×40 mm printable area on standard rolls).
 *
 * Layout based on physical samples:
 *   top:    title / company name (1–2 lines)
 *   center: main code / identifier
 *   bottom: location text (left) + QR code (right)
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
          fontSize: "2.8mm",
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

    </div>
  );
}
