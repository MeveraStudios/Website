/**
 * i18n bootstrap.
 *
 * Only UI chrome is translated — docs content stays in the source language
 * (English) until per-locale `docs/<lang>/` trees are introduced.
 *
 * Add a locale by dropping a new JSON file into `src/i18n/locales/` and
 * wiring it into the `resources` map below.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

export const SUPPORTED_LOCALES = ['en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';
const STORAGE_KEY = 'meveradocs:lang';

function readStoredLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as SupportedLocale;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: SupportedLocale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: readStoredLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  });

export default i18n;
