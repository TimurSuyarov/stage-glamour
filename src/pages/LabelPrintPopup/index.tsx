import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { LabelSize } from "@/features/label-print/types/label";
import { LABEL_SPECS } from "@/features/label-print/types/label";
import { Label40x60 } from "@/features/label-print/components/Label40x60";
import { Label60x80 } from "@/features/label-print/components/Label60x80";

/**
 * Print popup — opened by useLabelPrint().
 *
 * Physical paper (portrait):  40×60 mm  |  60×80 mm
 *
 * The label template is landscape (wider than tall).
 * It is placed with position:absolute so its original layout dimensions
 * never affect page-flow height — preventing the phantom blank second page
 * that occurs when a scaled element's original bounding box overflows.
 *
 * Route: /p/label — outside AppShell, no auth
 */

// Landscape orientation: width > height (matches the label template orientation)
const PAPER: Record<LabelSize, { w: number; h: number }> = {
  "40x60": { w: 60, h: 40 },
  "60x80": { w: 80, h: 60 },
};

export default function LabelPrintPopup() {
  const [params] = useSearchParams();

  const size     = (params.get("size")     ?? "40x60") as LabelSize;
  const title    = params.get("title")    ?? "";
  const mainCode = params.get("mainCode") ?? "";
  const location = params.get("location") ?? "";
  const qrValue  = params.get("qrValue")  ?? "";
  const copies   = Math.max(1, Math.min(100, Number(params.get("copies")) || 1));

  const spec  = LABEL_SPECS[size];
  const paper = PAPER[size];

  // Scale label to fill the paper height exactly, then centre horizontally
  const scale   = paper.h / spec.height;                     // 40/38 ≈ 1.053
  const scaledW = spec.width * scale;
  const offsetX = Math.max(0, (paper.w - scaledW) / 2);     // centre gap

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
          size: ${paper.w}mm ${paper.h}mm;
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
          -webkit-text-size-adjust: 100%;
        }

        /* Each copy = one physical label */
        .page-wrap {
          position: relative;
          width: ${paper.w}mm;
          height: ${paper.h}mm;
          overflow: hidden;
          break-after: page;
        }

        .page-wrap:last-child {
          break-after: auto !important;
        }

        /* Label sits inside page-wrap via absolute positioning —
           its original layout box does NOT affect flow height. */
        .label-anchor {
          position: absolute;
          top: 0;
          left: ${offsetX.toFixed(4)}mm;
          transform-origin: top left;
          transform: scale(${scale.toFixed(6)});
        }

        @media print {
          .page-wrap {
            width: ${paper.w}mm !important;
            height: ${paper.h}mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }

          .page-wrap:last-child {
            break-after: auto !important;
          }
        }
      `}</style>

      <div id="print-root">
        {Array.from({ length: copies }).map((_, i) => (
          <div key={i} className="page-wrap">
            <div className="label-anchor">
              <LabelComponent data={labelData} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
