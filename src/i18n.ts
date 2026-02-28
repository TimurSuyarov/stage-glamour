import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import uz from './locales/uz/common.json';
import ru from './locales/ru/common.json';

const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
};

const supportedLngs = ['uz', 'ru'] as const;
const defaultLng = 'uz';
const stored = localStorage.getItem('i18nextLng');
const initialLng = stored && supportedLngs.includes(stored as any) ? stored : defaultLng;

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: defaultLng,
  keySeparator: false,
  supportedLngs: [...supportedLngs],
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
