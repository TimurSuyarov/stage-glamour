import { Bell, Search, User, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();

  const roleLabels = {
    executor: t('role.executor'),
    validator: t('role.validator'),
    returner: t('role.returner'),
  };

  const handleRoleChange = (role: 'executor' | 'validator' | 'returner') => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <header className="h-14 bg-topbar border-b border-topbar-border flex items-center justify-between px-4 sticky top-0 z-40">
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* SAP Sync Status */}
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SAP Synced</span>
          <span className="w-2 h-2 rounded-full bg-status-success" />
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 pl-2 pr-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground">{user && roleLabels[user.role]}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Switch Role (Demo)
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleRoleChange('executor')}>
              <Badge variant={user?.role === 'executor' ? 'default' : 'outline'} className="mr-2">E</Badge>
              {t('role.executor')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange('validator')}>
              <Badge variant={user?.role === 'validator' ? 'default' : 'outline'} className="mr-2">V</Badge>
              {t('role.validator')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange('returner')}>
              <Badge variant={user?.role === 'returner' ? 'default' : 'outline'} className="mr-2">R</Badge>
              {t('role.returner')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
