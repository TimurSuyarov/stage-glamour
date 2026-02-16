import { User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  const roleLabels = {
    executor: t("role.executor"),
    validator: t("role.validator"),
    returner: t("role.returner"),
  };

  const handleRoleChange = (role: "executor" | "validator" | "returner") => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <header className="h-14 bg-topbar border-b border-topbar-border flex items-center justify-end px-4 sticky top-0 z-40">
      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 pl-2 pr-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {user && roleLabels[user.role]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("account")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {t("switchRoleDemo")}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleRoleChange("executor")}>
              <Badge
                variant={user?.role === "executor" ? "default" : "outline"}
                className="mr-2"
              >
                E
              </Badge>
              {t("role.executor")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("validator")}>
              <Badge
                variant={user?.role === "validator" ? "default" : "outline"}
                className="mr-2"
              >
                V
              </Badge>
              {t("role.validator")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRoleChange("returner")}>
              <Badge
                variant={user?.role === "returner" ? "default" : "outline"}
                className="mr-2"
              >
                R
              </Badge>
              {t("role.returner")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                sessionStorage.removeItem("token"), window.location.reload();
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
