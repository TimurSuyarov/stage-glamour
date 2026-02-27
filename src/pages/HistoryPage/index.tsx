import PicklistsPage from "@/pages/PicklistsPage";
import { EPickListStatus } from "@/enums/picklist";

export default function HistoryPage() {
  return (
    <PicklistsPage
      status={3}
      titleKey="nav.history"
      parentKey="nav.operational"
      mode="collect"
    />
  );
}
