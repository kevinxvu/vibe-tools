import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import vnFlag from 'flag-icons/flags/4x3/vn.svg';
import usFlag from 'flag-icons/flags/4x3/us.svg';
import thFlag from 'flag-icons/flags/4x3/th.svg';
import cnFlag from 'flag-icons/flags/4x3/cn.svg';
import jpFlag from 'flag-icons/flags/4x3/jp.svg';
import krFlag from 'flag-icons/flags/4x3/kr.svg';
import frFlag from 'flag-icons/flags/4x3/fr.svg';
import deFlag from 'flag-icons/flags/4x3/de.svg';
import esFlag from 'flag-icons/flags/4x3/es.svg';
import ruFlag from 'flag-icons/flags/4x3/ru.svg';

export const LANGUAGE_LIST = [
  { code: 'auto', label: 'Auto Detect',  nativeLabel: '',           flag: null },
  { code: 'vi',   label: 'Vietnamese',   nativeLabel: 'Tiếng Việt', flag: vnFlag },
  { code: 'en',   label: 'English',      nativeLabel: 'English',    flag: usFlag },
  { code: 'th',   label: 'Thai',         nativeLabel: 'ภาษาไทย',    flag: thFlag },
  { code: 'zh',   label: 'Chinese',      nativeLabel: '中文',        flag: cnFlag },
  { code: 'ja',   label: 'Japanese',     nativeLabel: '日本語',      flag: jpFlag },
  { code: 'ko',   label: 'Korean',       nativeLabel: '한국어',      flag: krFlag },
  { code: 'fr',   label: 'French',       nativeLabel: 'Français',   flag: frFlag },
  { code: 'de',   label: 'German',       nativeLabel: 'Deutsch',    flag: deFlag },
  { code: 'es',   label: 'Spanish',      nativeLabel: 'Español',    flag: esFlag },
  { code: 'ru',   label: 'Russian',      nativeLabel: 'Русский',    flag: ruFlag },
];

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Include the "Auto Detect" option (default: false) */
  includeAuto?: boolean;
  className?: string;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  value,
  onChange,
  includeAuto = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = LANGUAGE_LIST.filter(l => includeAuto || l.code !== 'auto');
  const active = options.find(l => l.code === value) ?? options[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full h-10 px-3 flex items-center gap-2 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        {active.flag
          ? <img src={active.flag} alt="" style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
          : <Globe size={14} className="text-slate-400 flex-shrink-0" />
        }
        <span className="flex-1 text-left truncate text-slate-800 dark:text-slate-200">{active.label}</span>
        {active.nativeLabel && active.code !== 'en' && (
          <span className="text-xs text-slate-400 truncate hidden sm:block">{active.nativeLabel}</span>
        )}
        <ChevronDown
          size={13}
          className={`flex-shrink-0 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-y-auto max-h-52">
              {options.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { onChange(lang.code); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                    value === lang.code
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang.flag
                    ? <img src={lang.flag} alt="" style={{ width: 20, height: 15, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                    : <Globe size={14} className="text-slate-400 flex-shrink-0" />
                  }
                  <span className="flex-1">{lang.label}</span>
                  {lang.nativeLabel && lang.code !== 'en' && (
                    <span className="text-xs text-slate-400">{lang.nativeLabel}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
