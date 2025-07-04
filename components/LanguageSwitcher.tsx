// src/components/LanguageSwitcher.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="relative">
      <select
        onChange={handleLanguageChange}
        value={i18n.language}
        className="text-xs text-gray-700 bg-gray-200/50 hover:bg-gray-200 border-none rounded-md py-1 pl-2 pr-6 appearance-none focus:outline-none cursor-pointer"
      >
        <option value="th">🇹🇭 ไทย</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;