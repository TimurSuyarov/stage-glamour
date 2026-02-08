import { PageHeader } from '@/components/ui/page-header';
import { ModuleCard } from '@/components/ui/stat-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  titleKey: string;
  parentKey: string;
}

export function PlaceholderPage({ titleKey, parentKey }: PlaceholderPageProps) {
  const { t } = useLanguage();

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
          <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md">
            This module is under development. The full functionality will be available in the next release.
          </p>
        </div>
      </ModuleCard>
    </div>
  );
}

// Export individual placeholder pages
export function AdmissionPage() {
  return <PlaceholderPage titleKey="nav.admission" parentKey="nav.operational" />;
}

export function CollectPage() {
  return <PlaceholderPage titleKey="nav.collect" parentKey="nav.operational" />;
}

export function MoveToRegionPage() {
  return <PlaceholderPage titleKey="nav.moveToRegion" parentKey="nav.operational" />;
}

export function RelocationPage() {
  return <PlaceholderPage titleKey="nav.relocation" parentKey="nav.operational" />;
}

export function WarehousePage() {
  return <PlaceholderPage titleKey="nav.warehouse" parentKey="nav.masterData" />;
}

export function CellsPage() {
  return <PlaceholderPage titleKey="nav.cells" parentKey="nav.masterData" />;
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
