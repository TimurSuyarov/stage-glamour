import { useEffect, useState } from "react";
import JsBarcode from "jsbarcode";

interface LabelBarcodeProps {
  value: string;
  /** Displayed width in millimeters */
  widthMm: number;
  /** Displayed height in millimeters */
  heightMm: number;
}

/**
 * Renders a CODE128 barcode as a self-contained PNG <img> element.
 *
 * Strategy: JsBarcode renders into an off-screen <canvas> (never in the DOM),
 * then we call toDataURL("image/png") to get a base64 string.
 * The resulting <img> is fully self-contained — it survives outerHTML
 * serialisation and iframe injection without any rendering issues.
 *
 * The canvas pixel dimensions are set at ~304 DPI (12 px/mm) so the PNG
 * is sharp enough for thermal label output. CSS width/height then scales
 * it to the exact mm size in both screen preview and print layout.
 */
export function LabelBarcode({ value, widthMm, heightMm }: LabelBarcodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setDataUrl("");
      return;
    }

    try {
      // Render at 12px/mm (~304 DPI) for crisp thermal output
      const heightPx = Math.round(heightMm * 12);

      const canvas = document.createElement("canvas");

      JsBarcode(canvas, value, {
        format: "CODE128",
        height: heightPx,
        // bar width: 2px gives good density at 304 DPI
        width: 2,
        margin: 0,
        displayValue: false, // no human-readable text below bar — keep layout clean
        background: "#ffffff",
        lineColor: "#000000",
      });

      setDataUrl(canvas.toDataURL("image/png"));
    } catch {
      // Invalid barcode value — show placeholder
      setDataUrl("");
    }
  }, [value, widthMm, heightMm]);

  if (!value || !dataUrl) {
    return (
      <div
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          border: "1px dashed #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "5px",
          color: "#aaa",
          flexShrink: 0,
        }}
      >
        BAR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt=""
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        display: "block",
        flexShrink: 0,
        objectFit: "fill",
      }}
    />
  );
}
