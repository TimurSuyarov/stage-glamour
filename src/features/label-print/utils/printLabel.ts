import type { LabelData } from "../types/label";
import { LABEL_SPECS } from "../types/label";

/**
 * Prints label content using a hidden <iframe> — no separate browser window opens.
 * Supports printing multiple copies by duplicating the label element.
 *
 * @param onDone  Optional callback fired after the print dialog is dismissed.
 *                Use this to reset loading/printing state in the caller.
 *
 * Architecture note: this function is the single print entry-point.
 * It can be replaced later with a local print agent (e.g. raw ESC/POS or ZPL)
 * without touching any component code.
 */
export function printLabel(
  labelElement: HTMLElement,
  data: LabelData,
  onDone?: () => void,
): void {
  const spec = LABEL_SPECS[data.labelSize];
  const copies = Math.max(1, Math.min(data.copies, 100));

  const labelHtml = labelElement.outerHTML;
  const repeatedLabels = Array(copies).fill(labelHtml).join("\n");

  // Create a hidden iframe — no new window, no popup blocker issues
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    onDone?.();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Label Print</title>
<style>
  @page {
    size: ${spec.width}mm ${spec.height}mm;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  html, body {
    width: ${spec.width}mm;
    height: ${spec.height}mm;
    margin: 0;
    padding: 0;
    background: #fff;
    font-family: Arial, sans-serif;
  }

  img {
    display: block;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .label-template {
    page-break-after: always;
    break-after: page;
  }

  .label-template:last-child {
    page-break-after: auto;
    break-after: auto;
  }
</style>
</head>
<body>
${repeatedLabels}
</body>
</html>`);
  doc.close();

  /*
   * 600ms — data-URL <img> elements (barcode PNG) need a moment to decode
   * inside the iframe before the print pipeline reads the layout.
   *
   * iframe.contentWindow.print() is SYNCHRONOUS in Chrome/Brave: it blocks
   * until the user clicks "Print" or "Cancel". So cleanup runs right after.
   */
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print(); // blocks until dialog dismissed
    } finally {
      document.body.removeChild(iframe); // always clean up
      onDone?.();
    }
  }, 600);
}
