
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Search, Filter, Trash2, Copy, 
  ChevronRight, Database, Globe, Clock, 
  AlertCircle, Info, Activity, Maximize2
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

interface LogEntry {
  id: string;
  raw: any;
  timestamp?: string;
  level: string;
  message: string;
  type?: string;
  trace_id?: string;
  latency?: string;
  latency_ms?: number;
  // SQL specific
  query?: string;
  row?: number;
  // API (inbound) specific
  method?: string;
  uri?: string;
  status?: number;
  request_body?: string;
  response_body?: string;
  // http_client (outbound) specific
  url?: string;
  request?: string;
  response?: string;
  header?: string;
  status_code?: number;
  [key: string]: any;
}

export const LogAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('log-analyzer', {
    inputs: { text: inputText, searchQuery, filterType },
    outputs: {},
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputText(saved.inputs.text || '');
      setSearchQuery(saved.inputs.searchQuery || '');
      setFilterType(saved.inputs.filterType || 'all');
    }
  }, []);

  // Auto-save state
  useToolState('log-analyzer', {
    inputs: { text: inputText, searchQuery, filterType },
    outputs: {},
  });

  const logs = useMemo(() => {
    if (!inputText.trim()) return [];
    
    return inputText.split('\n').filter(line => line.trim()).map((line, idx) => {
      try {
        const parsed = JSON.parse(line);
        // Derive latency_ms from latency string (e.g. "2.568741ms", "123.4µs")
        let latency_ms: number | undefined = undefined;
        if (parsed.latency) {
          const msMatch = String(parsed.latency).match(/([\d.]+)ms/);
          const usMatch = String(parsed.latency).match(/([\d.]+)[µu]s/);
          const sMatch  = String(parsed.latency).match(/([\d.]+)s$/);
          if (msMatch) latency_ms = parseFloat(msMatch[1]);
          else if (usMatch) latency_ms = parseFloat(usMatch[1]) / 1000;
          else if (sMatch)  latency_ms = parseFloat(sMatch[1]) * 1000;
        }
        return {
          id: `log-${idx}`,
          raw: parsed,
          latency_ms,
          ...parsed
        } as LogEntry;
      } catch (e) {
        return {
          id: `log-${idx}`,
          raw: line,
          level: 'plain',
          message: line,
          timestamp: new Date().toISOString()
        } as LogEntry;
      }
    });
  }, [inputText]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || log.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [logs, searchQuery, filterType]);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'red';
      case 'warn': case 'warning': return 'orange';
      case 'info': return 'indigo';
      case 'debug': return 'slate';
      default: return 'slate';
    }
  };

  const getLatencyColor = (ms?: number) => {
    if (ms === undefined) return 'slate';
    if (ms < 50) return 'green';
    if (ms < 200) return 'orange';
    return 'red';
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '--:--:--';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch (e) {
      return ts;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="text-indigo-600" />
            JSON Log Analyzer
          </h1>
          <p className="text-sm text-slate-500">{t('tools.logAnalyzer.pageDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setInputText('')} className="text-red-500">
            <Trash2 size={16} className="mr-2" /> {t('tools.logAnalyzer.clearLogs')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Input Area */}
        {!logs.length ? (
          <div className="lg:w-full flex flex-col">
            <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.logAnalyzer.pasteLogsHere')}</span>
              </div>
              <CodeEditor 
                value={inputText} 
                onChange={setInputText} 
                placeholder='{"level":"info","timestamp":"...","type":"sql","query":"SELECT..."}'
              />
            </Card>
          </div>
        ) : (
          <>
            {/* Main Log Table Area */}
            <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
              <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                {/* Search & Filter Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder={t('tools.logAnalyzer.searchPlaceholder')} 
                      className="pl-9 h-9" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="sql">SQL Only</option>
                      <option value="api">API (inbound)</option>
                      <option value="http_client">HTTP Client (outbound)</option>
                    </select>
                    <Badge color="indigo">{filteredLogs.length} logs</Badge>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 z-10">
                      <tr>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Level</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Summary</th>
                        <th className="px-4 py-2 text-right whitespace-nowrap">Lat</th>
                        <th className="px-4 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLogs.map((log) => (
                        <tr 
                          key={log.id} 
                          onClick={() => setSelectedLog(log)}
                          className={`group cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                          <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge color={getLevelColor(log.level)}>{log.level}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                              {log.type === 'sql' && <Database size={14} className="text-blue-500" />}
                              {log.type === 'api' && <Globe size={14} className="text-emerald-500" />}
                              {log.type === 'http_client' && <Globe size={14} className="text-violet-500" />}
                              {!log.type && <FileText size={14} />}
                              {log.type || 'plain'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs truncate max-w-md text-slate-700 dark:text-slate-300 font-mono">
                              {log.type === 'sql'
                                ? log.query
                                : log.type === 'api'
                                ? `${log.method} ${log.uri}`
                                : log.type === 'http_client'
                                ? `${log.method} ${log.url}`
                                : log.message}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {log.latency && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                log.latency_ms && log.latency_ms > 200 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {log.latency}
                              </span>
                            )}
                          </td>
                          <td className="pr-3 py-3 text-right w-8">
                            <button
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(JSON.stringify(log.raw)); }}
                              title="Copy raw JSON"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              <Copy size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right: Log Inspector Panel */}
            {selectedLog && (
              <div className="lg:w-2/5 flex flex-col lg:min-h-0 animate-in slide-in-from-right-4">
                <Card className="h-full flex flex-col p-0 overflow-hidden border-indigo-200 dark:border-indigo-900/50 shadow-xl">
                  <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Maximize2 size={16} />
                      <h3 className="font-bold">Log Details</h3>
                    </div>
                    <button onClick={() => setSelectedLog(null)} className="hover:bg-white/20 p-1 rounded">
                      <ChevronRight className="rotate-180" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-5 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Trace ID</span>
                        <div className="text-xs font-mono break-all text-indigo-600 dark:text-indigo-400">{selectedLog.trace_id || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Time</span>
                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300">{selectedLog.timestamp}</div>
                      </div>
                    </div>

                    {/* SQL Specific View */}
                    {selectedLog.type === 'sql' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Database size={12} /> SQL Query
                          </h4>
                          <span className="text-slate-400 text-[10px]">{selectedLog.row} rows affected</span>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-blue-300 leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-700 shadow-inner">
                          {selectedLog.query}
                        </div>
                      </div>
                    )}

                    {/* API (inbound) Specific View */}
                    {selectedLog.type === 'api' && (
                      <div className="space-y-4">
                        <div>
                           <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">Endpoint</h4>
                           <div className="flex items-center gap-2">
                             <Badge color={selectedLog.status && selectedLog.status >= 400 ? 'red' : 'green'}>
                               {selectedLog.status}
                             </Badge>
                             <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedLog.method}</span>
                             <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{selectedLog.uri}</span>
                           </div>
                        </div>

                        {selectedLog.request_body && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Request Body</h4>
                            <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-auto max-h-60">
                              <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                                {(() => {
                                  try { return JSON.stringify(JSON.parse(selectedLog.request_body), null, 2); }
                                  catch (e) { return selectedLog.request_body; }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}

                        {selectedLog.response_body && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Response Body</h4>
                            <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-auto max-h-60">
                              <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                                {(() => {
                                  try { return JSON.stringify(JSON.parse(selectedLog.response_body), null, 2); }
                                  catch (e) { return selectedLog.response_body; }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* HTTP Client (outbound) Specific View */}
                    {selectedLog.type === 'http_client' && (
                      <div className="space-y-4">
                        {/* Endpoint + status */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                            <Globe size={12} className="text-violet-500" /> Outbound Request
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge color={selectedLog.status_code !== undefined && selectedLog.status_code >= 400 ? 'red' : 'green'}>
                              {selectedLog.status_code ?? '--'}
                            </Badge>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedLog.method}</span>
                            <span className="text-xs font-mono text-violet-600 dark:text-violet-400 break-all">{selectedLog.url}</span>
                          </div>
                          {selectedLog.latency && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Clock size={11} className="text-slate-400" />
                              <span className={`text-xs font-bold ${
                                selectedLog.latency_ms !== undefined && selectedLog.latency_ms > 200
                                  ? 'text-red-500'
                                  : selectedLog.latency_ms !== undefined && selectedLog.latency_ms > 50
                                  ? 'text-orange-500'
                                  : 'text-green-600'
                              }`}>{selectedLog.latency}</span>
                            </div>
                          )}
                        </div>

                        {/* Request Headers */}
                        {selectedLog.header && (() => {
                          let headers: Record<string, string> = {};
                          try { headers = JSON.parse(selectedLog.header); } catch {}
                          const entries = Object.entries(headers);
                          if (!entries.length) return null;
                          return (
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Request Headers</h4>
                              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1 overflow-auto max-h-48">
                                {entries.map(([k, v]) => (
                                  <div key={k} className="flex gap-2 text-[11px]">
                                    <span className="text-violet-600 dark:text-violet-400 font-mono shrink-0">{k}:</span>
                                    <span className="text-slate-600 dark:text-slate-400 font-mono break-all">
                                      {/* Mask Authorization token beyond first 20 chars */}
                                      {k.toLowerCase() === 'authorization' && v.length > 30
                                        ? v.slice(0, 20) + '…[masked]'
                                        : v}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Request body */}
                        {selectedLog.request && String(selectedLog.request).trim() && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Request Body</h4>
                            <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-auto max-h-48">
                              <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                                {(() => {
                                  try { return JSON.stringify(JSON.parse(selectedLog.request), null, 2); }
                                  catch { return selectedLog.request; }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Response body */}
                        {selectedLog.response && String(selectedLog.response).trim() && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Response Body</h4>
                            <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-auto max-h-60">
                              <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                                {(() => {
                                  try { return JSON.stringify(JSON.parse(selectedLog.response), null, 2); }
                                  catch { return selectedLog.response; }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generic / All Fields View */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">All Log Fields</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedLog.raw).map(([key, value]) => {
                          if (['query', 'request_body', 'response_body', 'request', 'response', 'header'].includes(key)) return null;
                          return (
                            <div key={key} className="flex justify-between gap-4 py-1 text-xs border-b border-slate-50 dark:border-slate-800/50">
                              <span className="text-slate-400 font-mono shrink-0">{key}</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium break-all text-right">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="secondary" className="flex-1 gap-2" onClick={() => copyToClipboard(JSON.stringify(selectedLog.raw, null, 2))}>
                        <Copy size={14} /> Copy JSON
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
