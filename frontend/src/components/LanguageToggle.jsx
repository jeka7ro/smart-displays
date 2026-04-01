import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex bg-slate-100/50 backdrop-blur-md p-1 rounded-full shadow-inner border border-slate-200/50">
      <button
        onClick={() => changeLanguage('ro')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
          i18n.language.startsWith('ro') 
            ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] text-slate-800' 
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <span>🇷🇴</span> RO
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
          i18n.language.startsWith('en') 
            ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] text-slate-800' 
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <span>🇬🇧</span> EN
      </button>
    </div>
  );
};
