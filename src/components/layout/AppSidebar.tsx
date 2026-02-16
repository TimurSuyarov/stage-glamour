import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth, menuVisibility } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  PackageOpen,
  ShoppingCart,
  PackageSearch,
  ClipboardCheck,
  RotateCcw,
  Truck,
  ArrowRightLeft,
  History,
  Warehouse,
  Users,
  Grid3X3,
  Box,
  ClipboardList,
  BarChart3,
  Gift,
  ChevronLeft,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  href: string;
}

interface NavGroup {
  id: string;
  items: NavItem[];
}

// Flat navigation with groups for dividers
const navigationGroups: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, href: '/' },
    ],
  },
  {
    id: 'operational',
    items: [
      { id: 'admission', labelKey: 'nav.admission', icon: PackageOpen, href: '/admission' },
      { id: 'order', labelKey: 'nav.order', icon: ShoppingCart, href: '/orders' },
      { id: 'collect', labelKey: 'nav.collect', icon: PackageSearch, href: '/collect' },
      { id: 'validation', labelKey: 'nav.validation', icon: ClipboardCheck, href: '/validation' },
      { id: 'return', labelKey: 'nav.return', icon: RotateCcw, href: '/returns' },
      { id: 'moveToRegion', labelKey: 'nav.moveToRegion', icon: Truck, href: '/move-to-region' },
      { id: 'relocation', labelKey: 'nav.relocation', icon: ArrowRightLeft, href: '/relocation' },
      { id: 'history', labelKey: 'nav.history', icon: History, href: '/history' },
    ],
  },
  {
    id: 'masterData',
    items: [
      { id: 'warehouse', labelKey: 'nav.warehouse', icon: Warehouse, href: '/warehouse' },
      { id: 'employees', labelKey: 'nav.employees', icon: Users, href: '/employees' },
      { id: 'cells', labelKey: 'nav.cells', icon: Grid3X3, href: '/cells' },
      { id: 'goods', labelKey: 'nav.goods', icon: Box, href: '/goods' },
      { id: 'inventory', labelKey: 'nav.inventory', icon: ClipboardList, href: '/inventory' },
      { id: 'reports', labelKey: 'nav.reports', icon: BarChart3, href: '/reports' },
      { id: 'bonuses', labelKey: 'nav.bonuses', icon: Gift, href: '/bonuses' },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, onCollapsedChange }: AppSidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const visibleMenus = user ? menuVisibility[user.role] : [];

  const isItemVisible = (item: NavItem): boolean => {
    return visibleMenus.includes(item.id);
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Filter groups to only show visible items
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(isItemVisible),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">{t('app.name')}</span>
              <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">{t('app.subtitle')}</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'mx-auto'
          )}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2">
        <div className="space-y-2">
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.id}>
              {/* Divider between groups */}
              {groupIndex > 0 && (
                <Separator className="my-3 bg-sidebar-border" />
              )}

              {/* Group items */}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                      collapsed && 'justify-center px-0'
                    )}
                    title={collapsed ? t(item.labelKey) : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{t(item.labelKey)}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-[10px] text-sidebar-muted text-center">
            {t('app.footer')}
          </div>
        </div>
      )}
    </aside>
  );
}
