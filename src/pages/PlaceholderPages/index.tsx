import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ModuleCard } from '@/components/ui/stat-card';
import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';
import SalesOrdersPage from '@/pages/SalesOrdersPage';
import { ESalesOrderStatus } from '@/enums/salesOrder';
import CellsPageComponent from '@/pages/CellsPage';
import { useCollectNotification } from '@/contexts/CollectNotificationContext';

interface PlaceholderPageProps {
  titleKey: string;
  parentKey: string;
}

export function PlaceholderPage({ titleKey, parentKey }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t(titleKey)}
        breadcrumbs={[{ label: t(parentKey) }, { label: t(titleKey) }]}
      />

      <ModuleCard>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{t('placeholder.comingSoon')}</h3>
          <p className="text-muted-foreground max-w-md">
            {t('placeholder.underDevelopment')}
          </p>
        </div>
      </ModuleCard>
    </div>
  );
}

export function CollectPage() {
  const { clearCollectNotification } = useCollectNotification();
  useEffect(() => {
    clearCollectNotification();
  }, [clearCollectNotification]);

  return (
    <SalesOrdersPage
      status={ESalesOrderStatus.Processing}
      titleKey="nav.collect"
      parentKey="nav.operational"
    />
  );
}

export function MoveToRegionPage() {
  return (
    <SalesOrdersPage
      status={ESalesOrderStatus.Picked}
      titleKey="nav.moveToRegion"
      parentKey="nav.operational"
    />
  );
}

export function RelocationPage() {
  return (
    <SalesOrdersPage
      status={ESalesOrderStatus.Pending}
      titleKey="nav.relocation"
      parentKey="nav.operational"
    />
  );
}

export function WarehousePage() {
  return <PlaceholderPage titleKey="nav.warehouse" parentKey="nav.masterData" />;
}

export function CellsPage() {
  return <CellsPageComponent />;
}

export function InventoryPage() {
  return <PlaceholderPage titleKey="nav.inventory" parentKey="nav.masterData" />;
}

export function ReportsPage() {
  return <PlaceholderPage titleKey="nav.reports" parentKey="nav.masterData" />;
}

export function BonusesPage() {
  return <PlaceholderPage titleKey="nav.bonuses" parentKey="nav.masterData" />;
}
