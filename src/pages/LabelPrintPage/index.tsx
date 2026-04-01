import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LabelForm } from "@/features/label-print/components/LabelForm";
import { LabelPreview } from "@/features/label-print/components/LabelPreview";
import { DEFAULT_LABEL_DATA } from "@/features/label-print/types/label";
import type { LabelData } from "@/features/label-print/types/label";

export default function LabelPrintPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<LabelData>({ ...DEFAULT_LABEL_DATA });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t("labelPrint.title")}
        description={t("labelPrint.description")}
        breadcrumbs={[{ label: t("labelPrint.title") }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("labelPrint.formCard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LabelForm data={data} onChange={setData} />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("labelPrint.previewCard")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LabelPreview data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
