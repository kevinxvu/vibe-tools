
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, RefreshCw, FileText, ArrowRight, Info } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useToolState } from '../lib/useToolState';

export const TextReplacer: React.FC = () => {
  const [template, setTemplate] = useState('My name is {{name}} and I am {{Base64Encode|{{status}}}}.');
  // Debounced template – processing only runs after user stops typing for 300ms
  const [debouncedTemplate, setDebouncedTemplate] = useState(template);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('text-replacer', {
    inputs: { template, variables },
    outputs: { result },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      const tpl = saved.inputs.template || 'My name is {{name}} and I am {{Base64Encode|{{status}}}}.';
      setTemplate(tpl);
      setDebouncedTemplate(tpl);
      setVariables(saved.inputs.variables || {});
    }
  }, []);

  // Debounce: only update debouncedTemplate 300ms after user stops typing
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTemplate(template), 300);
    return () => clearTimeout(id);
  }, [template]);

  // Auto-save state
  useToolState('text-replacer', {
    inputs: { template, variables },
    outputs: { result },
  });

  // Extract variables from template (runs on debounced value to avoid UI lock)
  useEffect(() => {
    // Only match plain {{variable}}, skip {{Func|Arg}} patterns
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const matches = [...debouncedTemplate.matchAll(regex)];
    const foundVars = Array.from(new Set(matches.map(m => m[1])));

    setVariables(prev => {
      const newVars: Record<string, string> = {};
      foundVars.forEach(v => {
        newVars[v] = prev[v] || '';
      });
      return newVars;
    });
  }, [debouncedTemplate]);

  // Unicode-safe Base64 Helpers
  const utf8ToBase64 = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(binString);
  };

  const base64ToUtf8 = (str: string): string => {
    const binString = atob(str);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
  };

  // Generate result (runs on debounced template to avoid blocking the UI)
  useEffect(() => {
    let output = debouncedTemplate;

    // 1. First Pass: Replace Variables
    Object.entries(variables).forEach(([key, value]) => {
      const replaceRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      output = output.replace(replaceRegex, value || `{{${key}}}`);
    });

    // 2. Second Pass: Process Helper Functions (max 5 nested levels)
    const funcRegex = /\{\{(Base64Encode|Base64Decode|Base64UrlEncode|Base64UrlDecode|UrlEncode|UrlDecode)\|(.+?)\}\}/gi;
    let loops = 0;
    let hasMatch = true;
    while (hasMatch && loops < 5) {
      hasMatch = false;
      output = output.replace(funcRegex, (match, func, arg) => {
        hasMatch = true;
        try {
          switch (func.toLowerCase()) {
            case 'base64encode':    return utf8ToBase64(arg);
            case 'base64decode':    return base64ToUtf8(arg);
            case 'base64urlencode': return utf8ToBase64(arg).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            case 'base64urldecode': {
              let str = arg.replace(/-/g, '+').replace(/_/g, '/');
              while (str.length % 4) str += '=';
              return base64ToUtf8(str);
            }
            case 'urlencode': return encodeURIComponent(arg);
            case 'urldecode': return decodeURIComponent(arg);
            default:         return match;
          }
        } catch (e) {
          return `[Error: Invalid Input for ${func}]`;
        }
      });
      loops++;
    }

    setResult(output);
  }, [debouncedTemplate, variables]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showToast(t('tools.textReplacer.resultCopied'));
  };

  const handleReset = () => {
    setVariables(prev => {
      const reset: Record<string, string> = {};
      Object.keys(prev).forEach(k => reset[k] = '');
      return reset;
    });
  };

  const helpers = [
    { name: 'Base64Encode', desc: 'Base64 encoding (UTF-8 supported)' },
    { name: 'Base64Decode', desc: 'Base64 decoding' },
    { name: 'Base64UrlEncode', desc: 'URL-safe Base64' },
    { name: 'UrlEncode', desc: 'URI Component Encode' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="text-indigo-600" />
          Text Replacer
        </h1>
        <p className="text-slate-500 mt-1">
          {t('tools.textReplacer.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input & Configuration */}
        <div className="lg:flex-1 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2">
          <Card className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('tools.textReplacer.templateString')}
              </label>
              <div className="group relative">
                <Info size={16} className="text-slate-400 cursor-help" />
                <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-10 hidden group-hover:block">
                  <p className="font-semibold mb-2">{t('tools.textReplacer.supportedHelpers')}</p>
                  <ul className="space-y-1 list-disc pl-3">
                    {helpers.map(h => (
                      <li key={h.name}><code className="bg-slate-700 px-1 rounded">{`{{${h.name}|...}}`}</code></li>
                    ))}
                  </ul>
                  <p className="mt-2 text-slate-400">{t('tools.textReplacer.nestVariables')}</p>
                </div>
              </div>
            </div>
            <textarea
              className="w-full h-32 p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Enter text with {{variable}} or {{Base64Encode|text}}..."
            />
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('tools.textReplacer.variables')}</h3>
              <Button size="sm" variant="ghost" onClick={handleReset} className="text-xs h-8">
                <RefreshCw size={12} className="mr-1" /> {t('tools.textReplacer.resetValues')}
              </Button>
            </div>
            
            {Object.keys(variables).length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-sm">
                No plain variables found. <br/>
                <span className="text-xs opacity-75 mt-2 block">
                  {t('tools.textReplacer.noPlainVariables')} {t('tools.textReplacer.addToTemplate')}
                </span>
              </div>
            ) : (
              <div className="grid gap-3">
                {Object.keys(variables).map((key) => (
                  <div key={key} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-1/3 min-w-[100px]">
                      <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                        {key}
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-slate-400" />
                    <textarea
                      className="flex-1 min-h-[2rem] max-h-40 p-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-y leading-snug"
                      placeholder={t('tools.textReplacer.valueFor') + ' ' + key}
                      value={variables[key]}
                      rows={1}
                      onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Output Preview */}
        <div className="lg:flex-1 flex flex-col h-full min-h-[400px] min-w-0">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700">
             <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
               <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('tools.textReplacer.result')}</span>
               <Button size="sm" variant="secondary" onClick={handleCopy} className="h-8 text-xs gap-1">
                 <Copy size={12} /> Copy
               </Button>
             </div>
             <div className="flex-1 p-6 overflow-auto bg-slate-50/30 dark:bg-black/20">
               <pre className="whitespace-pre-wrap break-all font-mono text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                 {result}
               </pre>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
