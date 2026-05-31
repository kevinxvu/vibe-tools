
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquareMore, Image as ImageIcon, MessageSquare, 
  Send, Loader2, Copy, X, Upload, Globe, Sparkles 
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { LanguageSelect } from '../components/LanguageSelect';
import { smartChatReply } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

const STYLES = [
  { id: 'professional', label: 'Professional (Chuyên nghiệp)', emoji: '👔' },
  { id: 'friendly', label: 'Friendly (Thân thiện)', emoji: '👋' },
  { id: 'flirty', label: 'Flirty/Romantic (Thả thính)', emoji: '😍' },
  { id: 'humorous', label: 'Humorous (Hài hước)', emoji: '🤣' },
  { id: 'witty', label: 'Witty/Sarcastic (Cà khịa/Thông minh)', emoji: '😏' },
  { id: 'mimic', label: 'Mimic/Mirror (Học theo style đối phương)', emoji: '🦜' },
  { id: 'empathetic', label: 'Empathetic (Đồng cảm)', emoji: '❤️' },
  { id: 'direct', label: 'Direct/Concise (Ngắn gọn)', emoji: '⚡' },
];

export const SmartChatReply: React.FC = () => {
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [targetLang, setTargetLang] = useState('vi');
  const [style, setStyle] = useState('friendly');
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('smart-chat-reply', {
    inputs: { inputType, textInput, targetLang, style },
    outputs: { suggestions },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputType(saved.inputs.inputType || 'text');
      setTextInput(saved.inputs.textInput || '');
      setTargetLang(saved.inputs.targetLang || 'vi');
      setStyle(saved.inputs.style || 'friendly');
      setSuggestions(saved.outputs.suggestions || []);
    }
  }, []);

  // Auto-save state
  useToolState('smart-chat-reply', {
    inputs: { inputType, textInput, targetLang, style },
    outputs: { suggestions },
  }); 

  // --- Image Handling (Drag & Drop + Paste) ---
  const handlePaste = (e: ClipboardEvent) => {
    if (inputType !== 'image') return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const file = new File([blob], 'pasted-image.png', { type: blob.type });
          const reader = new FileReader();
          reader.onload = (event) => {
             setImageInput(event.target?.result as string);
             setImageFile(file);
             setSuggestions([]);
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
  }, [inputType]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageInput(ev.target?.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (inputType === 'text' && !textInput.trim()) return;
    if (inputType === 'image' && !imageFile) return;

    setLoading(true);
    setSuggestions([]);

    try {
      const results = await smartChatReply({
        conversation: inputType === 'text' ? textInput : undefined,
        image: inputType === 'image' ? imageFile! : undefined,
        target_lang: targetLang,
        style,
      });

      setSuggestions(results);
      showToast(t('tools.smartChatReply.generated'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate replies.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquareMore className="text-indigo-600" />
          Smart Chat Reply
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.smartChatReply.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* LEFT COLUMN: Inputs & Config */}
        <div className="lg:w-5/12 flex flex-col gap-4 lg:min-h-0">
          
          {/* Input Type Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
             <button
                onClick={() => setInputType('text')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${inputType === 'text' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
             >
               <MessageSquare size={16} /> Paste Text
             </button>
             <button
                onClick={() => setInputType('image')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${inputType === 'image' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
             >
               <ImageIcon size={16} /> Upload Image
             </button>
          </div>

          {/* Input Area */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors min-h-[300px]">
            {inputType === 'text' ? (
              <>
                 <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                   <span className="text-xs font-semibold text-slate-500 uppercase">Chat Log</span>
                   <Button variant="ghost" size="sm" onClick={() => setTextInput('')} className="text-xs h-6">Clear</Button>
                 </div>
                 <CodeEditor 
                   value={textInput} 
                   onChange={setTextInput} 
                   placeholder={`Him: Hey, are you free tonight?&#10;Me: Maybe, why?&#10;Him: I was thinking we could grab dinner.`}
                 />
              </>
            ) : (
              <div className="flex-1 flex flex-col p-4 bg-slate-50 dark:bg-slate-900/50 relative">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                 
                 {imageInput ? (
                   <div className="relative w-full h-full flex items-center justify-center bg-slate-200 dark:bg-black/40 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                     <img src={imageInput} alt="Preview" className="max-w-full max-h-full object-contain" />
                     <button 
                       onClick={() => { setImageInput(null); setImageFile(null); }}
                       className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                     >
                       <X size={16} />
                     </button>
                   </div>
                 ) : (
                   <div 
                     className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
                     onClick={() => fileInputRef.current?.click()}
                   >
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to Upload Screenshot</p>
                      <p className="text-xs text-slate-400 mt-1">or Paste (Ctrl+V)</p>
                   </div>
                 )}
              </div>
            )}
          </Card>

          {/* Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <Globe size={12} /> Output Language
                </label>
                <LanguageSelect value={targetLang} onChange={setTargetLang} />
             </div>
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} /> Reply Style
                </label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  {STYLES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label.split('(')[0]}</option>)}
                </select>
             </div>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={loading || (inputType === 'text' ? !textInput : !imageFile)} 
            className="w-full h-11 gap-2 shadow-lg shadow-indigo-500/20"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {loading ? 'Analyzing Context...' : 'Generate 5 Suggestions'}
          </Button>
        </div>

        {/* RIGHT COLUMN: Output */}
        <div className="lg:w-7/12 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
             <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Suggestions {suggestions.length > 0 && <Badge color="indigo">{suggestions.length}</Badge>}
                </span>
             </div>

             <div className="flex-1 overflow-auto p-6 relative">
               {loading && (
                 <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                    <p className="text-slate-500 text-sm animate-pulse">Reading the room...</p>
                 </div>
               )}

               {!loading && suggestions.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <MessageSquareMore size={48} className="mb-4 opacity-20" />
                    <p>Suggested replies will appear here</p>
                 </div>
               )}

               <div className="space-y-4">
                 {suggestions.map((suggestion, idx) => (
                   <div 
                     key={idx} 
                     className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm hover:shadow-md cursor-pointer relative"
                     onClick={() => copyToClipboard(suggestion)}
                   >
                     <div className="pr-8 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                       {suggestion}
                     </div>
                     <div className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">
                       <Copy size={16} />
                     </div>
                     <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                       Click to Copy
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
