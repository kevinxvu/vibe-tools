import en from './locales/en.json';

// Expose translation type for reference only — strict key checking disabled
// because i18next v23 TS types generate "namespace:key" format, not bare keys.
export type TranslationKeys = typeof en;

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
