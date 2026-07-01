interface LabelCopyBadgeProps {
  /** 1-based position of this copy (1, 2, 3, …) */
  copyNumber?: number;
  /** Total number of copies in this print run */
  copyTotal?: number;
  /** Font size in millimeters — templates size this per label format */
  fontMm: number;
}

/**
 * Small sequential-number badge shown in the top-right corner of a label
 * when more than one copy is printed (1, 2, 3, …).
 *
 * Lets the user tell multiple otherwise-identical labels apart once they
 * come off the printer. Renders nothing for single-copy prints.
 *
 * Positioned absolutely — the parent `.label-template` is `position: relative`,
 * so the badge scales together with the label in the print popup.
 */
export function LabelCopyBadge({ copyNumber, copyTotal, fontMm }: LabelCopyBadgeProps) {
  if (!copyNumber || !copyTotal || copyTotal <= 1) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: `${(fontMm * 0.3).toFixed(2)}mm`,
        right: `${(fontMm * 0.4).toFixed(2)}mm`,
        minWidth: `${(fontMm * 1.5).toFixed(2)}mm`,
        height: `${(fontMm * 1.5).toFixed(2)}mm`,
        padding: `0 ${(fontMm * 0.25).toFixed(2)}mm`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${fontMm}mm`,
        fontWeight: 700,
        lineHeight: 1,
        color: "#000",
        background: "#fff",
        border: `${Math.max(0.3, fontMm * 0.12).toFixed(2)}mm solid #000`,
        borderRadius: `${(fontMm * 0.3).toFixed(2)}mm`,
        boxSizing: "border-box",
        zIndex: 2,
      }}
    >
      {copyNumber}
    </div>
  );
}
