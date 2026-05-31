
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, Sparkles, Copy, FileText, 
  Loader2, Eye, Edit3, Globe,
  Upload, Download, Maximize2, Minimize2, Trash2
} from 'lucide-react';
import { Button, Card } from '../components/UI';
import { LanguageSelect } from '../components/LanguageSelect';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { chatToArticle } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

export const ChatToArticle: React.FC = () => {
  const [inputChat, setInputChat] = useState('');
  const [outputArticle, setOutputArticle] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [targetLang, setTargetLang] = useState('vi');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('chat-to-article', {
    inputs: { inputChat, targetLang },
    outputs: { outputArticle },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputChat(saved.inputs.inputChat || '');
      setTargetLang(saved.inputs.targetLang || 'vi');
      setOutputArticle(saved.outputs.outputArticle || '');
    }
  }, []);

  // Auto-save state
  useToolState('chat-to-article', {
    inputs: { inputChat, targetLang },
    outputs: { outputArticle },
  }); 

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setInputChat(ev.target?.result as string);
      showToast(t('tools.chatToArticle.fileLoaded', { filename: file.name }));
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleDownload = () => {
    if (!outputArticle) return;
    try {
      const blob = new Blob([outputArticle], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'article.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t('tools.chatToArticle.fileSaved'));
    } catch (error) {
      showToast(t('tools.chatToArticle.saveFailed'), 'error');
    }
  };

  const handleGenerate = async () => {
    if (!inputChat.trim()) return;

    setLoading(true);
    setActiveTab('write');

    try {
      const text = await chatToArticle({
        chat_log: inputChat,
        target_lang: targetLang,
      });

      setOutputArticle(text);
      if (text) {
        showToast(t('tools.chatToArticle.articleGenerated'), 'success');
        setActiveTab('preview');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate article.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputArticle) return;
    navigator.clipboard.writeText(outputArticle);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="text-indigo-600" />
          Chat to Article
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.chatToArticle.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input Chat */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0 gap-4">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.chatToArticle.inputChatLog')}</span>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt,.md,.log" 
                  onChange={handleFileUpload}
                />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs h-6 gap-1">
                  <Upload size={12} /> {t('common.upload')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setInputChat('')}
                  className="text-xs h-6 text-red-500 hover:text-red-600"
                >
                  <Trash2 size={12} /> {t('common.clear')}
                </Button>
              </div>
            </div>
            <CodeEditor 
              value={inputChat} 
              onChange={setInputChat} 
              placeholder="User: How do I center a div?&#10;AI: You can use Flexbox...&#10;User: That didn't work...&#10;AI: Ah, try Grid instead..."
            />
          </Card>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <Globe size={12} /> {t('tools.chatToArticle.outputLanguage')}
              </label>
              <LanguageSelect value={targetLang} onChange={setTargetLang} className="w-full sm:w-56" />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={!inputChat || loading} 
              className="w-full sm:w-auto gap-2 shadow-lg shadow-indigo-500/20 h-10"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? t('tools.chatToArticle.synthesizing') : t('tools.chatToArticle.generateArticle')}
            </Button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[500px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                 <button 
                   onClick={() => setActiveTab('write')}
                   className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${activeTab === 'write' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   <Edit3 size={12} /> Editor
                 </button>
                 <button 
                   onClick={() => setActiveTab('preview')}
                   className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   <Eye size={12} /> Preview
                 </button>
              </div>
              
              <div className="flex gap-2">
                {activeTab === 'preview' && (
                  <Button size="sm" variant="ghost" onClick={() => setIsFullScreen(true)} disabled={!outputArticle} className="gap-1 h-7 text-xs" title="Full Screen">
                    <Maximize2 size={14} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleDownload} disabled={!outputArticle} className="gap-1 h-7 text-xs" title="Download Markdown">
                  <Download size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!outputArticle} className="gap-1 h-7 text-xs" title="Copy to Clipboard">
                  <Copy size={14} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-slate-500 text-sm animate-pulse">{t('tools.chatToArticle.analyzing')}</p>
                </div>
              )}
              
              {!outputArticle && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 p-6 text-center">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>{t('tools.chatToArticle.waitingForInput')}</p>
                </div>
              )}

              {outputArticle && (
                activeTab === 'write' ? (
                  <CodeEditor 
                    value={outputArticle} 
                    onChange={setOutputArticle} 
                    className="border-0"
                  />
                ) : (
                  <MarkdownRenderer className="p-6 h-full">{outputArticle}</MarkdownRenderer>
                )
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
              <Eye className="text-indigo-600" size={20} />
              Article Preview
            </h2>
            <div className="flex items-center gap-2">
               <Button onClick={handleDownload} variant="secondary" className="gap-2">
                 <Download size={16} /> Download
               </Button>
               <Button onClick={() => setIsFullScreen(false)} variant="secondary" className="gap-2">
                 <Minimize2 size={16} /> Exit Full Screen
               </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
            <MarkdownRenderer>{outputArticle}</MarkdownRenderer>
          </div>
        </div>
      )}
    </div>
  );
};
