
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Sparkles, Download, Upload, Copy, 
  Trash2, Eye, Edit3, Loader2, Save, Maximize2, Minimize2
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/UI';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { formatMarkdown } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

export const MarkdownViewer: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('# Hello World\n\nStart writing or upload a file...');
  const [fileName, setFileName] = useState('document.md');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for Scroll Sync
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('markdown-viewer', {
    inputs: { markdown, activeTab },
    outputs: {},
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setMarkdown(saved.inputs.markdown || '# Hello World\n\nStart writing or upload a file...');
      setActiveTab(saved.inputs.activeTab || 'editor');
    }
  }, []);

  // Auto-save state
  useToolState('markdown-viewer', {
    inputs: { markdown, activeTab },
    outputs: {},
  }); 

  // --- Scroll Synchronization Logic ---
  
  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!previewRef.current || !editorRef.current) return;
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    
    // Apply to preview
    if (previewRef.current) {
       previewRef.current.scrollTop = scrollPercentage * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    }
    
    setTimeout(() => isScrolling.current = false, 50);
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!previewRef.current || !editorRef.current) return;
    if (isScrolling.current) return;

    isScrolling.current = true;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

    // Apply to editor
    if (editorRef.current) {
      editorRef.current.scrollTop = scrollPercentage * (editorRef.current.scrollHeight - editorRef.current.clientHeight);
    }

    setTimeout(() => isScrolling.current = false, 50);
  };

  // --- File I/O ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setMarkdown(ev.target?.result as string);
      setFileName(file.name);
      showToast(t('tools.chatToArticle.fileLoaded', { filename: file.name }));
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleDownload = () => {
    if (!markdown) return;
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t('tools.chatToArticle.fileSaved'));
    } catch (error) {
      showToast(t('tools.chatToArticle.saveFailed'), 'error');
    }
  };

  // --- AI Formatting ---

  const handleAiFormat = async () => {
    if (!markdown.trim()) return;

    setLoading(true);
    try {
      const text = await formatMarkdown(markdown);
      if (text) {
        setMarkdown(text);
        showToast(t('tools.markdownViewer.formatted'), 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to format markdown.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="text-indigo-600" />
          Markdown Viewer & Editor
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.markdownViewer.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Editor */}
        <div className={`lg:w-1/2 flex flex-col gap-4 lg:min-h-0 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".md,.txt,.markdown"
                onChange={handleFileUpload} 
              />
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Upload">
                <Upload size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} title="Save File">
                <Save size={16} />
              </Button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} title="Copy Raw">
                <Copy size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMarkdown('')} className="text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>

            <Button 
              size="sm" 
              onClick={handleAiFormat} 
              disabled={loading || !markdown}
              className="gap-2 shadow-sm"
              variant="secondary"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              {loading ? 'Formatting...' : 'Auto Format'}
            </Button>
          </div>

          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors h-[500px] lg:h-auto">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <span className="text-xs font-semibold text-slate-500 uppercase">Markdown Source</span>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filename:</span>
                  <Input 
                    className="h-6 w-32 text-xs py-0 px-2" 
                    value={fileName} 
                    onChange={e => setFileName(e.target.value)}
                  />
               </div>
             </div>
             <CodeEditor 
               value={markdown} 
               onChange={setMarkdown} 
               placeholder="# Start typing markdown..."
               textareaRef={editorRef}
               onScroll={handleEditorScroll}
             />
          </Card>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('editor')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
           >
             Editor
           </button>
           <button 
             onClick={() => setActiveTab('preview')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
           >
             Preview
           </button>
        </div>

        {/* Right: Preview */}
        <div className={`lg:w-1/2 flex flex-col lg:min-h-0 min-w-0 ${activeTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
           <Card className="h-[500px] lg:h-full flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center h-[52px]">
               <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                 <Eye size={14} /> Live Preview
               </span>
               <button 
                 onClick={() => setIsFullScreen(true)}
                 className="text-slate-400 hover:text-indigo-500 transition-colors"
                 title="Full Screen Preview"
               >
                 <Maximize2 size={16} />
               </button>
             </div>
             
             <div className="flex-1 overflow-hidden relative flex flex-col p-8 bg-white dark:bg-slate-900">
               <MarkdownRenderer scrollRef={previewRef} onScroll={handlePreviewScroll} className="h-full">{markdown}</MarkdownRenderer>
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
              Full Screen Preview
            </h2>
            <div className="flex items-center gap-4">
               <span className="text-sm text-slate-500">{fileName}</span>
               <Button onClick={() => setIsFullScreen(false)} variant="secondary" className="gap-2">
                 <Minimize2 size={16} /> {t('tools.htmlViewer.exitFullScreen')}
               </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
            <MarkdownRenderer scrollRef={previewRef} onScroll={handlePreviewScroll}>{markdown}</MarkdownRenderer>
          </div>
        </div>
      )}
    </div>
  );
};
