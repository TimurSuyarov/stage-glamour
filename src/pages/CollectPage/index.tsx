import { useEffect } from "react";
import { useCollectNotification } from "@/contexts/CollectNotificationContext";
import PicklistsPage from "@/pages/PicklistsPage";
import { EPickListStatus } from "@/enums/picklist";

export default function CollectPage() {
  const { clearCollectNotification } = useCollectNotification();
  useEffect(() => {
    clearCollectNotification();
  }, [clearCollectNotification]);

  return (
    <PicklistsPage
      status={EPickListStatus.Draft}
      titleKey="nav.collect"
      parentKey="nav.operational"
    />
  );
}
