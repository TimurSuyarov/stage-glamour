import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PicklistsPage from "@/pages/PicklistsPage";

const STATUS_PICKED = "2";
const STATUS_VALIDATED = "3";

export default function HistoryPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t("nav.history")}
        breadcrumbs={[
          { label: t("nav.operational") },
          { label: t("nav.history") },
        ]}
      />

      <Tabs defaultValue={STATUS_PICKED}>
        <TabsList>
          <TabsTrigger value={STATUS_PICKED}>
            {t("history.tabPicked")}
          </TabsTrigger>
          <TabsTrigger value={STATUS_VALIDATED}>
            {t("history.tabValidated")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={STATUS_PICKED}>
          <PicklistsPage
            statuses={[3]}
            titleKey="nav.history"
            parentKey="nav.operational"
            mode="collect"
            hideHeader
          />
        </TabsContent>

        <TabsContent value={STATUS_VALIDATED}>
          <PicklistsPage
            statuses={[4]}
            titleKey="nav.history"
            parentKey="nav.operational"
            mode="collect"
            hideHeader
            printMode
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
