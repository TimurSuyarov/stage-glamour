import { PageHeader } from '@/components/ui/page-header';
import { StatCard, ModuleCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders, mockValidationTasks, dashboardStats } from '@/data/mockData';
import { 
  ShoppingCart, 
  PackageSearch, 
  ClipboardCheck, 
  Truck,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const recentOrders = mockOrders.slice(0, 5);
  const pendingValidations = mockValidationTasks.filter(v => v.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title={t('nav.dashboard')}
        description={`${t('role.' + user?.role)} · ${new Date().toLocaleDateString()}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('order.totalOrders')}
          value={dashboardStats.totalOrders}
          icon={ShoppingCart}
          iconColor="bg-primary/10 text-primary"
          change={{ value: dashboardStats.ordersChange, label: 'vs yesterday' }}
        />
        <StatCard
          title={t('order.pendingCollection')}
          value={dashboardStats.pendingCollection}
          icon={PackageSearch}
          iconColor="bg-status-warning-bg text-status-warning"
          change={{ value: dashboardStats.collectionChange, label: 'vs yesterday' }}
        />
        <StatCard
          title={t('order.inValidation')}
          value={dashboardStats.inValidation}
          icon={ClipboardCheck}
          iconColor="bg-status-info-bg text-status-info"
          change={{ value: dashboardStats.validationChange, label: 'vs yesterday' }}
        />
        <StatCard
          title={t('order.shippedToday')}
          value={dashboardStats.shippedToday}
          icon={Truck}
          iconColor="bg-status-success-bg text-status-success"
          change={{ value: dashboardStats.shippedChange, label: 'vs yesterday' }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <ModuleCard
          title={t('order.title')}
          description="Latest orders from SAP"
          className="lg:col-span-2"
          actions={
            <Link to="/orders">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          }
        >
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.sapOrderId}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.items.length} items</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>

        {/* Validation Queue */}
        <ModuleCard
          title={t('validation.title')}
          description="Pending validations"
          actions={
            <Link to="/validation">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          }
        >
          {pendingValidations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-status-success" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending validations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingValidations.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-status-warning/30 bg-status-warning-bg/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">{task.order.sapOrderId}</span>
                    <AlertTriangle className="w-4 h-4 text-status-warning" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{task.order.customerName}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-status-error font-medium">
                      {task.discrepancies.length} {t('validation.discrepancy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModuleCard>
      </div>

      {/* Quick Actions */}
      <ModuleCard title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/orders">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-xs">{t('nav.order')}</span>
            </Button>
          </Link>
          <Link to="/collect">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <PackageSearch className="w-5 h-5" />
              <span className="text-xs">{t('nav.collect')}</span>
            </Button>
          </Link>
          <Link to="/validation">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs">{t('nav.validation')}</span>
            </Button>
          </Link>
          <Link to="/history">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-xs">{t('nav.history')}</span>
            </Button>
          </Link>
        </div>
      </ModuleCard>
    </div>
  );
}
