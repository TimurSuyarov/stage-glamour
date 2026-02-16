import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import uz from './locales/uz/common.json';
import ru from './locales/ru/common.json';

const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
};

const selectedLanguage = localStorage.getItem('i18nextLng') || 'uz';

i18n.use(initReactI18next).init({
  resources,
  lng: selectedLanguage,
  fallbackLng: selectedLanguage,
  keySeparator: false,
  supportedLngs: Object.keys(resources),
  interpolation: {
    escapeValue: false,
  },
  react: { useSuspense: false },
});

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
};

export default i18n;
