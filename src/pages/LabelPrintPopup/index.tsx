import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { LabelSize } from "@/features/label-print/types/label";
import { LABEL_SPECS } from "@/features/label-print/types/label";
import { Label40x60 } from "@/features/label-print/components/Label40x60";
import { Label60x80 } from "@/features/label-print/components/Label60x80";

/**
 * Portrait popup — opened by useLabelPrint().
 *
 * @page portrait:  40mm × 60mm  (for "40x60")
 *                  60mm × 80mm  (for "60x80")
 *
 * Label components are landscape — CSS scale fits them into portrait width.
 *   scale = portraitW / labelW  →  40/58 ≈ 0.69  (40x60)
 *                                   60/80 = 0.75  (60x80)
 *
 * Route: /p/label  — outside AppShell, no auth
 */
export default function LabelPrintPopup() {
  const [params] = useSearchParams();

  const size     = (params.get("size")     ?? "40x60") as LabelSize;
  const title    = params.get("title")    ?? "";
  const mainCode = params.get("mainCode") ?? "";
  const location = params.get("location") ?? "";
  const qrValue  = params.get("qrValue")  ?? "";
  const copies   = Math.max(1, Math.min(100, Number(params.get("copies")) || 1));

  const spec = LABEL_SPECS[size];

  // Portrait page: landscape height → portrait width, landscape width → portrait height
  const pageW = spec.height;   // 50mm or 60mm  (portrait width = landscape height)
  const pageH = spec.width;   // 58mm or 80mm  (portrait height = landscape width)

  // Scale landscape label to fill portrait width
  const scale = pageW / spec.width;           // 40/58 ≈ 0.69 | 60/80 = 0.75

  const labelData = { labelSize: size, title, mainCode, location, qrValue, copies: 1 };
  const LabelComponent = size === "40x60" ? Label40x60 : Label60x80;

  useEffect(() => {
    const t = setTimeout(() => {
      window.print();
      window.close();
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @page {
          size: ${pageW}mm ${pageH}mm;
          margin: 0;
        }

        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #fff;
          width: ${pageW}mm;
          -webkit-text-size-adjust: 100%;
        }

        .page-wrap {
          width: ${pageW}mm;
          height: ${pageH}mm;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
        }

        .page-wrap:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .label-template {
          transform-origin: top left !important;
          transform: scale(${scale.toFixed(6)}) !important;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${pageW}mm !important;
          }

          .page-wrap {
            width: ${pageW}mm !important;
            height: ${pageH}mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }

          .label-template {
            transform-origin: top left !important;
            transform: scale(${scale.toFixed(6)}) !important;
          }
        }
      `}</style>

      <div id="print-root">
        {Array.from({ length: copies }).map((_, i) => (
          <div key={i} className="page-wrap">
            <LabelComponent data={labelData} />
          </div>
        ))}
      </div>
    </>
  );
}
