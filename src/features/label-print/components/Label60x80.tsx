import { LABEL_SPECS, type LabelData } from "../types/label";
import { LabelBarcode } from "./LabelBarcode";
import { LabelCopyBadge } from "./LabelCopyBadge";

interface Label60x80Props {
  data: LabelData;
  /** 1-based copy index (1, 2, 3, …) — renders a corner badge when copyTotal > 1 */
  copyNumber?: number;
  /** Total copies in the print run */
  copyTotal?: number;
}

/**
 * 60×80 mm thermal label template (80×60 mm printable area).
 *
 * Layout:
 *   top:          title centered (1–2 lines)
 *   center:       large bold main code (dominant element)
 *   bottom-left:  location / city text
 *   bottom-right: barcode
 */
export function Label60x80({ data, copyNumber, copyTotal }: Label60x80Props) {
  const spec = LABEL_SPECS["60x80"];

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
      <LabelCopyBadge copyNumber={copyNumber} copyTotal={copyTotal} fontMm={5} />

      {/* Title */}
      <div
        style={{
          fontSize: "3.5mm",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.25,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          textOverflow: "ellipsis",
          maxHeight: "10mm",
        }}
      >
        {data.title || "\u00A0"}
      </div>

      {/* Main code — dominant element */}
      <div
        style={{
          fontSize: data.mainCode.length > 8 ? "9mm" : "12mm",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "0 2mm",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          gap: "3mm",
        }}
      >
        {/* Location text */}
        <div
          style={{
            fontSize: "3mm",
            fontWeight: 500,
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
        <LabelBarcode value={data.qrValue} widthMm={22} heightMm={22} />
      </div>
    </div>
  );
}
