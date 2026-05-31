
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calculator, FileText, Type, Hash, 
  Database, Cpu, Trash2, Copy, AlignLeft,
  Pilcrow, MessageSquare, BoxSelect, GripHorizontal,
  Upload, Download
} from 'lucide-react';
import { Card } from '../components/UI';
import { CodeEditor } from '../components/CodeEditor';
import { useToast } from '../context/ToastContext';
import { useToolState } from '../lib/useToolState';

interface WordDensity {
  word: string;
  count: number;
  percent: string;
  relativeWidth: number; // 0-100 for progress bar
}

export const StringLengthCalculator: React.FC = () => {
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('analysis.txt');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    chars: 0,
    charsNoSpaces: 0,
    words: 0,
    lines: 0,
    sentences: 0,
    paragraphs: 0,
    spaces: 0,
    bytes: 0,
    tokens: 0
  });

  const [density, setDensity] = useState<WordDensity[]>([]);

  // Load saved state on mount
  const { loadState } = useToolState('string-length-calculator', {
    inputs: { text: input },
    outputs: { stats },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
    }
  }, []);

  // Auto-save state
  useToolState('string-length-calculator', {
    inputs: { text: input },
    outputs: { stats },
  });

  useEffect(() => {
    // 1. Basic Counts
    const chars = input.length;
    const charsNoSpaces = input.replace(/\s/g, '').length;
    const spaces = (input.match(/ /g) || []).length;
    
    // Words: Split by whitespace, filter empty
    const trimmed = input.trim();
    const wordsArr = trimmed ? trimmed.split(/\s+/) : [];
    const words = wordsArr.length;
    
    // Lines
    const lines = input ? input.split(/\r\n|\r|\n/).length : 0;

    // Sentences (Approximate: split by . ! ? followed by space or end of line)
    // This regex looks for punctuation followed by whitespace or EOF
    const sentences = input.split(/[.!?]+(\s|$)/).filter(s => s.trim().length > 0).length;

    // Paragraphs (Split by double newlines or single newlines that contain text)
    const paragraphs = input.split(/\n+/).filter(line => line.trim().length > 0).length;

    // Byte size (UTF-8)
    const bytes = new Blob([input]).size;

    // Token estimation
    const tokens = Math.ceil(chars / 4);

    setStats({ chars, charsNoSpaces, words, lines, sentences, paragraphs, spaces, bytes, tokens });

    // 2. Word Density Calculation
    if (!trimmed) {
      setDensity([]);
      return;
    }

    // Use Unicode property escapes \p{L} to match letters in any language (Vietnamese supported)
    // Convert to lowercase for case-insensitive counting
    const wordMatches = input.toLowerCase().match(/\p{L}+/gu) || [];
    
    const freqMap: Record<string, number> = {};
    let maxCount = 0;

    wordMatches.forEach(w => {
      freqMap[w] = (freqMap[w] || 0) + 1;
      if (freqMap[w] > maxCount) maxCount = freqMap[w];
    });

    const densityArr: WordDensity[] = Object.keys(freqMap)
      .map(word => ({
        word,
        count: freqMap[word],
        percent: ((freqMap[word] / wordMatches.length) * 100).toFixed(1) + '%',
        relativeWidth: (freqMap[word] / maxCount) * 100
      }))
      .sort((a, b) => b.count - a.count) // Sort desc
      .slice(0, 50); // Limit to top 50 for performance

    setDensity(densityArr);

  }, [input]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      setFileName(file.name);
      showToast(t('tools.chatToArticle.fileLoaded', { filename: file.name }));
    };
    reader.onerror = () => {
      showToast(t('tools.chatToArticle.saveFailed'), 'error');
    };
    reader.readAsText(file);
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleFileDownload = () => {
    if (!input) {
      showToast("Nothing to save", "error");
      return;
    }
    try {
      const blob = new Blob([input], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t('tools.chatToArticle.fileSaved'));
    } catch (error) {
      showToast("Failed to save file", "error");
    }
  };

  const formatBytes = (b: number) => {
    if (b === 0) return '0 B';
    const i = Math.floor(Math.log(b) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB'];
    return `${(b / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleCopy = () => {
    if(!input) return;
    navigator.clipboard.writeText(input);
    showToast(t('common.copiedToClipboard'));
  };

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card className="p-3 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
       <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="text-indigo-600" />
          String Length & Tokens
        </h1>
        <p className="text-sm text-slate-500">{t('tools.stringLengthCalculator.pageDescription')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left Column: Editor */}
        <div className="lg:w-1/2 flex flex-col lg:min-h-0 min-w-0">
           <Card className="h-[400px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase">Input Text</span>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-indigo-500" title="Upload File">
                    <Upload size={16} />
                  </button>
                  <button onClick={handleFileDownload} className="text-slate-400 hover:text-indigo-500" title="Save to File">
                    <Download size={16} />
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button onClick={() => setInput('')} className="text-slate-400 hover:text-red-500" title="Clear">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-500" title="Copy">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <CodeEditor 
                value={input}
                onChange={setInput}
                placeholder="Type content here or upload a file to analyze..."
              />
           </Card>
        </div>

        {/* Right Column: Stats & Density */}
        <div className="lg:w-1/2 flex flex-col lg:min-h-0 gap-6 overflow-hidden">
          
          {/* 1. Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             <StatCard 
               label="Characters" 
               value={stats.chars.toLocaleString()} 
               icon={Type} 
               color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
             />
             <StatCard 
               label="Words" 
               value={stats.words.toLocaleString()} 
               icon={FileText} 
               color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
             />
             <StatCard 
               label="Sentences" 
               value={stats.sentences.toLocaleString()} 
               icon={MessageSquare} 
               color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" 
             />
             <StatCard 
               label="Paragraphs" 
               value={stats.paragraphs.toLocaleString()} 
               icon={Pilcrow} 
               color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" 
             />
             <StatCard 
               label="Spaces" 
               value={stats.spaces.toLocaleString()} 
               icon={GripHorizontal} 
               color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" 
             />
             <StatCard 
               label="Tokens (GPT)" 
               value={'~' + stats.tokens.toLocaleString()} 
               icon={Cpu} 
               color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" 
             />
             <StatCard 
               label="Bytes (UTF-8)" 
               value={formatBytes(stats.bytes)} 
               icon={Database} 
               color="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" 
             />
             <StatCard 
               label="Lines" 
               value={stats.lines.toLocaleString()} 
               icon={AlignLeft} 
               color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" 
             />
             <StatCard 
               label="Chars (No Space)" 
               value={stats.charsNoSpaces.toLocaleString()} 
               icon={Hash} 
               color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
             />
          </div>

          {/* 2. Word Density */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                 <BoxSelect size={14} /> Word Density
               </span>
               <span className="text-xs text-slate-400">{density.length} unique words</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {density.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                  Enter text to analyze word frequency
                </div>
              ) : (
                <div className="space-y-2">
                  {density.map((item, idx) => (
                    <div key={idx} className="flex rounded-md overflow-hidden bg-indigo-500/10 dark:bg-indigo-900/20 h-9 relative">
                       {/* Progress Bar Background */}
                       <div 
                         className="absolute top-0 left-0 h-full bg-indigo-500 dark:bg-indigo-600 transition-all duration-300 opacity-20 dark:opacity-30" 
                         style={{ width: `${item.relativeWidth}%` }}
                       />
                       
                       {/* Content Overlay */}
                       <div className="relative w-full flex items-center justify-between px-3 z-10">
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-2">
                           {item.word}
                         </span>
                         <div className="flex items-center gap-3">
                           <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                             {item.percent}
                           </span>
                           <span className="bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded min-w-[24px] text-center">
                             {item.count}
                           </span>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
