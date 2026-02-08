import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, menuVisibility } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  ChevronDown,
  ChevronLeft,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  href?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    id: 'operational',
    labelKey: 'nav.operational',
    icon: PackageSearch,
    children: [
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
    labelKey: 'nav.masterData',
    icon: Grid3X3,
    children: [
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
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['operational', 'masterData']);

  const visibleMenus = user ? menuVisibility[user.role] : [];

  const isItemVisible = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some((child) => visibleMenus.includes(child.id));
    }
    return visibleMenus.includes(item.id);
  };

  const filterVisibleChildren = (children: NavItem[]): NavItem[] => {
    return children.filter((child) => visibleMenus.includes(child.id));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

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
              <span className="text-sm font-semibold text-sidebar-foreground">Glamour</span>
              <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">WMS Admin</span>
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
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {navigationItems.filter(isItemVisible).map((item) => {
            if (item.children) {
              const visibleChildren = filterVisibleChildren(item.children);
              const isGroupOpen = openGroups.includes(item.id);
              const hasActiveChild = visibleChildren.some((child) => isActive(child.href));

              if (collapsed) {
                return (
                  <div key={item.id} className="space-y-1">
                    {visibleChildren.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.href!}
                        className={cn(
                          'flex items-center justify-center h-10 rounded-lg transition-colors',
                          isActive(child.href)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )}
                        title={t(child.labelKey)}
                      >
                        <child.icon className="w-5 h-5" />
                      </NavLink>
                    ))}
                  </div>
                );
              }

              return (
                <Collapsible
                  key={item.id}
                  open={isGroupOpen}
                  onOpenChange={() => toggleGroup(item.id)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                        hasActiveChild
                          ? 'text-sidebar-foreground'
                          : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left">{t(item.labelKey)}</span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          isGroupOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-1">
                    <div className="ml-4 pl-4 border-l border-sidebar-border space-y-1">
                      {visibleChildren.map((child) => (
                        <NavLink
                          key={child.id}
                          to={child.href!}
                          className={cn(
                            'flex items-center gap-3 px-3 h-9 rounded-lg text-sm transition-colors',
                            isActive(child.href)
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                          )}
                        >
                          <child.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{t(child.labelKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // Single item (Dashboard)
            return (
              <NavLink
                key={item.id}
                to={item.href!}
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
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-[10px] text-sidebar-muted text-center">
            v2.1.0 · © 2025 Glamour Cosmetics
          </div>
        </div>
      )}
    </aside>
  );
}
