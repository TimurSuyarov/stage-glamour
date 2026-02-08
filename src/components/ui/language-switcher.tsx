import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: 'UZ', flag: '🇺🇿' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
  ];

  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(lang.code)}
          className={cn(
            'h-7 px-3 text-xs font-medium transition-all',
            language === lang.code 
              ? 'bg-card shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
          )}
        >
          <span className="mr-1.5">{lang.flag}</span>
          {lang.label}
        </Button>
      ))}
    </div>
  );
}
