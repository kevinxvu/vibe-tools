
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Globe, Server, Settings,
  Wrench, ArrowUpRight, Code2, FileText, ScanText,
  Fingerprint, Database, Clock, Quote, Lock, AlignJustify,
  BookOpen, AlignLeft, Binary, Link as LinkIcon, ShieldCheck,
  Calculator, Eraser, Code, Hash, ShieldAlert, Type, Mail,
  MessageSquareMore, FileEdit, Mic, FileCode, Subtitles, Languages, Activity
} from 'lucide-react';
import { Tool, ToolCategory } from '../types';
import { Button, Input, Card, Badge } from '../components/UI';
import internalToolsData from '../data/internalTools.json';
import { useTranslation } from 'react-i18next';

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  Globe, Server, Settings, Wrench, Code2, FileText, ScanText,
  Fingerprint, Database, Clock, Quote, Lock, AlignJustify,
  BookOpen, AlignLeft, Binary, Link: LinkIcon, ShieldCheck,
  Calculator, Eraser, Code, Hash, ShieldAlert, Type, Mail,
  MessageSquareMore, FileEdit, Mic, FileCode, Subtitles, Languages, Activity,
};

// ─── Category config ─────────────────────────────────────────────────────────

const SIDEBAR_CATEGORY_ORDER: ToolCategory[] = ['AI', 'Frontend', 'Backend', 'Utility', 'String', 'DevOps'];

const CATEGORY_STYLES: Record<ToolCategory, { bg: string; text: string; dot: string }> = {
  AI:       { bg: 'bg-rose-50 dark:bg-rose-950/40',       text: 'text-rose-700 dark:text-rose-300',     dot: 'bg-rose-500' },
  Frontend: { bg: 'bg-indigo-50 dark:bg-indigo-950/40',   text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  Backend:  { bg: 'bg-slate-100 dark:bg-slate-800/60',    text: 'text-slate-600 dark:text-slate-300',   dot: 'bg-slate-400' },
  DevOps:   { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Utility:  { bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500' },
  String:   { bg: 'bg-orange-50 dark:bg-orange-950/40',   text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
};

const getCategoryBadgeColor = (cat: ToolCategory) => {
  const map: Record<ToolCategory, 'rose' | 'indigo' | 'slate' | 'green' | 'blue' | 'orange'> = {
    AI: 'rose', Frontend: 'indigo', Backend: 'slate',
    DevOps: 'green', Utility: 'blue', String: 'orange',
  };
  return map[cat] ?? 'slate';
};



// ─── Dashboard ────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'All'>('All');
  const { t } = useTranslation();

  useEffect(() => {
    const internalTools: Tool[] = internalToolsData as Tool[];
    setTools([...internalTools].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, []);

  const filteredTools = tools.filter(tool => {
    const isEnabled = tool.isEnable !== false;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || tool.categories.includes(selectedCategory);
    return isEnabled && matchesSearch && matchesCategory;
  });

  const categories: (ToolCategory | 'All')[] = ['All', 'AI', 'Frontend', 'Backend', 'Utility', 'String', 'DevOps'];

  const getCategoryLabel = (cat: ToolCategory | 'All'): string => {
    const map: Record<string, string> = {
      All:      t('dashboard.categories.all'),
      Frontend: t('dashboard.categories.frontend'),
      Backend:  t('dashboard.categories.backend'),
      DevOps:   t('dashboard.categories.devops'),
      Utility:  t('dashboard.categories.utility'),
      String:   t('dashboard.categories.string'),
      AI:       t('dashboard.categories.ai'),
    };
    return map[cat] ?? cat;
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('dashboard.title')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder={t('dashboard.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto py-1 pb-2 sm:pb-0 px-1 scrollbar-hide">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="whitespace-nowrap"
                >
                  {getCategoryLabel(cat)}
                </Button>
              ))}
            </div>
          </div>

          {/* Result count */}
          {(searchQuery || selectedCategory !== 'All') && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {filteredTools.length} {t('dashboard.results', { defaultValue: 'tools found' })}
            </p>
          )}

          {/* Tool grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => {
              const Icon = ICON_MAP[tool.iconName] || Globe;
              return (
                <Link
                  key={tool.id}
                  to={tool.isInternal ? tool.url : '#'}
                  onClick={e => {
                    if ((tool as any).isExternal) {
                      e.preventDefault();
                      window.open(tool.url, '_blank');
                    }
                  }}
                >
                  <Card hover className="h-full flex flex-col p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-lg ${
                        tool.isInternal
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <Icon size={24} />
                      </div>
                      {(tool as any).isExternal && <ArrowUpRight size={18} className="text-slate-400" />}
                    </div>
                    <div className="mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t(`toolsMeta.${tool.id}.name`, { defaultValue: tool.name })}
                      </h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 flex-grow leading-relaxed">
                      {t(`toolsMeta.${tool.id}.description`, { defaultValue: tool.description })}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="flex flex-wrap gap-1">
                        {tool.categories.map(cat => (
                          <Badge key={cat} color={getCategoryBadgeColor(cat)}>
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredTools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {t('dashboard.noResults', { defaultValue: 'No tools found' })}
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {t('dashboard.noResultsHint', { defaultValue: 'Try a different search term or category.' })}
              </p>
            </div>
          )}
        </div>
    </div>
  );
};
