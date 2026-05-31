
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Sparkles, Copy, AlignLeft, 
  Loader2, Globe, Settings2, Maximize2, Minimize2
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { LanguageSelect } from '../components/LanguageSelect';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { summarizeText } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

const MODES = [
  { id: 'shortest', label: 'Shortest Possible (Ngắn nhất)', desc: 'Extreme compression while retaining core meaning.' },
  { id: 'key_points', label: 'Key Points Only (Ý chính)', desc: 'Bullet points of the main ideas.' },
  { id: 'concise', label: 'Concise (Ngắn gọn, đủ ý)', desc: 'Balanced summary, no missing points, efficient wording.' },
  { id: 'detailed', label: 'Detailed (Đầy đủ, chi tiết)', desc: 'Comprehensive summary, removing only fluff/redundancy.' },
  { id: 'professional', label: 'Professional & Structured (Chuyên nghiệp, Dễ đọc)', desc: 'Title, clear layout, logical flow, easy to understand.' },
];

export const TextSummarizer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('vi');
  const [mode, setMode] = useState('concise');
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('text-summarizer', {
    inputs: { text: inputText, targetLang, mode },
    outputs: { summary },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputText(saved.inputs.text || '');
      setTargetLang(saved.inputs.targetLang || 'vi');
      setMode(saved.inputs.mode || 'concise');
      setSummary(saved.outputs.summary || '');
    }
  }, []);

  // Auto-save state
  useToolState('text-summarizer', {
    inputs: { text: inputText, targetLang, mode },
    outputs: { summary },
  }); 

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setSummary('');

    try {
      const text = await summarizeText(inputText, mode, targetLang);
      setSummary(text);
      if (text) showToast(t('tools.textSummarizer.successToast'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate summary.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    showToast(t('tools.textSummarizer.copyMarkdown'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlignLeft className="text-indigo-600" />
          AI Text Summarizer
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.textSummarizer.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0 gap-4">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.textSummarizer.inputText')}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setInputText('')}
                className="text-xs h-6"
              >
                Clear
              </Button>
            </div>
            <CodeEditor 
              value={inputText} 
              onChange={setInputText} 
              placeholder="Paste the text you want to summarize here..."
            />
          </Card>
          
          {/* Controls */}
          <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                    <Settings2 size={12} /> {t('tools.textSummarizer.mode')}
                  </label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    {MODES.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                    <Globe size={12} /> {t('tools.textSummarizer.outputLanguage')}
                  </label>
                  <LanguageSelect value={targetLang} onChange={setTargetLang} />
               </div>
            </div>

            <Button 
              onClick={handleSummarize} 
              disabled={!inputText || loading} 
              className="w-full gap-2 shadow-lg shadow-indigo-500/20 h-11"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? t('tools.textSummarizer.processing') : t('tools.textSummarizer.summarize')}
            </Button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[500px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                Result <Badge color="indigo">{mode}</Badge>
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsFullScreen(true)} disabled={!summary} className="gap-1 h-7 text-xs" title="Full Screen">
                  <Maximize2 size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!summary} className="gap-1 h-7 text-xs">
                  <Copy size={14} /> {t('tools.textSummarizer.copyMarkdown')}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-0 relative bg-white dark:bg-slate-900">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-slate-500 text-sm animate-pulse">{t('tools.textSummarizer.aiReading')}</p>
                </div>
              )}
              
              {!summary && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 p-6 text-center">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>{t('tools.textSummarizer.waitingForInput')}</p>
                </div>
              )}

              {summary && (
                <MarkdownRenderer className="p-6">{summary}</MarkdownRenderer>
              )}
            </div>
          </Card>
        </div>
      </div>
      {/* Full Screen Preview Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <AlignLeft className="text-indigo-600" size={20} />
              Summary Preview
            </h2>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} variant="secondary" className="gap-2">
                <Copy size={16} /> Copy
              </Button>
              <Button onClick={() => setIsFullScreen(false)} variant="secondary" className="gap-2">
                <Minimize2 size={16} /> Exit Full Screen
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
            <MarkdownRenderer>{summary}</MarkdownRenderer>
          </div>
        </div>
      )}
    </div>
  );
};
