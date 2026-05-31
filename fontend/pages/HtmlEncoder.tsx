
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Code, ArrowRight, ArrowLeft, Copy, Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

type Mode = 'encode' | 'decode';

export const HtmlEncoder: React.FC = () => {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('html-encoder', {
    inputs: { text: input, mode },
    outputs: { result: output },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
      setOutput(saved.outputs.result || '');
      setMode(saved.inputs.mode || 'encode');
    }
  }, []);

  // Auto-save state
  useToolState('html-encoder', {
    inputs: { text: input, mode },
    outputs: { result: output },
  });

  useEffect(() => {
    handleProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode]);

  const handleProcess = () => {
    setError(null);
    if (!input) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        // Use RegExp constructors to avoid TSX parsing issues with />/g
        const encoded = input.replace(new RegExp('&', 'g'), '&amp;')
                             .replace(new RegExp('<', 'g'), '&lt;')
                             .replace(new RegExp('>', 'g'), '&gt;')
                             .replace(new RegExp('"', 'g'), '&quot;')
                             .replace(new RegExp("'", 'g'), '&#39;');
        setOutput(encoded);
      } else {
        // Use the browser's DOM parser to decode entities safely
        const txt = document.createElement("textarea");
        txt.innerHTML = input;
        setOutput(txt.value);
      }
    } catch (err: any) {
      setError("An unexpected error occurred during processing.");
      setOutput('');
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
          <Code className="text-indigo-600" />
          HTML Encoder / Decoder
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-slate-500">{t('tools.htmlEncoder.pageDescription')}</p>
          <Badge color="blue">Text Utility</Badge>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex mb-6 shadow-inner">
        <button
          onClick={() => {
            setMode('encode');
            setOutput('');
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'encode'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          {t('tools.htmlEncoder.encodeTab')}
        </button>
        <button
          onClick={() => {
            setMode('decode');
            setOutput('');
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'decode'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('tools.htmlEncoder.decodeTab')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left Pane: INPUT */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {mode === 'encode' ? 'Raw Text' : 'HTML Entities Input'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setInput('')} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <button onClick={() => copyToClipboard(input)} className="text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>
              </div>
            </div>

            <CodeEditor 
              value={input} 
              onChange={setInput}
              placeholder={mode === 'encode' ? "Type text with special chars like <div id='1'>..." : "Type text with entities like &lt;div&gt;..."}
            />
          </Card>
        </div>

        {/* Right Pane: OUTPUT */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {mode === 'encode' ? 'Escaped Output' : 'Unescaped Output'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(output)} className="text-slate-400 hover:text-indigo-500 flex items-center gap-1 text-xs">
                  <Copy size={14} /> {t('common.copy')}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
               {error ? (
                  <div className="p-4 text-red-500 text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {error}
                  </div>
               ) : (
                 <CodeEditor 
                   value={output} 
                   onChange={() => {}} 
                   readOnly={true}
                   placeholder="Result will appear here..."
                   className="bg-transparent"
                 />
               )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
