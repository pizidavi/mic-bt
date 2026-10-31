import { getLocales } from 'expo-localization';
import i18n, { type CustomTypeOptions, type ParseKeys } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { LANGUAGE } from '../type/enum';
import { appLog } from '../util/logger';
import english from './en.json';
import italian from './it.json';

const RESOURCES = {
  [LANGUAGE.EN]: english,
  [LANGUAGE.IT]: italian,
} as const satisfies Record<LANGUAGE, typeof english & typeof italian>;

i18n.use(initReactI18next).init({
  resources: RESOURCES,
  lng: LANGUAGE.EN,
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

const isLanguageAvailable = (languageString: string) =>
  Object.values(LANGUAGE).includes(languageString as LANGUAGE);

const [locale] = getLocales();
const languageCode = locale.languageCode ?? locale.languageTag.split('-')[0];

if (isLanguageAvailable(languageCode) && languageCode !== i18n.language) {
  appLog.debug(`Updated language from ${i18n.language} to ${languageCode}`);
  i18n.changeLanguage(languageCode).catch(e => appLog.error('Error changing language', e));
}

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof RESOURCES;
    keySeparator: ':';
  }
}

export type Dictionary = ParseKeys<keyof CustomTypeOptions['resources']> | TemplateStringsArray;
