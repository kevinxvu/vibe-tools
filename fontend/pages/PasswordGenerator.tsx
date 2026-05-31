
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, RefreshCw, Copy, Settings, Plus, Minus } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(10);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [strength, setStrength] = useState(0);

  const { showToast } = useToast();
  const { t } = useTranslation();

  const CHAR_SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
    ambiguous: 'Il1O0o'
  };

  const generatePassword = () => {
    let charset = '';
    if (useUpper) charset += CHAR_SETS.upper;
    if (useLower) charset += CHAR_SETS.lower;
    if (useNumbers) charset += CHAR_SETS.numbers;
    if (useSymbols) charset += CHAR_SETS.symbols;

    if (excludeAmbiguous) {
      // Remove ambiguous characters from the built charset
      for (const char of CHAR_SETS.ambiguous) {
        charset = charset.split(char).join('');
      }
    }

    if (!charset) {
      setPassword('');
      setStrength(0);
      return;
    }

    // Use crypto.getRandomValues for better security
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length];
    }

    setPassword(newPassword);
    calculateStrength(newPassword);
  };

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) {
      setStrength(0);
      return;
    }

    // Base score for length
    score += pwd.length * 4;
    
    // Bonus for variety
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

    // Penalty for short length
    if (pwd.length < 8) score -= 20;

    // Cap at 100
    setStrength(Math.min(100, Math.max(0, score)));
  };

  // Generate on mount and when settings change
  useEffect(() => {
    generatePassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  const handleIncreaseLength = () => setLength(prev => Math.min(64, prev + 1));
  const handleDecreaseLength = () => setLength(prev => Math.max(4, prev - 1));

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="text-indigo-600" />
          Password Generator
        </h1>
        <p className="text-sm text-slate-500">{t('tools.passwordGenerator.pageDescription')}</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
          {/* Result Card */}
          <Card className="p-8">
             <div className="relative mb-6">
               <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center break-all">
                  <span className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-wide">
                    {password || <span className="text-slate-400 text-base">Select options to generate</span>}
                  </span>
               </div>
               {password && (
                 <div className="absolute top-2 right-2">
                   <Button variant="ghost" size="sm" onClick={() => copyToClipboard(password)} title="Copy">
                     <Copy size={18} />
                   </Button>
                 </div>
               )}
             </div>

             {/* Strength Meter */}
             <div className="mb-6">
               <div className="flex justify-between text-xs mb-1 font-medium text-slate-500 uppercase tracking-wide">
                 <span>Strength</span>
                 <span>{getStrengthLabel()} ({strength}%)</span>
               </div>
               <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-500 ${getStrengthColor()}`} 
                   style={{ width: `${strength}%` }}
                 />
               </div>
             </div>

             <Button onClick={generatePassword} className="w-full h-12 text-base gap-2">
               <RefreshCw size={20} /> {t('tools.passwordGenerator.generateBtn')}
             </Button>
          </Card>

          {/* Configuration Card */}
          <Card className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <Settings size={18} /> Options
             </h3>

             {/* Length Control */}
             <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Length</label>
                 <div className="flex items-center gap-1">
                   <button 
                     onClick={handleDecreaseLength}
                     className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                   >
                     <Minus size={14} />
                   </button>
                   <div className="w-12 h-8 flex items-center justify-center font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-700">
                     {length}
                   </div>
                   <button 
                     onClick={handleIncreaseLength}
                     className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                   >
                     <Plus size={14} />
                   </button>
                 </div>
               </div>
               <input 
                 type="range" 
                 min="4" 
                 max="64" 
                 value={length}
                 onChange={(e) => setLength(parseInt(e.target.value))}
                 className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
               <div className="flex justify-between text-xs text-slate-400 mt-2">
                 <span>4</span>
                 <span>64</span>
               </div>
             </div>

             {/* Toggles */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                 <input 
                   type="checkbox" 
                   checked={useUpper} 
                   onChange={(e) => setUseUpper(e.target.checked)}
                   className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Uppercase (A-Z)</span>
               </label>

               <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                 <input 
                   type="checkbox" 
                   checked={useLower} 
                   onChange={(e) => setUseLower(e.target.checked)}
                   className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Lowercase (a-z)</span>
               </label>

               <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                 <input 
                   type="checkbox" 
                   checked={useNumbers} 
                   onChange={(e) => setUseNumbers(e.target.checked)}
                   className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Numbers (0-9)</span>
               </label>

               <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                 <input 
                   type="checkbox" 
                   checked={useSymbols} 
                   onChange={(e) => setUseSymbols(e.target.checked)}
                   className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Symbols (!@#$)</span>
               </label>
               
               <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors sm:col-span-2">
                 <input 
                   type="checkbox" 
                   checked={excludeAmbiguous} 
                   onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                   className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 />
                 <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Exclude Ambiguous Characters</span>
                    <span className="text-xs text-slate-400">Avoids characters like I, l, 1, O, 0</span>
                 </div>
               </label>
             </div>
          </Card>
      </div>
    </div>
  );
};
