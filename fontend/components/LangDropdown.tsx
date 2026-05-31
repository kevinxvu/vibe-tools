import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import vnFlag from 'flag-icons/flags/4x3/vn.svg';
import usFlag from 'flag-icons/flags/4x3/us.svg';

const LANGS = [
  { code: 'en', flag: usFlag, label: 'English' },
  { code: 'vi', flag: vnFlag, label: 'Tiếng Việt' },
];

interface LangDropdownProps {
  onSelect?: () => void;
}

export const LangDropdown: React.FC<LangDropdownProps> = ({ onSelect }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';
  const activeLang = LANGS.find(l => l.code === currentLang) ?? LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        <img src={activeLang.flag} alt="" style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2 }} />
        <span>{activeLang.label}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
            {LANGS.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setIsOpen(false);
                  onSelect?.();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${currentLang === lang.code ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-700 dark:text-slate-200'}`}
              >
                <img src={lang.flag} alt="" style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2 }} />
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
