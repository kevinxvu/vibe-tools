
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Quote, ArrowRight, ArrowLeft, Copy, Trash2, AlertTriangle, FileCode, Database, FileSpreadsheet, Code2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

type EscapeType = 'html' | 'xml' | 'js' | 'json' | 'csv' | 'sql';

const ESCAPE_TYPES: { id: EscapeType; label: string; icon: any }[] = [
  { id: 'json', label: 'JSON String', icon: Quote },
  { id: 'js', label: 'JavaScript', icon: Code2 },
  { id: 'html', label: 'HTML Entities', icon: FileCode },
  { id: 'xml', label: 'XML Entities', icon: FileCode },
  { id: 'sql', label: 'SQL (Single Quote)', icon: Database },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
];

export const StringEscaper: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [type, setType] = useState<EscapeType>('json');
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('string-escaper', {
    inputs: { text: input, type },
    outputs: { result: output },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
      setOutput(saved.outputs.result || '');
      setType(saved.inputs.type || 'json');
    }
  }, []);

  // Auto-save state
  useToolState('string-escaper', {
    inputs: { text: input, type },
    outputs: { result: output },
  });

  const processAction = (action: 'escape' | 'unescape') => {
    setError(null);
    const source = input; // Always read from left
    if (!source) {
      setOutput('');
      return;
    }

    try {
      let result = '';
      if (action === 'escape') {
         switch (type) {
          case 'html':
            result = source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            break;
          case 'xml':
            result = source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
            break;
          case 'js':
            result = JSON.stringify(source).slice(1, -1);
            break;
          case 'json':
            result = JSON.stringify(source);
            break;
          case 'sql':
            result = source.replace(/'/g, "''");
            break;
          case 'csv':
            if (/[",\n\r]/.test(source)) {
              result = `"${source.replace(/"/g, '""')}"`;
            } else {
              result = source;
            }
            break;
        }
      } else {
        // UNESCAPE LOGIC
        switch (type) {
          case 'html':
            const doc = new DOMParser().parseFromString(source, "text/html");
            result = doc.documentElement.textContent || "";
            break;
          case 'xml':
            // Simple regex fallback for basic entities
            result = source.replace(/&lt;/g, "<")
                           .replace(/&gt;/g, ">")
                           .replace(/&quot;/g, "\"")
                           .replace(/&apos;/g, "'")
                           .replace(/&amp;/g, "&");
            break;
          case 'js':
          case 'json':
            let toParse = source.trim();
            
            // Handle common case where user provides an escaped string fragment without outer quotes
            // e.g. \"from_date\":\"...\"
            if (!toParse.startsWith('"') && !toParse.startsWith("'")) {
              toParse = `"${toParse}"`;
            } else if (toParse.startsWith("'") && toParse.endsWith("'")) {
              // Convert single quoted string to double quoted for JSON.parse
              toParse = `"${toParse.slice(1, -1).replace(/"/g, '\\"')}"`;
            }

            try {
               let parsed = JSON.parse(toParse);
               
               // Convenience: If the unescaped string is actually a JSON object/array string,
               // automatically parse and format it for the user.
               if (typeof parsed === 'string') {
                 const trimmedParsed = parsed.trim();
                 if ((trimmedParsed.startsWith('{') && trimmedParsed.endsWith('}')) || 
                     (trimmedParsed.startsWith('[') && trimmedParsed.endsWith(']'))) {
                   try {
                     const innerObj = JSON.parse(trimmedParsed);
                     result = JSON.stringify(innerObj, null, 2);
                   } catch (e) {
                     // Not valid JSON, just return the unescaped string
                     result = parsed;
                   }
                 } else {
                   result = parsed;
                 }
               } else if (typeof parsed === 'object' && parsed !== null) {
                 result = JSON.stringify(parsed, null, 2);
               } else {
                 result = String(parsed);
               }
            } catch (e) {
               result = source; 
               throw new Error("Invalid escaped string format. Make sure your backslashes and quotes are correctly escaped for JSON.");
            }
            break;
          case 'sql':
            result = source.replace(/''/g, "'");
            break;
          case 'csv':
             if (source.startsWith('"') && source.endsWith('"')) {
               result = source.slice(1, -1).replace(/""/g, '"');
             } else {
               result = source;
             }
            break;
        }
      }
      setOutput(result);
      showToast(action === 'escape' ? t('tools.stringEscaper.escaped') : t('tools.stringEscaper.unescaped'));
    } catch (err: any) {
      setError(err.message || `Failed to ${action} string`);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Quote className="text-indigo-600" />
          String Escaper
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.stringEscaper.pageDescription')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      {/* Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {ESCAPE_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              type === t.id 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Input String</span>
              <div className="flex gap-2">
                <button onClick={() => setInput('')} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <button onClick={() => copyToClipboard(input)} className="text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>
              </div>
            </div>
            <CodeEditor 
              placeholder={
                type === 'html' ? '<div class="foo">' :
                type === 'json' ? '{\\"key\\": \\"value\\"}' :
                type === 'sql' ? "O'Reilly" : 
                "Enter text here..."
              }
              value={input}
              onChange={setInput}
            />
          </Card>
        </div>

        {/* Middle: Controls */}
        <div className="flex lg:flex-col justify-center items-center gap-4 py-2 lg:py-0">
           <Button onClick={() => processAction('escape')} className="w-full lg:w-auto min-w-[120px]" title="Convert Input to Escaped Output">
             <div className="flex items-center justify-center gap-2">
               <span className="lg:hidden">Escape</span>
               <span className="hidden lg:inline">Escape</span>
               <ArrowRight className="hidden lg:block" size={16} />
               <ArrowRight className="lg:hidden" size={16} transform="rotate(90)" />
             </div>
           </Button>
           <Button variant="secondary" onClick={() => processAction('unescape')} className="w-full lg:w-auto min-w-[120px]" title="Convert Input (Escaped) to Raw Output">
             <div className="flex items-center justify-center gap-2">
               <span className="lg:hidden">Unescape</span>
               <span className="hidden lg:inline">Unescape</span>
               <ArrowRight className="hidden lg:block" size={16} /> 
               {/* Arrow points right because we always flow Input -> Output in this simplified UI model, even for unescape */}
               <ArrowRight className="lg:hidden" size={16} transform="rotate(90)" />
             </div>
           </Button>
        </div>

        {/* Right: Output */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Result</span>
              <div className="flex gap-2">
                <button onClick={() => setOutput('')} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <button onClick={() => copyToClipboard(output)} className="text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>
              </div>
            </div>
            <CodeEditor 
              placeholder="Result..."
              value={output}
              onChange={setOutput}
            />
          </Card>
        </div>

      </div>
    </div>
  );
};
