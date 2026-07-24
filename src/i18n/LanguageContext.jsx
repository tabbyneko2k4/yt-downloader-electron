import React, { createContext, useContext } from 'react';
import { translations, LANGUAGES } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ language = 'en', onLanguageChange, children }) {
  const t = (key, params = {}) => {
    const langDict = translations[language] || translations['en'];
    let text = langDict[key] || translations['en'][key] || key;

    // String parameter interpolation e.g. {{count}} -> 5
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), params[paramKey]);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: onLanguageChange, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
