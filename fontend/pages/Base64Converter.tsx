
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Binary, ArrowRight, ArrowLeft, Copy, Trash2, 
  Download, Upload, File as FileIcon, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

type Mode = 'encode' | 'decode';

export const Base64Converter: React.FC = () => {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [filename, setFilename] = useState('decoded_file.bin');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('base64-converter', {
    inputs: { text: input, mode },
    outputs: { result: output, filename },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.text || '');
      setOutput(saved.outputs.result || '');
      setMode(saved.inputs.mode || 'encode');
      setFilename(saved.outputs.filename || 'decoded_file.bin');
    }
  }, []);

  // --- Utilities (UTF-8 Safe) ---
  
  const utf8ToBase64 = (str: string): string => {
    try {
      // 1. Encode string to UTF-8 bytes
      const bytes = new TextEncoder().encode(str);
      // 2. Convert bytes to binary string
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
      // 3. Encode binary string to Base64
      return btoa(binString);
    } catch (e) {
      throw new Error("Encoding failed. Ensure input is valid text.");
    }
  };

  const base64ToUtf8 = (str: string): string => {
    try {
      // 1. Decode Base64 to binary string
      const binString = atob(str);
      // 2. Convert binary string to UTF-8 bytes
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
      // 3. Decode UTF-8 bytes to string
      return new TextDecoder().decode(bytes);
    } catch (e) {
      throw new Error("Invalid Base64 string or broken UTF-8 sequence.");
    }
  };

  // --- Handlers ---

  const handleProcess = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = utf8ToBase64(input);
        setOutput(encoded);
      } else {
        // Try decoding to text first for preview
        try {
          const decoded = base64ToUtf8(input);
          setOutput(decoded);
        } catch (e) {
          // If it fails (maybe binary data), we still allow download but show warning in text area
          setOutput("[Binary data detected or invalid UTF-8. Use 'Download as File' to retrieve content.]");
        }
      }
    } catch (err: any) {
      setError(err.message);
      setOutput('');
    }
  };

  // Auto-save state
  useToolState('base64-converter', {
    inputs: { text: input, mode },
    outputs: { result: output, filename },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        // Result is "data:mime;base64,RAW_STRING". We want the raw string.
        const rawBase64 = result.split(',')[1];
        setInput(mode === 'encode' ? "File loaded, click Encode to view result." : rawBase64);
        
        if (mode === 'encode') {
           setOutput(rawBase64);
           showToast(t('tools.base64Converter.fileEncoded', { filename: file.name }));
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!input) return;
    try {
      // 1. Clean input (remove whitespace/newlines)
      const cleanBase64 = input.replace(/\s/g, '');

      // 2. Decode Base64 to binary
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // 3. Create Blob
      const blob = new Blob([byteArray], { type: "application/octet-stream" });

      // 4. Trigger Download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || 'download.bin';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(t('tools.base64Converter.fileDownloaded'));
    } catch (err) {
      showToast(t('tools.base64Converter.downloadFailed'), 'error');
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
          <Binary className="text-indigo-600" />
          Base64 Converter
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-slate-500">Encode text/files to Base64 or Decode Base64 strings.</p>
          <Badge color="green">UTF-8 Safe</Badge>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex mb-6 shadow-inner">
        <button
          onClick={() => {
            if (mode === 'encode') return;
            setMode('encode');
            setInput('');
            setOutput('');
            setError(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'encode'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          {t('tools.base64Converter.encodeTab')}
        </button>
        <button
          onClick={() => {
            if (mode === 'decode') return;
            setMode('decode');
            setInput('');
            setOutput('');
            setError(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'decode'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('tools.base64Converter.decodeTab')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left Pane: INPUT */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {mode === 'encode' ? 'Plain Text (UTF-8) or File' : 'Base64 String'}
              </span>
              <div className="flex gap-2">
                {mode === 'encode' && (
                  <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-indigo-500 flex items-center gap-1 text-xs">
                    <Upload size={14} /> {t('tools.base64Converter.uploadFile')}
                  </button>
                )}
                <button onClick={() => setInput('')} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                <button onClick={() => copyToClipboard(input)} className="text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>
              </div>
            </div>
            
            <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
               className="hidden" 
            />

            <CodeEditor 
              value={input} 
              onChange={(val) => { setInput(val); if(mode==='encode') handleProcess(); }}
              placeholder={mode === 'encode' ? "Type text (e.g., Xin chào) to encode..." : "Paste Base64 string to decode..."}
            />
          </Card>
          
          {mode === 'encode' && (
            <div className="mt-4 flex justify-end">
               <Button onClick={handleProcess}>
                 Encode <ArrowRight size={16} className="ml-2" />
               </Button>
            </div>
          )}

           {mode === 'decode' && (
            <div className="mt-4 flex justify-end">
               <Button onClick={handleProcess}>
                 Decode <ArrowRight size={16} className="ml-2" />
               </Button>
            </div>
          )}
        </div>

        {/* Right Pane: OUTPUT */}
        <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-[300px] lg:h-auto lg:flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {mode === 'encode' ? 'Base64 Result' : 'Decoded Result'}
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
            
            {/* File Download Section for Decode Mode */}
            {mode === 'decode' && (
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                 <div className="flex-1 w-full">
                    <label className="text-xs text-slate-500 mb-1 block">{t('tools.base64Converter.saveAsFile')}</label>
                    <div className="flex items-center gap-2">
                      <FileIcon size={16} className="text-slate-400" />
                      <Input 
                        className="h-9 text-sm" 
                        placeholder="filename.txt" 
                        value={filename}
                        onChange={e => setFilename(e.target.value)}
                      />
                    </div>
                 </div>
                 <Button variant="secondary" onClick={handleDownload} disabled={!input} className="w-full sm:w-auto mt-auto gap-2 h-9">
                   <Download size={16} /> {t('tools.base64Converter.downloadFile')}
                 </Button>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
