
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanText, Upload, Image as ImageIcon, Copy, 
  Loader2, Check, X, FileJson, FileType, FileCode
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { ocrExtract } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { useToolState } from '../lib/useToolState';

type OutputFormat = 'text' | 'markdown' | 'html' | 'json';

export const OcrTool: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<OutputFormat>('text');
  const [dragActive, setDragActive] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  // Load saved state on mount
  const { loadState } = useToolState('ocr-tool', {
    inputs: { format },
    outputs: { result },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setFormat(saved.inputs.format || 'text');
      setResult(saved.outputs.result || '');
    }
  }, []);

  // Auto-save state
  useToolState('ocr-tool', {
    inputs: { format },
    outputs: { result },
  });
  
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const file = new File([blob], 'pasted-image.png', { type: blob.type });
          const reader = new FileReader();
          reader.onload = (event) => {
             setImage(event.target?.result as string);
             setImageFile(file);
             setResult('');
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processImage = async () => {
    if (!imageFile) return;

    setLoading(true);
    setResult('');

    try {
      const text = await ocrExtract(imageFile, format);
      setResult(text || 'No text detected.');
      showToast(t('tools.ocrTool.textExtracted'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to process image.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImage(ev.target?.result as string);
          setImageFile(file);
          setResult('');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setImageFile(file);
        setResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ScanText className="text-indigo-600" />
          AI OCR Scanner
        </h1>
        <p className="text-sm text-slate-500">{t('tools.ocrTool.pageDescription')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input */}
        <div className="lg:flex-1 flex flex-col gap-4">
          <div 
            className={`h-[300px] lg:flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {image ? (
              <div 
                className="relative w-full h-full flex items-center justify-center bg-slate-100 dark:bg-black/40 rounded-lg overflow-hidden group cursor-zoom-in"
                onClick={() => setIsPreviewOpen(true)}
              >
                <img 
                  src={image} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" 
                />
                
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <span className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">Click to Expand</span>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); setImage(null); setImageFile(null); setResult(''); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
                  title="Remove Image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {t('tools.ocrTool.uploadImage')}
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  Drag & drop here, or <span className="text-indigo-500 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>browse files</span>
                  <br/>
                  <span className="text-xs opacity-70">(You can also Ctrl+V to paste)</span>
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          <Card className="p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Format:</span>
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                 {(['text', 'markdown', 'json'] as OutputFormat[]).map((f) => (
                   <button
                     key={f}
                     onClick={() => setFormat(f)}
                     className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize flex items-center gap-1 transition-all ${format === f ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                   >
                     {f === 'text' && <FileType size={12} />}
                     {f === 'markdown' && <FileCode size={12} />}
                     {f === 'json' && <FileJson size={12} />}
                     {f}
                   </button>
                 ))}
               </div>
            </div>
            
            <Button 
              onClick={processImage} 
              disabled={!image || loading} 
              className="w-full sm:w-auto gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ScanText size={18} />}
              {loading ? t('tools.ocrTool.processing') : t('tools.ocrTool.extractText')}
            </Button>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[400px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-black/20">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.ocrTool.extractionResult')}</span>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 disabled={!result}
                 onClick={handleCopy}
                 className="h-8 gap-1"
               >
                 <Copy size={14} /> {t('common.copy')}
               </Button>
            </div>
            <div className="flex-1 overflow-auto p-4 relative">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-sm text-slate-500 font-medium">{t('tools.ocrTool.analyzing')}</p>
                </div>
              ) : null}

              {result ? (
                 <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 dark:text-slate-300">
                   {result}
                 </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                   <ImageIcon size={48} className="mb-4 opacity-20" />
                   <p>{t('tools.ocrTool.waitingForInput')}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Image Preview Modal (Lightbox) */}
      {isPreviewOpen && image && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[110] bg-black/20 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
          >
            <X size={32} />
          </button>
          <img 
            src={image} 
            alt="Full Preview" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};
