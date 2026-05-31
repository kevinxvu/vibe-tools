
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Code2, AlignLeft, Minimize2, Trash2, AlertTriangle, 
  ChevronRight, ChevronDown, Copy, Upload, Save
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

type ViewMode = 'code' | 'tree';

// --- Tree View Components ---
const JsonValue: React.FC<{ value: any }> = ({ value }) => {
  if (value === null) return <span className="text-red-500">null</span>;
  if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
  if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  if (typeof value === 'string') return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
  return <span className="text-slate-500">unknown</span>;
};

const JsonNode: React.FC<{ name?: string, value: any, isLast?: boolean, depth?: number }> = ({ name, value, isLast = true, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2); // Auto expand top 2 levels
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;

  if (!isObject) {
    return (
      <div className="font-mono text-sm leading-6 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded">
        <span style={{ paddingLeft: `${depth * 1.25}rem` }}>
          {name && <span className="text-slate-700 dark:text-slate-300 mr-1">"{name}":</span>}
          <JsonValue value={value} />
          {!isLast && <span className="text-slate-500">,</span>}
        </span>
      </div>
    );
  }

  const keys = Object.keys(value);
  const brackets = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div className="font-mono text-sm leading-6">
      <div 
        className="flex items-center hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded cursor-pointer select-none"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
        onClick={() => !isEmpty && setExpanded(!expanded)}
      >
        {isEmpty ? (
          <span className="w-4 h-4 mr-1"></span>
        ) : (
          <span className="text-slate-400 mr-1">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        
        <span className="text-slate-700 dark:text-slate-300">
          {name && <span className="mr-1">"{name}":</span>}
          <span className="text-slate-500">{brackets[0]}</span>
          {!expanded && !isEmpty && <span className="text-slate-400 mx-1">...</span>}
          {isEmpty && <span className="text-slate-500">{brackets[1]}</span>}
          {!expanded && !isEmpty && <span className="text-slate-500">{brackets[1]}</span>}
          {!isLast && !expanded && <span className="text-slate-500">,</span>}
          {isArray && !expanded && <span className="text-slate-400 text-xs ml-2">items: {keys.length}</span>}
        </span>
      </div>

      {expanded && !isEmpty && (
        <>
          {keys.map((key, index) => (
            <JsonNode 
              key={key} 
              name={isArray ? undefined : key} 
              value={value[key as keyof typeof value]} 
              isLast={index === keys.length - 1}
              depth={depth + 1}
            />
          ))}
          <div 
            className="hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded"
            style={{ paddingLeft: `${depth * 1.25}rem` }}
          >
            <span className="text-slate-500 ml-5">{brackets[1]}</span>
            {!isLast && <span className="text-slate-500">,</span>}
          </div>
        </>
      )}
    </div>
  );
};

export const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [fileName, setFileName] = useState('data.json');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('json-formatter', {
    inputs: { json: input, viewMode },
    outputs: { parsed: parsedData },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.json || '');
      setViewMode(saved.inputs.viewMode || 'code');
    }
  }, []);

  // Auto-save state
  useToolState('json-formatter', {
    inputs: { json: input, viewMode },
    outputs: { parsed: parsedData },
  });

  useEffect(() => {
    if (!input.trim()) {
      setParsedData(null);
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParsedData(parsed);
      setError(null);
    } catch (err: any) {
      setParsedData(null);
      // Clean up error message to be more readable
      setError(err.message);
    }
  }, [input]);

  const handleFormat = () => {
    if (parsedData) {
      setInput(JSON.stringify(parsedData, null, 2));
      showToast(t('tools.jsonFormatter.jsonBeautified'));
    }
  };

  const handleMinify = () => {
    if (parsedData) {
      setInput(JSON.stringify(parsedData));
      showToast(t('tools.jsonFormatter.jsonMinified'));
    }
  };

  const handleClear = () => {
    setInput('');
    setParsedData(null);
    setError(null);
  };

  const handleCopy = () => {
    if (input) {
      navigator.clipboard.writeText(input);
      showToast(t('tools.jsonFormatter.jsonCopied'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      setFileName(file.name);
      showToast(t('tools.jsonFormatter.loadedFile', { filename: file.name }));
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset so same file can be selected again
  };

  const handleDownload = () => {
    if (!input) return;
    try {
      // Use parsed data to stringify if valid, otherwise use raw input
      const content = parsedData ? JSON.stringify(parsedData, null, 2) : input;
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t('tools.jsonFormatter.fileSaved'));
    } catch (error) {
      showToast(t('common.failedToSaveFile'), 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="text-indigo-600" />
            JSON Formatter
          </h1>
          <p className="text-sm text-slate-500">{t('tools.jsonFormatter.pageDescription')}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" onClick={handleFormat} disabled={!!error || !input} className="gap-2">
             <AlignLeft size={16} /> {t('tools.jsonFormatter.beautify')}
           </Button>
           <Button variant="secondary" size="sm" onClick={handleMinify} disabled={!!error || !input} className="gap-2">
             <Minimize2 size={16} /> {t('tools.jsonFormatter.minify')}
           </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        {/* Input Pane */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[400px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.jsonFormatter.inputLabel')}</span>
                {error ? (
                   <Badge color="red">{t('tools.jsonFormatter.invalidJson')}</Badge>
                ) : input ? (
                   <Badge color="green">{t('tools.jsonFormatter.validJson')}</Badge>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json,.txt"
                  onChange={handleFileUpload} 
                />
                <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-indigo-500" title="Import JSON File">
                  <Upload size={16} />
                </button>
                <button onClick={handleDownload} className="text-slate-400 hover:text-indigo-500" title="Export JSON File">
                  <Save size={16} />
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                <button onClick={handleClear} className="text-slate-400 hover:text-red-500" title="Clear">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <CodeEditor 
              value={input} 
              onChange={setInput} 
              placeholder={t('tools.jsonFormatter.placeholder')} 
            />
          </Card>
          {error && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span className="font-mono text-xs">{error}</span>
            </div>
          )}
        </div>

        {/* Output Pane */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[400px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-black/20">
             <div className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.jsonFormatter.outputLabel')}</span>
               </div>
               <div className="flex items-center gap-2">
                 {input && !error && (
                    <button 
                      onClick={handleCopy}
                      className="p-1 text-slate-400 hover:text-indigo-500 transition-colors mr-2"
                      title="Copy JSON"
                    >
                      <Copy size={14} />
                    </button>
                 )}
                 <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                    <button 
                      onClick={() => setViewMode('code')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'code' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {t('tools.jsonFormatter.code')}
                    </button>
                    <button 
                      onClick={() => setViewMode('tree')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'tree' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {t('tools.jsonFormatter.tree')}
                    </button>
                 </div>
               </div>
             </div>
             
             <div className="flex-1 overflow-auto p-4">
                {!input ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Code2 size={48} className="mb-4 opacity-20" />
                    <p>{t('tools.jsonFormatter.waitingForInput')}</p>
                  </div>
                ) : error ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <p>{t('tools.jsonFormatter.fixErrorsToPreview')}</p>
                   </div>
                ) : viewMode === 'code' ? (
                  <pre className="font-mono text-sm text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(parsedData, null, 2)}
                  </pre>
                ) : (
                  <div className="select-text">
                    <JsonNode value={parsedData} isLast={true} />
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
