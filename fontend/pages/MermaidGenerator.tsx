import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy, Download, Edit3, Eye, Loader2, Maximize2, Minimize2,
  RefreshCw, Sparkles, Trash2, Workflow,
} from 'lucide-react';
import { Button, Card } from '../components/UI';
import { CodeEditor } from '../components/CodeEditor';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { generateMermaid, MermaidDiagramType } from '../lib/services/llmService';
import { useToast } from '../context/ToastContext';
import { useToolState } from '../lib/useToolState';

const DEFAULT_MERMAID = `flowchart TD
    A[Describe your diagram] --> B[Generate with AI]
    B --> C[Edit Mermaid source]
    C --> D[Live preview]`;

const DIAGRAM_TYPES: Array<{ value: MermaidDiagramType; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'sequenceDiagram', label: 'Sequence' },
  { value: 'classDiagram', label: 'Class' },
  { value: 'stateDiagram', label: 'State' },
  { value: 'erDiagram', label: 'ER' },
  { value: 'journey', label: 'Journey' },
  { value: 'gantt', label: 'Gantt' },
  { value: 'mindmap', label: 'Mindmap' },
];

const MermaidPreview: React.FC<{ source: string; className?: string }> = React.memo(({ source, className = '' }) => {
  const previewMarkdown = useMemo(() => `\`\`\`mermaid\n${source.trim() || 'flowchart TD\\n    A[Empty]'}\n\`\`\``, [source]);

  return <MarkdownRenderer className={className}>{previewMarkdown}</MarkdownRenderer>;
});

MermaidPreview.displayName = 'MermaidPreview';

export const MermaidGenerator: React.FC = () => {
  const [description, setDescription] = useState('');
  const [diagramType, setDiagramType] = useState<MermaidDiagramType>('auto');
  const [source, setSource] = useState(DEFAULT_MERMAID);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { showToast } = useToast();
  const { t } = useTranslation();

  const { loadState } = useToolState('mermaid-generator', {
    inputs: { description, diagramType },
    outputs: { source },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setDescription(saved.inputs.description || '');
      setDiagramType(saved.inputs.diagramType || 'auto');
      setSource(saved.outputs.source || DEFAULT_MERMAID);
    }
  }, []);

  useToolState('mermaid-generator', {
    inputs: { description, diagramType },
    outputs: { source },
  });

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setLoading(true);
    try {
      const result = await generateMermaid({
        description,
        diagram_type: diagramType,
      });
      if (result.trim()) {
        setSource(result.trim());
        showToast(t('tools.mermaidGenerator.generated'), 'success');
      }
    } catch (err: any) {
      showToast(err.message || t('tools.mermaidGenerator.generateFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!source.trim()) return;
    await navigator.clipboard.writeText(source);
    showToast(t('tools.mermaidGenerator.copied'));
  };

  const handleDownload = () => {
    if (!source.trim()) return;
    try {
      const blob = new Blob([source], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'diagram.mmd';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t('common.fileSaved'), 'success');
    } catch {
      showToast(t('common.failedToSaveFile'), 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Workflow className="text-indigo-600" />
          {t('tools.mermaidGenerator.pageTitle')}
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.mermaidGenerator.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0">
        <Card className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px_auto] gap-4 lg:items-start">
            <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
              {t('tools.mermaidGenerator.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tools.mermaidGenerator.descriptionPlaceholder')}
              className="w-full h-24 resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

            <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
              {t('tools.mermaidGenerator.diagramType')}
            </label>
            <select
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value as MermaidDiagramType)}
              className="w-full h-10 px-3 rounded-lg border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {DIAGRAM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:pt-6">
              <Button
                onClick={handleGenerate}
                disabled={!description.trim() || loading}
                className="gap-2 h-10 shadow-lg shadow-indigo-500/20 whitespace-nowrap"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? t('tools.mermaidGenerator.generating') : t('tools.mermaidGenerator.generate')}
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopy} title={t('common.copy')}>
                  <Copy size={15} />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload} title={t('common.download')}>
                  <Download size={15} />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSource(DEFAULT_MERMAID)} title={t('common.reset')}>
                  <RefreshCw size={15} />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-0 overflow-hidden min-h-[720px] lg:min-h-0 lg:flex-1 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <Button variant="ghost" size="sm" onClick={() => setSource('')} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title={t('common.clear')}>
              <Trash2 size={15} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsFullScreen(true)} title={t('tools.mermaidGenerator.fullScreenPreview')}>
              <Maximize2 size={15} />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0">
            <div className="flex flex-col min-h-[360px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
              <div className="h-10 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                <Edit3 size={14} />
                {t('tools.mermaidGenerator.editTab')}
              </div>
              <div className="flex-1 min-h-0">
                <CodeEditor
                  value={source}
                  onChange={setSource}
                  placeholder={'flowchart TD\n    A[Start] --> B[End]'}
                />
              </div>
            </div>

            <div className="flex flex-col min-h-[360px] lg:min-h-0 bg-white dark:bg-slate-900">
              <div className="h-10 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  <Eye size={14} />
                  {t('tools.mermaidGenerator.previewTab')}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <MermaidPreview source={source} className="min-h-full p-6" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Workflow className="text-indigo-600" size={20} />
              {t('tools.mermaidGenerator.fullScreenPreview')}
            </h2>
            <Button onClick={() => setIsFullScreen(false)} variant="secondary" className="gap-2">
              <Minimize2 size={16} /> {t('tools.markdownViewer.exitFullScreen')}
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-8">
            <MermaidPreview source={source} className="min-h-full" />
          </div>
        </div>
      )}
    </div>
  );
};
