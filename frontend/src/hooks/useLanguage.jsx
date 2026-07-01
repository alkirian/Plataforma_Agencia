import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('cadence-lang') || 'es');

  const changeLanguage = (nextLang) => {
    setLang(nextLang);
    localStorage.setItem('cadence-lang', nextLang);
  };

  const t = translations[lang] || translations['es'];

  const value = {
    lang,
    changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
