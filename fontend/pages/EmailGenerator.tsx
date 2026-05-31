
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Sparkles, Copy, Globe, MessageSquare, Loader2, Send } from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/UI';
import { LanguageSelect } from '../components/LanguageSelect';
import { generateEmail } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

const TONES = [
  { id: 'professional', label: 'Professional (Chuyên nghiệp)', emoji: '👔' },
  { id: 'formal', label: 'Formal (Trang trọng)', emoji: '🎩' },
  { id: 'casual', label: 'Casual (Bình thường)', emoji: '☕' },
  { id: 'friendly', label: 'Friendly (Thân thiện, gần gũi)', emoji: '👋' },
  { id: 'urgent', label: 'Urgent (Khẩn cấp)', emoji: '🚨' },
  { id: 'apologetic', label: 'Apologetic (Xin lỗi)', emoji: '🙏' },
];

export const EmailGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('en');
  const [tone, setTone] = useState('professional');
  const [generatedEmail, setGeneratedEmail] = useState<{subject: string, body: string} | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('email-generator', {
    inputs: { topic, language, tone },
    outputs: { generatedEmail },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setTopic(saved.inputs.topic || '');
      setLanguage(saved.inputs.language || 'en');
      setTone(saved.inputs.tone || 'professional');
      setGeneratedEmail(saved.outputs.generatedEmail || null);
    }
  }, []);

  // Auto-save state
  useToolState('email-generator', {
    inputs: { topic, language, tone },
    outputs: { generatedEmail },
  }); 

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setGeneratedEmail(null);

    try {
      const result = await generateEmail({ topic, tone, language });
      setGeneratedEmail({ subject: result.subject, body: result.body });
      showToast(t('tools.emailGenerator.generated'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail className="text-indigo-600" />
          AI Email Generator
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.emailGenerator.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Configuration */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <Card className="flex flex-col gap-4 p-5 h-full">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                {t('tools.emailGenerator.emailAbout')}
              </label>
              <textarea 
                className="w-full h-32 p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="e.g. Ask David to reschedule our meeting to next Monday at 10 AM..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">{t('tools.emailGenerator.anyLanguageHint')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <Globe size={12} /> {t('tools.aiTranscriber.outputLanguage')}
                </label>
                <LanguageSelect value={language} onChange={setLanguage} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <MessageSquare size={12} /> Tone / Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                        tone === t.id 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                      }`}
                    >
                      <span className="mr-1">{t.emoji}</span> {t.label.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <Button
                onClick={handleGenerate}
                disabled={!topic || loading}
                className="w-full h-11 shadow-lg shadow-indigo-500/20 gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? t('tools.emailGenerator.writingEmail') : t('tools.emailGenerator.generateEmailBtn')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="lg:w-2/3 flex flex-col lg:min-h-0 min-w-0">
          <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                Generated Result 
                {generatedEmail && <Badge color="green">Ready</Badge>}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-6 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-slate-500 text-sm animate-pulse">{t('tools.emailGenerator.drafting')}</p>
                </div>
              )}

              {!generatedEmail && !loading && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <Send size={48} className="mb-4 opacity-20" />
                    <p>{t('tools.emailGenerator.waitingForInput')}</p>
                 </div>
              )}

              {generatedEmail && (
                <div className="space-y-6 max-w-3xl mx-auto">
                   {/* Subject Field */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-end">
                         <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                         <button 
                           onClick={() => copyToClipboard(generatedEmail.subject, 'Subject')}
                           className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                         >
                           <Copy size={12} /> Copy
                         </button>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-800 dark:text-slate-200">
                        {generatedEmail.subject}
                      </div>
                   </div>

                   {/* Body Field */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-end">
                         <label className="text-xs font-bold text-slate-500 uppercase">Body</label>
                         <button 
                           onClick={() => copyToClipboard(generatedEmail.body, 'Body')}
                           className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                         >
                           <Copy size={12} /> Copy
                         </button>
                      </div>
                      <div className="relative h-[420px] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                         <CodeEditor 
                           value={generatedEmail.body} 
                           onChange={(val) => setGeneratedEmail({...generatedEmail, body: val})}
                           className="border-0 bg-white dark:bg-slate-950"
                         />
                      </div>
                   </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
