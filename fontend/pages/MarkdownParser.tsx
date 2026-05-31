
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileDown, Copy, Check, Globe, FileText, Code2,
  Loader2, Maximize2, Minimize2, Upload, Link, AlignLeft,
  Sparkles, X
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { parseMarkdownFromText, parseMarkdownFromUrl, parseMarkdownFromFile } from '../lib/services/markdownParserService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';


type InputMode = 'text' | 'url' | 'file';

const ACCEPTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/pdf',
  'text/html',
  'text/plain',
  'text/csv',
  'application/rtf',
];

const ACCEPTED_EXTENSIONS = '.doc,.docx,.xls,.xlsx,.pdf,.html,.htm,.txt,.csv,.rtf';

const MODE_CONFIGS: Record<InputMode, { icon: React.ReactNode; color: string; badgeColor: string }> = {
  text: {
    icon: <Code2 size={16} />,
    color: 'text-indigo-600 dark:text-indigo-400',
    badgeColor: 'indigo',
  },
  url: {
    icon: <Globe size={16} />,
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeColor: 'emerald',
  },
  file: {
    icon: <FileText size={16} />,
    color: 'text-orange-600 dark:text-orange-400',
    badgeColor: 'orange',
  },
};

export const MarkdownParser: React.FC = () => {
  const [mode, setMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();



  const isInputReady = () => {
    if (mode === 'text') return textInput.trim().length > 0;
    if (mode === 'url') return urlInput.trim().length > 0;
    if (mode === 'file') return uploadedFile !== null;
    return false;
  };

  const handleParse = async () => {
    if (!isInputReady()) return;

    setLoading(true);
    setResult('');

    try {
      let markdown = '';

      if (mode === 'text') {
        markdown = await parseMarkdownFromText(textInput);
      } else if (mode === 'url') {
        markdown = await parseMarkdownFromUrl(urlInput);
      } else if (mode === 'file' && uploadedFile) {
        markdown = await parseMarkdownFromFile(uploadedFile);
      }

      setResult(markdown);
      if (markdown) showToast(t('tools.markdownParser.successToast'), 'success');
    } catch (err: any) {
      showToast(err.message || t('tools.markdownParser.failedToast'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    showToast(t('tools.markdownParser.copiedToast'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parsed-output.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('tools.markdownParser.downloadedToast'), 'success');
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      showToast(t('tools.markdownParser.fileTooLarge'), 'error');
      return;
    }
    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['docx', 'doc'].includes(ext || '')) return '📄';
    if (['xlsx', 'xls'].includes(ext || '')) return '📊';
    if (ext === 'pdf') return '📕';
    if (['html', 'htm'].includes(ext || '')) return '🌐';
    if (ext === 'csv') return '📋';
    return '📁';
  };

  const modeConfig = MODE_CONFIGS[mode];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-indigo-600" />
          {t('tools.markdownParser.pageTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('tools.markdownParser.pageDescription')}
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">

        {/* ── Left: Input Panel ── */}
        <div className="lg:w-[46%] flex flex-col gap-4 lg:min-h-0">

          {/* Mode Selector */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['text', 'url', 'file'] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {MODE_CONFIGS[m].icon}
                <span className="hidden sm:inline">{t(`tools.markdownParser.mode_${m}`)}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors lg:min-h-0">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className={`text-xs font-semibold uppercase flex items-center gap-1.5 ${modeConfig.color}`}>
                {modeConfig.icon}
                {t(`tools.markdownParser.inputLabel_${mode}`)}
              </span>
              {mode === 'text' && textInput && (
                <Button variant="ghost" size="sm" onClick={() => setTextInput('')} className="text-xs h-6">
                  {t('common.clear')}
                </Button>
              )}
              {mode === 'url' && urlInput && (
                <Button variant="ghost" size="sm" onClick={() => setUrlInput('')} className="text-xs h-6">
                  {t('common.clear')}
                </Button>
              )}
            </div>

            {/* Text / HTML Mode */}
            {mode === 'text' && (
              <div className="h-[300px] lg:h-auto lg:flex-1 lg:min-h-0">
                <CodeEditor
                  value={textInput}
                  onChange={setTextInput}
                  placeholder={t('tools.markdownParser.textPlaceholder')}
                />
              </div>
            )}

            {/* URL Mode */}
            {mode === 'url' && (
              <div className="flex-1 flex flex-col p-6 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Link size={12} /> {t('tools.markdownParser.urlLabel')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                      placeholder="https://example.com/article"
                      className="flex-1 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('tools.markdownParser.urlHintTitle')}</p>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
                    <li>{t('tools.markdownParser.urlHint1')}</li>
                    <li>{t('tools.markdownParser.urlHint2')}</li>
                    <li>{t('tools.markdownParser.urlHint3')}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* File Mode */}
            {mode === 'file' && (
              <div className="flex-1 flex flex-col p-6 gap-4">
                {!uploadedFile ? (
                  <div
                    className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/5'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Upload size={28} className={isDragging ? 'text-orange-500' : 'text-slate-400'} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('tools.markdownParser.dropFileHere')}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{t('tools.markdownParser.orClickToBrowse')}</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 max-w-xs">
                      {['DOC', 'DOCX', 'XLS', 'XLSX', 'PDF', 'HTML', 'TXT', 'CSV'].map(ext => (
                        <span key={ext} className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {ext}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">{t('tools.markdownParser.maxFileSize')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
                      <span className="text-3xl">{getFileIcon(uploadedFile.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFile}
                        className="text-slate-400 hover:text-red-500 h-8 w-8 p-0 flex-shrink-0"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline text-center"
                    >
                      {t('tools.markdownParser.changeFile')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Parse Button */}
          <Button
            onClick={handleParse}
            disabled={!isInputReady() || loading}
            className={`w-full gap-2 h-11 shadow-lg font-semibold transition-all ${
              mode === 'text' ? 'shadow-indigo-500/20' :
              mode === 'url' ? 'shadow-emerald-500/20' :
              'shadow-orange-500/20'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? t('tools.markdownParser.parsing') : t('tools.markdownParser.parseBtn')}
          </Button>
        </div>

        {/* ── Right: Output Panel ── */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[500px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            {/* Output toolbar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.markdownParser.outputLabel')}</span>
                {result && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        activeTab === 'preview'
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {t('tools.markdownParser.previewTab')}
                    </button>
                    <button
                      onClick={() => setActiveTab('source')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        activeTab === 'source'
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {t('tools.markdownParser.sourceTab')}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setIsFullScreen(true)} disabled={!result} className="gap-1 h-7 text-xs" title="Full Screen">
                  <Maximize2 size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDownload} disabled={!result} className="gap-1 h-7 text-xs">
                  <FileDown size={14} />
                  <span className="hidden sm:inline">{t('tools.markdownParser.download')}</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!result} className="gap-1 h-7 text-xs">
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copied ? t('tools.markdownParser.copied') : t('tools.markdownParser.copy')}</span>
                </Button>
              </div>
            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-auto relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader2 className="animate-spin text-indigo-500 mb-3" size={36} />
                  </div>
                  <p className="text-slate-500 text-sm animate-pulse font-medium">{t('tools.markdownParser.processingHint')}</p>
                </div>
              )}

              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 p-6 text-center">
                  <AlignLeft size={48} className="mb-4 opacity-20" />
                  <p className="text-sm">{t('tools.markdownParser.waitingForInput')}</p>
                  <p className="text-xs mt-1 text-slate-400">{t('tools.markdownParser.waitingHint')}</p>
                </div>
              )}

              {result && activeTab === 'preview' && (
                <MarkdownRenderer className="p-6">{result}</MarkdownRenderer>
              )}

              {result && activeTab === 'source' && (
                <div className="h-full">
                  <CodeEditor value={result} onChange={setResult} />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Sparkles className="text-indigo-600" size={20} />
              {t('tools.markdownParser.fullScreenTitle')}
            </h2>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} variant="secondary" className="gap-2">
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {t('tools.markdownParser.copy')}
              </Button>
              <Button onClick={handleDownload} variant="secondary" className="gap-2">
                <FileDown size={16} />
                {t('tools.markdownParser.download')}
              </Button>
              <Button onClick={() => setIsFullScreen(false)} variant="secondary" className="gap-2">
                <Minimize2 size={16} />
                {t('tools.markdownParser.exitFullScreen')}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
            <MarkdownRenderer>{result}</MarkdownRenderer>
          </div>
        </div>
      )}
    </div>
  );
};
