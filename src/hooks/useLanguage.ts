import { useTranslation } from 'react-i18next';
import { changeLanguage as changeI18nLanguage } from '@/i18n';

export type Language = 'uz' | 'ru';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: Language) => {
    changeI18nLanguage(lang);
  };

  return {
    currentLanguage: (i18n.language?.split('-')[0] || 'uz') as Language,
    changeLanguage,
    isRTL: i18n.dir() === 'rtl',
  };
};
