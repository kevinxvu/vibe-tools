import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Globe, Server, Settings,
  Wrench, ArrowUpRight, Code2, FileText, ScanText,
  Fingerprint, Database, Clock, Quote, Lock, AlignJustify,
  BookOpen, AlignLeft, Binary, Link as LinkIcon, ShieldCheck,
  Calculator, Eraser, Code, Hash, ShieldAlert, Type, Mail,
  MessageSquareMore, FileEdit, Mic, FileCode, Subtitles, Languages, Activity,
  ChevronDown, ChevronUp, Layers, X, Workflow,
} from 'lucide-react';
import { Tool, ToolCategory } from '../types';
import internalToolsData from '../data/internalTools.json';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '../context/SidebarContext';

const ICON_MAP: Record<string, any> = {
  Globe, Server, Settings, Wrench, Code2, FileText, ScanText,
  Fingerprint, Database, Clock, Quote, Lock, AlignJustify,
  BookOpen, AlignLeft, Binary, Link: LinkIcon, ShieldCheck,
  Calculator, Eraser, Code, Hash, ShieldAlert, Type, Mail,
  MessageSquareMore, FileEdit, Mic, FileCode, Subtitles, Languages, Activity,
  Workflow,
};

const SIDEBAR_CATEGORY_ORDER: ToolCategory[] = ['AI', 'Frontend', 'Backend', 'Utility', 'String', 'DevOps'];

const CATEGORY_STYLES: Record<ToolCategory, { bg: string; text: string; dot: string }> = {
  AI:       { bg: 'bg-rose-50 dark:bg-rose-950/40',       text: 'text-rose-700 dark:text-rose-300',     dot: 'bg-rose-500' },
  Frontend: { bg: 'bg-indigo-50 dark:bg-indigo-950/40',   text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  Backend:  { bg: 'bg-slate-100 dark:bg-slate-800/60',    text: 'text-slate-600 dark:text-slate-300',   dot: 'bg-slate-400' },
  DevOps:   { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Utility:  { bg: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500' },
  String:   { bg: 'bg-orange-50 dark:bg-orange-950/40',   text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
};

export const Sidebar: React.FC = () => {
  const { isOpen, close } = useSidebar();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    const internalTools: Tool[] = internalToolsData as Tool[];
    setTools([...internalTools].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, []);

  const enabledTools = tools.filter(tool => tool.isEnable !== false);

  const groups: Partial<Record<ToolCategory, Tool[]>> = {};
  SIDEBAR_CATEGORY_ORDER.forEach(cat => {
    const catTools = enabledTools.filter(tool => tool.categories.includes(cat));
    if (catTools.length > 0) groups[cat] = catTools;
  });

  const toggleGroup = (cat: string) =>
    setCollapsedGroups(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleToolClick = (tool: Tool) => {
    if (tool.isInternal) {
      navigate(tool.url);
      if (window.innerWidth < 1024) close();
    } else if ((tool as any).isExternal) {
      window.open(tool.url, '_blank');
    }
  };

  const getCategoryLabel = (cat: ToolCategory): string => {
    const map: Record<string, string> = {
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
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 mx-auto lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
        aria-hidden
      />

      <aside
        className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] lg:sticky lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] flex flex-col flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-64 shadow-2xl lg:shadow-none' : 'w-0'}`}
      >
        <div className="flex flex-col h-full overflow-hidden min-w-[16rem]">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <Layers size={15} className="text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tools</span>
            <span className="text-xs font-medium bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
              {enabledTools.length}
            </span>
            <button
              onClick={close}
              className="ml-auto lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={15} />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto py-3 px-2 space-y-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {SIDEBAR_CATEGORY_ORDER.map(cat => {
              const groupTools = groups[cat];
              if (!groupTools) return null;
              const collapsed = collapsedGroups[cat];
              const styles = CATEGORY_STYLES[cat];

              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleGroup(cat)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg mb-0.5 text-xs font-semibold tracking-wide uppercase transition-colors duration-150 hover:opacity-90 ${styles.bg} ${styles.text}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
                      {getCategoryLabel(cat)}
                      <span className="font-normal opacity-60">({groupTools.length})</span>
                    </div>
                    {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </button>

                  {!collapsed && (
                    <ul className="space-y-0.5 mb-1">
                      {groupTools.map(tool => {
                        const Icon = ICON_MAP[tool.iconName] || Globe;
                        const isToolActive = location.pathname === tool.url;
                        return (
                          <li key={tool.id}>
                            <button
                              onClick={() => handleToolClick(tool)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150 group ${isToolActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
                            >
                              <div className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isToolActive ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`}>
                                <Icon size={11} className="w-full h-full p-[2px]" />
                              </div>
                              <span className="flex-1 truncate text-xs">
                                {t(`toolsMeta.${tool.id}.name`, { defaultValue: tool.name })}
                              </span>
                              {(tool as any).isExternal && (
                                <ArrowUpRight size={10} className="flex-shrink-0 opacity-30 group-hover:opacity-60" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};
