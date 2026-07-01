import { LABEL_SPECS, type LabelData } from "../types/label";
import { LabelBarcode } from "./LabelBarcode";
import { LabelCopyBadge } from "./LabelCopyBadge";

interface Label40x60Props {
  data: LabelData;
  /** 1-based copy index (1, 2, 3, …) — renders a corner badge when copyTotal > 1 */
  copyNumber?: number;
  /** Total copies in the print run */
  copyTotal?: number;
}

/**
 * 40×60 mm thermal label template (58×40 mm printable area on standard rolls).
 *
 * Layout:
 *   top:    title / company name (1–2 lines)
 *   center: main code / identifier (dominant element)
 *   bottom: location text (left) + barcode (right)
 */
export function Label40x60({ data, copyNumber, copyTotal }: Label40x60Props) {
  const spec = LABEL_SPECS["40x60"];
  const numbered = !!copyTotal && copyTotal > 1;

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
      {/* Copy number badge (top-right) — only when printing multiple copies */}
      <LabelCopyBadge copyNumber={copyNumber} copyTotal={copyTotal} fontMm={3.5} />

      {/* Title */}
      <div
        style={{
          fontSize: "5mm",
          fontWeight: 700,
          lineHeight: 1.6,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          textOverflow: "ellipsis",
          maxHeight: "7.5mm",
          paddingRight: numbered ? "6mm" : undefined,
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
