import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './resources';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

/** Sync <html lang> and <html dir> whenever the language changes. */
function applyDirection(lng: string) {
  const isRtl = (RTL_LANGUAGES as string[]).includes(lng);
  document.documentElement.setAttribute('lang', lng);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
}
applyDirection(i18n.language || 'en');
i18n.on('languageChanged', applyDirection);

export default i18n;
