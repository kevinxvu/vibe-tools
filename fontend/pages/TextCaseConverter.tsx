
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Type, ArrowRight, Copy, Trash2, ArrowLeftRight } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

export const TextCaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [stripAccents, setStripAccents] = useState(false);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('string-case-converter', {
    inputs: { text: input, stripAccents },
    outputs: { result: output },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
      setOutput(saved.outputs.result || '');
      setStripAccents(saved.inputs.stripAccents ?? false);
    }
  }, []);

  // Auto-save state
  useToolState('string-case-converter', {
    inputs: { text: input, stripAccents },
    outputs: { result: output },
  });

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast(t('tools.textCaseConverter.resultCopied'));
  };

  const removeAccents = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  const toSentenceCase = (str: string) => {
    return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
  };

  const toCamelCase = (str: string) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '');
  };

  const toPascalCase = (str: string) => {
    return str
      .replace(/\w+/g, function(w){return w[0].toUpperCase() + w.slice(1).toLowerCase();})
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '');
  };

  const toSnakeCase = (str: string) => {
    return str
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      ?.map(x => x.toLowerCase())
      .join('_') || str;
  };

  const toKebabCase = (str: string) => {
    const cleanStr = removeAccents(str);
    return cleanStr
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      ?.map(x => x.toLowerCase())
      .join('-') || cleanStr.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const toAlternatingCase = (str: string) => {
    return str.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
  };

  const applyTransform = (type: string) => {
    if (!input) return;
    
    // Apply accent removal if option is enabled, unless it's a dedicated remove_accents action (redundant) or kebab (internal)
    const source = (stripAccents && type !== 'remove_accents' && type !== 'kebab') 
      ? removeAccents(input) 
      : input;
    
    let result = '';
    
    switch (type) {
      case 'upper':
        result = source.toUpperCase();
        break;
      case 'lower':
        result = source.toLowerCase();
        break;
      case 'title':
        result = toTitleCase(source);
        break;
      case 'sentence':
        result = toSentenceCase(source);
        break;
      case 'camel':
        result = toCamelCase(source);
        break;
      case 'pascal':
        result = toPascalCase(source);
        break;
      case 'snake':
        result = toSnakeCase(source);
        break;
      case 'kebab': // Slug - logic forces accent removal inside
        result = toKebabCase(source);
        break;
      case 'reverse':
        result = source.split('').reverse().join('');
        break;
      case 'alternating':
        result = toAlternatingCase(source);
        break;
      case 'remove_accents':
        result = removeAccents(source);
        break;
    }
    setOutput(result);
  };

  const actions = [
    { id: 'upper', label: 'UPPER CASE' },
    { id: 'lower', label: 'lower case' },
    { id: 'title', label: 'Title Case' },
    { id: 'sentence', label: 'Sentence case' },
    { id: 'camel', label: 'camelCase' },
    { id: 'pascal', label: 'PascalCase' },
    { id: 'snake', label: 'snake_case' },
    { id: 'kebab', label: 'slug-case' },
    { id: 'remove_accents', label: 'Remove Accents' },
    { id: 'alternating', label: 'aLtErNaTiNg' },
    { id: 'reverse', label: 'esreveR' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Type className="text-indigo-600" />
          Text Case Converter
        </h1>
        <p className="text-sm text-slate-500">{t('tools.textCaseConverter.pageDescription')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input */}
        <div className="lg:w-5/12 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.textCaseConverter.inputText')}</span>
              <button onClick={() => setInput('')} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs">
                <Trash2 size={14} /> Clear
              </button>
            </div>
            <CodeEditor 
              value={input} 
              onChange={setInput}
              placeholder="Type or paste text here to convert..."
            />
          </Card>
        </div>

        {/* Middle: Controls */}
        <div className="lg:w-2/12 flex flex-col gap-3 overflow-y-auto pr-1">
           <div className="text-xs font-bold text-slate-500 uppercase mb-1">{t('tools.textCaseConverter.transform')}</div>
           
           <label className="flex items-center gap-2 cursor-pointer mb-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors select-none">
              <input 
                type="checkbox" 
                checked={stripAccents} 
                onChange={e => setStripAccents(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{t('tools.textCaseConverter.autoRemoveAccents')}</span>
           </label>

           {actions.map(action => (
             <Button 
               key={action.id}
               variant="secondary" 
               size="sm"
               onClick={() => applyTransform(action.id)}
               className="w-full justify-start text-xs font-mono"
             >
               <div className="flex items-center gap-2 w-full">
                 <ArrowRight size={14} className="text-indigo-500 shrink-0" />
                 <span className="truncate">{action.label}</span>
               </div>
             </Button>
           ))}
           
           <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
           
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => {
                const temp = input;
                setInput(output);
                setOutput(temp);
             }}
             disabled={!input && !output}
             className="w-full gap-2 text-xs"
           >
             <ArrowLeftRight size={14} /> {t('tools.textCaseConverter.swapInputOutput')}
           </Button>
        </div>

        {/* Right: Output */}
        <div className="lg:w-5/12 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.textCaseConverter.convertedResult')}</span>
              <div className="flex gap-2">
                <button onClick={() => handleCopy()} className="text-slate-400 hover:text-indigo-500 flex items-center gap-1 text-xs">
                  <Copy size={14} /> Copy
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
               <CodeEditor 
                 value={output} 
                 onChange={() => {}} 
                 readOnly={true}
                 placeholder="Result will appear here..."
                 className="bg-transparent"
               />
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
