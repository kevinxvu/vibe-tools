
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Send, Plus, Trash2, Loader2, Clock, Database, AlertCircle, 
  Terminal, Copy, Download, FileJson, FileCode, FileText 
} from 'lucide-react';
import { Button, Input, Badge, Modal } from '../components/UI';
import { HttpRequestState, HttpResponseState } from '../types';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

export const HttpClient: React.FC = () => {
  const [request, setRequest] = useState<HttpRequestState>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    params: [],
    body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
    bodyType: 'json'
  });

  const [response, setResponse] = useState<HttpResponseState>({
    status: null,
    statusText: null,
    data: null,
    time: null,
    size: null,
    loading: false,
    error: null
  });

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('body');
  const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  
  const { showToast } = useToast();
  const { t } = useTranslation();

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  // Load saved state on mount
  const { loadState } = useToolState('http-client', {
    inputs: { request, activeTab },
    outputs: { response },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved && saved.inputs.request) {
      setRequest(saved.inputs.request);
      setActiveTab(saved.inputs.activeTab || 'body');
    }
  }, []);

  // Auto-save state
  useToolState('http-client', {
    inputs: { request, activeTab },
    outputs: { response },
  });

  // Initialize params from default URL on mount
  useEffect(() => {
    try {
      const urlObj = new URL(request.url);
      const newParams: { key: string; value: string }[] = [];
      urlObj.searchParams.forEach((value, key) => {
        newParams.push({ key, value });
      });
      if (request.params.length === 0 && newParams.length > 0) {
        setRequest(prev => ({ ...prev, params: newParams }));
      }
    } catch (e) {
      // Invalid URL init, ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Logic: URL <-> Params Sync ---

  const handleUrlChange = (newUrl: string) => {
    let newParams = [...request.params];
    
    try {
      if (newUrl.includes('?')) {
        // Handle potentially malformed URLs (e.g. spaces) by encoding only the query part locally for parsing
        const [base, query] = newUrl.split(/\?(.*)/s);
        const searchParams = new URLSearchParams(query); // URLSearchParams handles decoding automatically
        
        const extractedParams: { key: string; value: string }[] = [];
        searchParams.forEach((value, key) => {
          extractedParams.push({ key, value });
        });
        newParams = extractedParams;
      } else {
        const hasProtocol = newUrl.startsWith('http');
        if (hasProtocol && !newUrl.includes('?')) {
           newParams = [];
        }
      }
    } catch (e) {
      // If parsing fails, preserve existing params but allow typing in URL
    }

    setRequest(prev => ({ ...prev, url: newUrl, params: newParams }));
  };

  const updateUrlFromParams = (currentUrl: string, currentParams: { key: string; value: string }[]) => {
    try {
      // Split existing URL to preserve protocol and path, only replacing query string
      const [baseUrl] = currentUrl.split('?');
      
      const searchParams = new URLSearchParams();
      currentParams.forEach(p => {
        if (p.key) searchParams.append(p.key, p.value);
      });
      
      const queryString = searchParams.toString();
      
      // If base url is empty, just return query
      if (!baseUrl) return `?${queryString}`;
      
      // If we have params, append them
      if (queryString) {
        return `${baseUrl}?${queryString}`;
      }
      
      return baseUrl;
    } catch (e) {
      return currentUrl;
    }
  };

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...request.params];
    newParams[index][field] = value;
    
    const newUrl = updateUrlFromParams(request.url, newParams);
    setRequest(prev => ({ ...prev, params: newParams, url: newUrl }));
  };

  const addParam = () => {
    const newParams = [...request.params, { key: '', value: '' }];
    setRequest(prev => ({ ...prev, params: newParams }));
  };

  const removeParam = (index: number) => {
    const newParams = request.params.filter((_, i) => i !== index);
    const newUrl = updateUrlFromParams(request.url, newParams);
    setRequest(prev => ({ ...prev, params: newParams, url: newUrl }));
  };

  // --- Logic: Body Type & Headers Sync ---
  const handleBodyTypeChange = (type: 'json' | 'xml' | 'text') => {
    let contentType = 'text/plain';
    if (type === 'json') contentType = 'application/json';
    if (type === 'xml') contentType = 'application/xml';

    const newHeaders = [...request.headers];
    const ctIndex = newHeaders.findIndex(h => h.key.toLowerCase() === 'content-type');
    
    if (ctIndex >= 0) {
      newHeaders[ctIndex].value = contentType;
    } else {
      newHeaders.push({ key: 'Content-Type', value: contentType });
    }

    setRequest(prev => ({ ...prev, bodyType: type, headers: newHeaders }));
  };

  // --- Logic: Export cURL ---
  const generateCurl = () => {
    let cmd = `curl -X ${request.method} "${request.url}"`;
    
    request.headers.forEach(h => {
      if(h.key && h.value) {
        cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
      }
    });

    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      const safeBody = request.body.replace(/'/g, "'\\''");
      cmd += ` \\\n  -d '${safeBody}'`;
    }
    
    return cmd;
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    showToast(t('tools.httpClient.curlCopied'));
  };

  // --- Logic: Import cURL ---
  const parseCurl = (curlStr: string) => {
    try {
      let method = 'GET';
      let url = '';
      let headers: { key: string, value: string }[] = [];
      let body = '';

      const normalized = curlStr.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

      const methodMatch = normalized.match(/-X\s+([A-Z]+)/);
      if (methodMatch) method = methodMatch[1];

      const headerRegex = /(?:-H|--header)\s+["']([^"']+)["']/g;
      let hMatch;
      while ((hMatch = headerRegex.exec(normalized)) !== null) {
        const parts = hMatch[1].split(/:(.*)/);
        if (parts.length >= 2) {
          headers.push({ key: parts[0].trim(), value: parts[1].trim() });
        }
      }

      const dataRegex = /(?:-d|--data|--data-raw|--data-binary)\s+['"]((?:[^'"\\]|\\.)*)['"]/;
      const bodyMatch = normalized.match(dataRegex);
      if (bodyMatch) {
        body = bodyMatch[1];
        if (!methodMatch) method = 'POST';
      }

      const urlRegex = /https?:\/\/[^\s"']+/;
      const urlMatch = normalized.match(urlRegex);
      if (urlMatch) url = urlMatch[0];

      const params: { key: string; value: string }[] = [];
      if (url.includes('?')) {
        try {
          const [_, query] = url.split(/\?(.*)/s);
          const searchParams = new URLSearchParams(query);
          searchParams.forEach((value, key) => params.push({ key, value }));
        } catch(e) {}
      }

      let bodyType: 'json' | 'xml' | 'text' = 'text';
      const ct = headers.find(h => h.key.toLowerCase() === 'content-type')?.value?.toLowerCase();
      if (ct?.includes('json')) bodyType = 'json';
      else if (ct?.includes('xml')) bodyType = 'xml';

      setRequest({
        method: method as any,
        url,
        headers,
        params,
        body,
        bodyType
      });
      setIsCurlModalOpen(false);
      setCurlInput('');
      showToast(t('tools.httpClient.curlImported'), 'success');
    } catch (e) {
      alert("Failed to parse cURL. Please check format.");
    }
  };

  const handleSend = async () => {
    setResponse(prev => ({ ...prev, loading: true, error: null, data: null }));
    const startTime = performance.now();

    try {
      const headersInit: HeadersInit = {};
      request.headers.forEach(h => {
        if (h.key && h.value) headersInit[h.key] = h.value;
      });

      const options: RequestInit = {
        method: request.method,
        headers: headersInit,
      };

      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
        options.body = request.body;
      }

      const res = await fetch(request.url, options);
      const endTime = performance.now();
      
      const size = res.headers.get('content-length');
      
      const resContentType = res.headers.get('content-type');
      let data;
      
      if (resContentType && resContentType.includes('application/json')) {
        data = await res.json().catch(() => ({ error: 'Could not parse JSON' }));
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
        time: Math.round(endTime - startTime),
        size: size ? `${(parseInt(size) / 1024).toFixed(2)} KB` : 'Unknown',
        loading: false,
        error: null
      });

    } catch (err: any) {
      setResponse(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network Error'
      }));
    }
  };

  const addHeader = () => {
    setRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }));
  };

  const removeHeader = (index: number) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...request.headers];
    newHeaders[index][field] = value;
    setRequest(prev => ({ ...prev, headers: newHeaders }));
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'slate';
    if (status >= 200 && status < 300) return 'green';
    if (status >= 400) return 'red';
    return 'indigo';
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HTTP Client</h1>
          <p className="text-sm text-slate-500">{t('tools.httpClient.pageDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsCurlModalOpen(true)} className="gap-2">
            <Download size={16} className="rotate-180" /> {t('tools.httpClient.importCurl')}
          </Button>
          <Button variant="secondary" size="sm" onClick={copyCurl} className="gap-2">
            <Copy size={16} /> {t('tools.httpClient.copyCurl')}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <select 
          className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={request.method}
          onChange={e => setRequest({...request, method: e.target.value as any})}
        >
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Input 
          className="font-mono text-sm" 
          value={request.url}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="https://api.example.com/v1/..."
        />
        <Button onClick={handleSend} disabled={response.loading} className="min-w-[100px]">
          {response.loading ? <Loader2 className="animate-spin" size={18} /> : <div className="flex items-center gap-2"><Send size={16} /> Send</div>}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        <div className="h-[600px] lg:h-auto lg:flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {['body', 'headers', 'params'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'headers' && <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{request.headers.length}</span>}
                {tab === 'params' && <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{request.params.length}</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'headers' && (
              <div className="space-y-2">
                {request.headers.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      placeholder="Key" 
                      value={h.key} 
                      onChange={e => updateHeader(i, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      placeholder="Value" 
                      value={h.value} 
                      onChange={e => updateHeader(i, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeHeader(i)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addHeader} className="mt-2 gap-1">
                  <Plus size={14} /> {t('tools.httpClient.addHeader')}
                </Button>
              </div>
            )}

            {activeTab === 'params' && (
              <div className="space-y-2">
                 <p className="text-xs text-slate-500 mb-2">{t('tools.httpClient.queryParams')}</p>
                {request.params.length === 0 && (
                   <div className="text-sm text-slate-400 text-center py-4 italic">
                     {t('tools.httpClient.noParams')}
                   </div>
                )}
                {request.params.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input 
                      placeholder="Key" 
                      value={p.key} 
                      onChange={e => handleParamChange(i, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      placeholder="Value" 
                      value={p.value} 
                      onChange={e => handleParamChange(i, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeParam(i)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addParam} className="mt-2 gap-1">
                  <Plus size={14} /> {t('tools.httpClient.addParam')}
                </Button>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="h-full flex flex-col">
                 <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => handleBodyTypeChange('json')}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${request.bodyType === 'json' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <FileJson size={14} /> JSON
                    </button>
                    <button 
                      onClick={() => handleBodyTypeChange('xml')}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${request.bodyType === 'xml' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <FileCode size={14} /> XML
                    </button>
                    <button 
                      onClick={() => handleBodyTypeChange('text')}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${request.bodyType === 'text' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <FileText size={14} /> Text
                    </button>
                 </div>
                 <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                   <CodeEditor 
                    value={request.body}
                    onChange={val => setRequest({...request, body: val})}
                    disabled={request.method === 'GET' || request.method === 'HEAD'}
                    placeholder={request.method === 'GET' ? 'Body not allowed for GET requests' : 'Enter request body...'}
                   />
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-[600px] lg:h-auto lg:flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
           <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-500">Status:</span>
                 {response.status ? (
                   <Badge color={getStatusColor(response.status) as any}>
                     {response.status} {response.statusText}
                   </Badge>
                 ) : <span className="text-slate-400 text-sm">--</span>}
               </div>
               <div className="flex items-center gap-1 text-xs text-slate-500">
                 <Clock size={12} />
                 <span>{response.time ? `${response.time}ms` : '--'}</span>
               </div>
               <div className="flex items-center gap-1 text-xs text-slate-500">
                 <Database size={12} />
                 <span>{response.size || '--'}</span>
               </div>
             </div>
           </div>

           <div className="flex-1 overflow-auto relative">
             {response.loading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                 <Loader2 className="animate-spin text-indigo-500" size={32} />
               </div>
             ) : response.error ? (
               <div className="h-full flex flex-col items-center justify-center text-red-500 p-6 text-center">
                 <AlertCircle size={48} className="mb-4 opacity-50" />
                 <h3 className="text-lg font-semibold">{t('tools.httpClient.requestFailed')}</h3>
                 <p className="text-sm opacity-80 mt-2">{response.error}</p>
                 <p className="text-xs text-slate-400 mt-4 max-w-xs">{t('tools.httpClient.corsHint')}</p>
               </div>
             ) : response.data ? (
                <pre className="p-4 text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300 overflow-auto h-full whitespace-pre-wrap">
                  {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
                </pre>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                 <Send size={48} className="mb-4 opacity-20" />
                 <p>{t('tools.httpClient.waitingForInput')}</p>
               </div>
             )}
           </div>
        </div>
      </div>

      <Modal 
        isOpen={isCurlModalOpen} 
        onClose={() => setIsCurlModalOpen(false)} 
        title="Import cURL"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Paste a cURL command below to import method, URL, headers, and body.
          </p>
          <textarea 
            className="w-full h-48 p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder={`curl -X POST https://api.example.com \\\n -H "Content-Type: application/json" \\\n -d '{"foo":"bar"}'`}
            value={curlInput}
            onChange={e => setCurlInput(e.target.value)}
            spellCheck={false}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCurlModalOpen(false)}>Cancel</Button>
            <Button onClick={() => parseCurl(curlInput)}>Import</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
