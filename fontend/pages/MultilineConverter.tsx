
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser, ArrowDown, Copy, Trash2, ArrowRight, Settings2, Sliders } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

type OutputMode = 'join' | 'multiline';
type Separator = 'space' | 'comma' | 'commaSpace' | 'semi' | 'none' | 'custom';

export const MultilineConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  // -- Options --
  const [outputMode, setOutputMode] = useState<OutputMode>('multiline');
  
  // Cleaning (Line Level)
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [trimLines, setTrimLines] = useState(false);
  const [filterContaining, setFilterContaining] = useState('');

  // Cleaning (Char Level)
  const [removeAccents, setRemoveAccents] = useState(false);
  const [removePunctuation, setRemovePunctuation] = useState(false);
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState(false);
  const [removeAllWhitespace, setRemoveAllWhitespace] = useState(false);

  // Formatting (Join)
  const [separator, setSeparator] = useState<Separator>('space');
  const [customSeparator, setCustomSeparator] = useState(' | ');
  const [quoteResult, setQuoteResult] = useState(false);

  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('multiline-converter', {
    inputs: { text: input, outputMode, removeEmpty, removeDuplicates, trimLines, filterContaining, removeAccents, removePunctuation, removeExtraSpaces, removeAllWhitespace, separator, customSeparator, quoteResult },
    outputs: { result: output },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
      setOutputMode(saved.inputs.outputMode || 'multiline');
      setRemoveEmpty(saved.inputs.removeEmpty ?? false);
      setRemoveDuplicates(saved.inputs.removeDuplicates ?? false);
      setTrimLines(saved.inputs.trimLines ?? false);
      setFilterContaining(saved.inputs.filterContaining || '');
      setRemoveAccents(saved.inputs.removeAccents ?? false);
      setRemovePunctuation(saved.inputs.removePunctuation ?? false);
      setRemoveExtraSpaces(saved.inputs.removeExtraSpaces ?? false);
      setRemoveAllWhitespace(saved.inputs.removeAllWhitespace ?? false);
      setSeparator(saved.inputs.separator || 'space');
      setCustomSeparator(saved.inputs.customSeparator || ' | ');
      setQuoteResult(saved.inputs.quoteResult ?? false);
    }
  }, []);

  // Auto-save state
  useToolState('multiline-converter', {
    inputs: { text: input, outputMode, removeEmpty, removeDuplicates, trimLines, filterContaining, removeAccents, removePunctuation, removeExtraSpaces, removeAllWhitespace, separator, customSeparator, quoteResult },
    outputs: { result: output },
  });

  useEffect(() => {
    processText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    input, outputMode, 
    removeEmpty, removeDuplicates, trimLines, filterContaining,
    removeAccents, removePunctuation, removeExtraSpaces, removeAllWhitespace,
    separator, customSeparator, quoteResult
  ]);

  const processText = () => {
    if (!input) {
      setOutput('');
      return;
    }

    // 1. Split to lines
    let lines = input.split(/\r?\n/);

    // 2. Line Level Operations
    if (trimLines) {
      lines = lines.map(l => l.trim());
    }

    if (removeEmpty) {
      lines = lines.filter(l => l.length > 0);
    }

    if (removeDuplicates) {
      lines = Array.from(new Set(lines));
    }

    if (filterContaining) {
      const term = filterContaining.toLowerCase();
      // Remove lines that CONTAIN the term
      lines = lines.filter(l => !l.toLowerCase().includes(term));
    }

    // 3. Character Level Operations (Map per line)
    lines = lines.map(line => {
      let l = line;
      
      if (removeAccents) {
        l = l.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      
      if (removePunctuation) {
        // Remove common punctuation marks
        l = l.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g,"");
      }

      if (removeAllWhitespace) {
        l = l.replace(/\s/g, '');
      } else if (removeExtraSpaces) {
        // Replace multiple spaces with single space
        l = l.replace(/\s+/g, ' ');
      }

      return l;
    });

    // 4. Output Formatting
    let result = '';

    if (outputMode === 'multiline') {
      result = lines.join('\n');
    } else {
      // JOIN Mode
      let joinChar = '';
      switch (separator) {
        case 'space': joinChar = ' '; break;
        case 'comma': joinChar = ','; break;
        case 'commaSpace': joinChar = ', '; break;
        case 'semi': joinChar = '; '; break;
        case 'none': joinChar = ''; break;
        case 'custom': joinChar = customSeparator; break;
      }
      result = lines.join(joinChar);
    }

    if (quoteResult && result.length > 0) {
      result = `"${result}"`;
    }

    setOutput(result);
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    showToast(t('common.copiedToClipboard'));
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const CheckboxOption = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={e => onChange(e.target.checked)}
        className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800"
      />
      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{label}</span>
    </label>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Eraser className="text-indigo-600" />
          Text Cleaner & Formatter
        </h1>
        <p className="text-sm text-slate-500">{t('tools.multilineConverter.pageDescription')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input */}
        <div className="lg:w-5/12 flex flex-col lg:min-h-0 gap-4">
           <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <span className="text-xs font-semibold text-slate-500 uppercase">Input Text</span>
               <button onClick={handleClear} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs">
                 <Trash2 size={14} /> Clear
               </button>
             </div>
             <CodeEditor 
               value={input} 
               onChange={setInput} 
               placeholder="Paste text here to clean..." 
             />
           </Card>
        </div>

        {/* Middle: Controls */}
        <div className="lg:w-2/12 flex flex-col gap-4 overflow-y-auto">
           {/* Output Mode Switch */}
           <Card className="p-3">
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                <Settings2 size={12}/> Output Mode
             </label>
             <div className="flex flex-col gap-1">
               <button 
                 onClick={() => setOutputMode('multiline')}
                 className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${outputMode === 'multiline' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 Keep Lines
               </button>
               <button 
                 onClick={() => setOutputMode('join')}
                 className={`px-3 py-2 text-sm text-left rounded-lg transition-colors ${outputMode === 'join' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 Join Lines
               </button>
             </div>
           </Card>

           {/* Filters */}
           <Card className="p-3 flex-1 flex flex-col gap-4">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-1">
                  <Sliders size={12}/> Line Filters
               </label>
               <div className="flex flex-col gap-2">
                 <CheckboxOption label="Trim Whitespace" checked={trimLines} onChange={setTrimLines} />
                 <CheckboxOption label="Remove Empty Lines" checked={removeEmpty} onChange={setRemoveEmpty} />
                 <CheckboxOption label="Remove Duplicates" checked={removeDuplicates} onChange={setRemoveDuplicates} />
                 <div className="pt-1">
                    <Input 
                      placeholder="Remove lines containing..." 
                      className="h-8 text-xs" 
                      value={filterContaining} 
                      onChange={e => setFilterContaining(e.target.value)}
                    />
                 </div>
               </div>
             </div>

             <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
               <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Characters</label>
               <div className="flex flex-col gap-2">
                 <CheckboxOption label="Remove Accents" checked={removeAccents} onChange={setRemoveAccents} />
                 <CheckboxOption label="Remove Punctuation" checked={removePunctuation} onChange={setRemovePunctuation} />
                 <CheckboxOption label="Remove Extra Spaces" checked={removeExtraSpaces} onChange={setRemoveExtraSpaces} />
                 <CheckboxOption label="Remove All Whitespace" checked={removeAllWhitespace} onChange={setRemoveAllWhitespace} />
               </div>
             </div>

             {outputMode === 'join' && (
               <div className="border-t border-slate-100 dark:border-slate-800 pt-3 animate-in fade-in slide-in-from-top-2">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Join Options</label>
                 <select 
                    className="w-full h-8 px-2 rounded border bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-xs outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value as Separator)}
                 >
                   <option value="space">Space ( )</option>
                   <option value="comma">Comma (,)</option>
                   <option value="commaSpace">Comma + Space (, )</option>
                   <option value="semi">Semicolon (; )</option>
                   <option value="none">None</option>
                   <option value="custom">Custom...</option>
                 </select>
                 {separator === 'custom' && (
                   <Input 
                     className="h-8 text-xs mb-2"
                     placeholder="Separator..."
                     value={customSeparator}
                     onChange={(e) => setCustomSeparator(e.target.value)}
                   />
                 )}
                 <CheckboxOption label='Quote Result ("")' checked={quoteResult} onChange={setQuoteResult} />
               </div>
             )}
           </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:w-5/12 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                 Result 
                 <Badge color={outputMode === 'join' ? 'orange' : 'blue'}>
                   {outputMode === 'join' ? 'Single Line' : 'Multi Line'}
                 </Badge>
              </span>
              <Button size="sm" variant="secondary" onClick={copyToClipboard} disabled={!output} className="h-7 text-xs gap-1">
                <Copy size={12} /> Copy
              </Button>
            </div>
            <CodeEditor 
              value={output} 
              onChange={() => {}} 
              placeholder="Cleaned result will appear here..."
              readOnly={true}
              className="bg-transparent"
            />
          </Card>
        </div>

      </div>
    </div>
  );
};
