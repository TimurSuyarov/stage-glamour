import SalesOrdersPage from '@/pages/SalesOrdersPage';
import { ESalesOrderStatus } from '@/enums/salesOrder';

export default function ValidationPage() {
  return (
    <SalesOrdersPage
      status={ESalesOrderStatus.Picking}
      titleKey="nav.validation"
      parentKey="nav.operational"
    />
  );
}
