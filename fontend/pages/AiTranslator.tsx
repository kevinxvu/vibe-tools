
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, Sparkles, Copy, ArrowRightLeft, 
  Loader2, MessageSquareQuote, Eraser 
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { LanguageSelect } from '../components/LanguageSelect';
import { translateText } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

export const AiTranslator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [context, setContext] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('ai-translator', {
    inputs: { text: inputText, sourceLang, targetLang, context },
    outputs: { result: outputText },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputText(saved.inputs.text || '');
      setSourceLang(saved.inputs.sourceLang || 'auto');
      setTargetLang(saved.inputs.targetLang || 'en');
      setContext(saved.inputs.context || '');
      setOutputText(saved.outputs.result || '');
    }
  }, []);

  // Auto-save state
  useToolState('ai-translator', {
    inputs: { text: inputText, sourceLang, targetLang, context },
    outputs: { result: outputText },
  }); 

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setOutputText('');

    try {
      const text = await translateText({
        input_text: inputText,
        source_lang: sourceLang,
        target_lang: targetLang,
        context,
      });

      setOutputText(text);
      if (text) showToast(t('tools.aiTranslator.successToast'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to translate text.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') {
      showToast(t('tools.aiTranslator.cannotSwap'), 'info');
      return;
    }
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText); // Optional: swap text too
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Languages className="text-indigo-600" />
          AI Smart Translator
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.aiTranslator.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input & Config */}
        <div className="lg:w-5/12 flex flex-col gap-4 lg:min-h-0">
          
          {/* Controls Card */}
          <Card className="p-4 flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t('tools.aiTranslator.from')}</label>
                <LanguageSelect value={sourceLang} onChange={setSourceLang} includeAuto />
              </div>
              
              <button 
                onClick={handleSwap}
                className="mb-1 p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Swap Languages"
              >
                <ArrowRightLeft size={18} />
              </button>

              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">{t('tools.aiTranslator.to')}</label>
                <LanguageSelect value={targetLang} onChange={setTargetLang} />
              </div>
            </div>

            <div>
               <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                 <MessageSquareQuote size={12} /> {t('tools.aiTranslator.context')}
               </label>
               <textarea 
                 className="w-full h-24 px-3 py-2 rounded-lg border bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                 placeholder={t('tools.aiTranslator.contextPlaceholder')}
                 value={context}
                 onChange={(e) => setContext(e.target.value)}
               />
            </div>
          </Card>

          {/* Input Editor */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors h-[300px] lg:h-auto">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.aiTranslator.inputText')}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setInputText('')}
                className="text-xs h-6 gap-1"
              >
                <Eraser size={12}/> {t('common.clear')}
              </Button>
            </div>
            <CodeEditor 
              value={inputText} 
              onChange={setInputText} 
              placeholder={t('tools.aiTranslator.inputPlaceholder')}
            />
          </Card>

          <Button 
            onClick={handleTranslate} 
            disabled={!inputText || loading} 
            className="w-full h-12 shadow-lg shadow-indigo-500/20 gap-2 text-base"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {loading ? t('tools.aiTranslator.translating') : t('tools.aiTranslator.translate')}
          </Button>
          
        </div>

        {/* Right: Output */}
        <div className="lg:w-7/12 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {t('tools.aiTranslator.result')} {outputText && <Badge color="green">{t('tools.aiTranscriber.done')}</Badge>}
              </span>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} disabled={!outputText} className="gap-1 h-8 text-xs">
                <Copy size={14} /> {t('common.copy')}
              </Button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-slate-500 text-sm animate-pulse">{t('tools.aiTranslator.aiWorking')}</p>
                </div>
              )}

              {!outputText && !loading && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Languages size={48} className="mb-4 opacity-20" />
                    <p>{t('tools.aiTranslator.waitingForInput')}</p>
                 </div>
              )}

              {outputText && (
                 <CodeEditor 
                   value={outputText} 
                   onChange={() => {}} 
                   readOnly={true}
                   className="border-0 text-base"
                 />
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
