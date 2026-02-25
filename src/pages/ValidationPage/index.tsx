import PicklistsPage from "@/pages/PicklistsPage";
import { EPickListStatus } from "@/enums/picklist";

export default function ValidationPage() {
  return (
    <PicklistsPage
      status={EPickListStatus.Picked}
      titleKey="nav.validation"
      parentKey="nav.operational"
    />
  );
}
