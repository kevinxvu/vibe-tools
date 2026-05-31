
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic, Upload, FileAudio,
  Loader2, Check, Download, Copy, Languages, FileJson, FileType, Subtitles
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { LanguageSelect } from '../components/LanguageSelect';
import { transcribeAudio, type TranscribeFormat } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

const OUTPUT_FORMATS = [
  { id: 'text', label: 'Plain Text', icon: FileType, desc: 'Just the transcript content' },
  { id: 'json', label: 'JSON', icon: FileJson, desc: 'Structured data with timestamps' },
  { id: 'srt', label: 'SRT (Subtitles)', icon: Subtitles, desc: 'Standard subtitle format' },
];

export const AiTranscriber: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [inputLang, setInputLang] = useState('auto');
  const [outputLang, setOutputLang] = useState('vi');
  const [format, setFormat] = useState('text');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('ai-transcriber', {
    inputs: { inputLang, outputLang, format },
    outputs: { result },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputLang(saved.inputs.inputLang || 'auto');
      setOutputLang(saved.inputs.outputLang || 'vi');
      setFormat(saved.inputs.format || 'text');
      setResult(saved.outputs.result || '');
    }
  }, []);

  // Auto-save state
  useToolState('ai-transcriber', {
    inputs: { inputLang, outputLang, format },
    outputs: { result },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // REDUCED LIMIT: 9.5MB to stay safely under proxy limits (usually 10MB)
      // Base64 overhead adds ~33%, so 9.5MB file -> ~12.6MB payload.
      // If the proxy limit is strictly 10MB payload, we need to limit file to ~7MB.
      // Let's set it to 9MB for safety.
      const maxSizeBytes = 9 * 1024 * 1024;

      if (selectedFile.size > maxSizeBytes) {
        showToast(t('tools.aiTranscriber.fileTooLarge'), 'error');
        return;
      }

      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setResult('');
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setLoading(true);
    setResult('');

    try {
      const content = await transcribeAudio({
        file,
        input_lang: inputLang,
        output_lang: outputLang,
        format: format as TranscribeFormat,
      });

      setResult(content);
      showToast(t('tools.aiTranscriber.successToast'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to process file.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const extension = format === 'json' ? 'json' : format === 'srt' ? 'srt' : 'txt';
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Mic className="text-indigo-600" />
          AI Transcriber
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.aiTranscriber.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">

        {/* Left: Input & Settings */}
        <div className="lg:w-5/12 flex flex-col gap-4">
          <Card className="p-0 overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-900/50">
            <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              {file ? (
                <div className="w-full text-center">
                  {file.type.startsWith('video') ? (
                    <video src={filePreview!} controls className="max-h-[200px] mx-auto rounded-lg mb-4 w-full bg-black" />
                  ) : (
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                      <FileAudio size={32} />
                    </div>
                  )}
                  <p className="font-medium text-slate-900 dark:text-white truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-xs text-slate-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <Button variant="secondary" size="sm" onClick={() => setFile(null)}>{t('tools.aiTranscriber.changeFile')}</Button>
                </div>
              ) : (
                <>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('tools.aiTranscriber.uploadAudioVideo')}</h3>
                  <p className="text-slate-500 text-sm mb-4 text-center max-w-xs">
                    {t('tools.aiTranscriber.supportsFormats')} <br />
                    <span className="text-xs text-amber-500">{t('tools.aiTranscriber.maxSize')}</span>
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>{t('tools.aiTranscriber.browseFiles')}</Button>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
            </div>
          </Card>

          <Card className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <Languages size={12} /> {t('tools.aiTranscriber.inputLanguage')}
                </label>
                <LanguageSelect value={inputLang} onChange={setInputLang} includeAuto />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <Languages size={12} /> {t('tools.aiTranscriber.outputLanguage')}
                </label>
                <LanguageSelect value={outputLang} onChange={setOutputLang} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">{t('tools.aiTranscriber.outputFormat')}</label>
              <div className="grid grid-cols-3 gap-2">
                {OUTPUT_FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${format === f.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                      }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <f.icon size={20} />
                    </div>
                    <div className="text-xs font-bold text-center">{f.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleTranscribe}
              disabled={!file || loading}
              className="w-full h-11 gap-2 shadow-lg shadow-indigo-500/20 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              {loading ? 'Transcribing...' : t('tools.aiTranscriber.startTranscription')}
            </Button>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                Result {result && <Badge color="green">{t('tools.aiTranscriber.done')}</Badge>}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!result} className="gap-1 h-8 text-xs">
                  <Download size={14} /> {t('tools.aiTranscriber.download')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!result} className="gap-1 h-8 text-xs">
                  <Copy size={14} /> {t('tools.aiTranscriber.copy')}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-slate-500 text-sm animate-pulse">{t('tools.aiTranscriber.processing')}</p>
                </div>
              )}

              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                  <Subtitles size={48} className="mb-4 opacity-20" />
                  <p>{t('tools.aiTranscriber.waitingForInput')}</p>
                </div>
              )}

              {result && (
                <CodeEditor
                  value={result}
                  onChange={() => { }}
                  readOnly={true}
                  className="border-0"
                />
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
