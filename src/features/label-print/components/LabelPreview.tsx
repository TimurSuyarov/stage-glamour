import { useTranslation } from "react-i18next";
import type { LabelData } from "../types/label";
import { LABEL_SPECS } from "../types/label";
import { Label40x60 } from "./Label40x60";
import { Label60x80 } from "./Label60x80";
import { useLabelPrint } from "../hooks/useLabelPrint";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const SCALE = 2;

interface LabelPreviewProps {
  data: LabelData;
}

export function LabelPreview({ data }: LabelPreviewProps) {
  const { t } = useTranslation();
  const { print } = useLabelPrint();
  const spec = LABEL_SPECS[data.labelSize];
  const LabelComponent = data.labelSize === "40x60" ? Label40x60 : Label60x80;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scaled screen preview */}
      <div
        className="border border-dashed border-gray-300 rounded-md bg-gray-50 p-4"
        style={{
          width:  `calc(${spec.width}mm  * ${SCALE} + 32px)`,
          height: `calc(${spec.height}mm * ${SCALE} + 32px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width:  `calc(${spec.width}mm  * ${SCALE})`,
            height: `calc(${spec.height}mm * ${SCALE})`,
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `scale(${SCALE})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <div className="shadow-md">
              <LabelComponent data={data} />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={() => print(data)} className="gap-2" size="lg">
        <Printer className="h-4 w-4" />
        {data.copies > 1
          ? t("labelPrint.printCopies", { count: data.copies })
          : t("labelPrint.print")}
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        {spec.width}×{spec.height} mm · {t("labelPrint.specHint")}
      </p>
    </div>
  );
}
