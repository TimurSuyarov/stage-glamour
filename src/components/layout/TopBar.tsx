import { User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { clearStoredAuth } from "@/lib/authStorage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onMenuToggle?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: "role.admin",
  validator: "role.validator",
  returner: "role.returner",
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  return (
    <header className="h-14 bg-topbar border-b border-topbar-border flex items-center justify-end px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 pl-2 pr-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {user && t(roleLabels[user.role] ?? user.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {user && t(roleLabels[user.role] ?? user.role)}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                clearStoredAuth();
                setUser(null);
                window.location.reload();
              }}
            >
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
