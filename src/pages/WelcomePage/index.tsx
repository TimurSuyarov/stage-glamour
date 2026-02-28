import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function WelcomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.name?.trim() || t("welcome.guest");

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-5 py-12">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3">
        <span className="text-4xl sm:text-5xl select-none" aria-hidden>
          👋
        </span>
        <h1 className="text-2xl sm:text-4xl font-semibold text-foreground">
          {t("welcome.title", { name: displayName })}
        </h1>
      </div>
      <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md">
        {t("welcome.tagline")}
      </p>
    </div>
  );
}
