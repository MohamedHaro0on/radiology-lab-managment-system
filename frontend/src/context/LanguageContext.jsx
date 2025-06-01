import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

/**
 * Language Provider component that manages language state and provides it to the app
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState('en');

  // Update lang state when i18n language changes
  useEffect(() => {
    const currentLang = i18n.language;
    setLang(currentLang);
    document.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    setLang(newLang);
  };

  const isRtl = lang === 'ar';

  const value = {
    lang,
    setLang: changeLanguage,
    isRtl,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to use the language context
 * @returns {Object} Language context value containing lang, setLang, and isRtl
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext; 