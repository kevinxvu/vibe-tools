
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Copy } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import CryptoJS from 'crypto-js';
import { useToolState } from '../lib/useToolState';

export const StringHash: React.FC = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('string-hash', {
    inputs: { text: input },
    outputs: { hashes },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
    }
  }, []);

  // Auto-save state
  useToolState('string-hash', {
    inputs: { text: input },
    outputs: { hashes },
  });

  // Standard Hashes
  useEffect(() => {
    if (!input) {
      setHashes({});
      return;
    }

    try {
      const results: Record<string, string> = {};
      
      // Encoding
      results['Hex (Encode)'] = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(input));
      results['Base64 (Encode)'] = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
      
      // Hashing
      results['MD5'] = CryptoJS.MD5(input).toString();
      results['SHA-1'] = CryptoJS.SHA1(input).toString();
      results['SHA-256'] = CryptoJS.SHA256(input).toString();
      results['SHA-512'] = CryptoJS.SHA512(input).toString();
      results['SHA-3 (Keccak)'] = CryptoJS.SHA3(input).toString();
      results['RIPEMD-160'] = CryptoJS.RIPEMD160(input).toString();

      setHashes(results);
    } catch (e) {
      console.error(e);
    }
  }, [input]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  const HashRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div className="min-w-[140px] mb-2 sm:mb-0">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex-1 font-mono text-sm text-slate-700 dark:text-slate-300 break-all mr-4">
        {value || <span className="text-slate-400 italic">waiting for input...</span>}
      </div>
      <button 
        onClick={() => copyToClipboard(value, label)}
        className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 self-end sm:self-center"
        title="Copy"
        disabled={!value}
      >
        <Copy size={16} />
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Hash className="text-indigo-600" />
          String Hash & Crypto
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.stringHash.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Input Column */}
        <div className="lg:w-1/3 flex flex-col gap-6">
           <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <span className="text-xs font-semibold text-slate-500 uppercase">Input Text</span>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => setInput('')}
                 className="text-xs h-6"
               >
                 Clear
               </Button>
             </div>
             <CodeEditor 
               value={input} 
               onChange={setInput} 
               placeholder="Type text to hash..."
             />
           </Card>
        </div>

        {/* Output Column */}
        <div className="lg:w-2/3 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-full flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-950/30">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
               <span className="text-xs font-semibold text-slate-500 uppercase">Computed Hashes</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               <div className="space-y-3">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Encoding</h3>
                  <HashRow label="Hex (Encode)" value={hashes['Hex (Encode)']} />
                  <HashRow label="Base64 (Encode)" value={hashes['Base64 (Encode)']} />
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Message Digest</h3>
                  <HashRow label="MD5" value={hashes['MD5']} />
                  <HashRow label="RIPEMD-160" value={hashes['RIPEMD-160']} />
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Secure Hash Algorithms (SHA)</h3>
                  <HashRow label="SHA-1" value={hashes['SHA-1']} />
                  <HashRow label="SHA-256" value={hashes['SHA-256']} />
                  <HashRow label="SHA-512" value={hashes['SHA-512']} />
                  <HashRow label="SHA-3 (Keccak)" value={hashes['SHA-3 (Keccak)']} />
               </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
