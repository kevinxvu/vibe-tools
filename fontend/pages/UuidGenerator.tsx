
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fingerprint, RefreshCw, Copy, Search, Check } from 'lucide-react';
import { Button, Input, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';

export const UuidGenerator: React.FC = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  const generateUuidV4 = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16)
    );
  };

  const generateUuidV7 = () => {
    const time = BigInt(Date.now());
    const value = new Uint8Array(16);
    crypto.getRandomValues(value);

    // Time (Big Endian)
    value[0] = Number((time >> 40n) & 0xffn);
    value[1] = Number((time >> 32n) & 0xffn);
    value[2] = Number((time >> 24n) & 0xffn);
    value[3] = Number((time >> 16n) & 0xffn);
    value[4] = Number((time >> 8n) & 0xffn);
    value[5] = Number(time & 0xffn);

    // Version 7 (0111)
    value[6] = (value[6] & 0x0f) | 0x70;

    // Variant (10)
    value[8] = (value[8] & 0x3f) | 0x80;

    return [...value]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  };

  const handleGenerate = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(version === 'v4' ? generateUuidV4() : generateUuidV7());
    }
    setUuids(newUuids);
  };

  const handleAnalyze = () => {
    const clean = analyzeInput.trim().toLowerCase();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    
    if (!uuidRegex.test(clean)) {
      setAnalysis({ error: 'Invalid UUID format' });
      return;
    }

    const versionChar = clean.charAt(14);
    const result: any = { version: `v${versionChar}`, valid: true };

    if (versionChar === '7') {
      const hexTs = clean.substring(0, 8) + clean.substring(9, 13);
      const timestamp = parseInt(hexTs, 16);
      result.timestamp = new Date(timestamp).toISOString();
      result.timestampRaw = timestamp;
    } else if (versionChar === '1') {
       result.type = "Time-based (MAC address)";
    } else if (versionChar === '4') {
       result.type = "Random";
    }

    setAnalysis(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t('tools.uuidGenerator.uuidCopied'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Fingerprint className="text-indigo-600" />
          UUID Generator
        </h1>
        <p className="text-sm text-slate-500">{t('tools.uuidGenerator.pageDescription')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generator */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('tools.uuidGenerator.generate')}</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('tools.uuidGenerator.version')}</label>
              <select 
                className="w-full h-10 px-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 outline-none"
                value={version}
                onChange={(e) => setVersion(e.target.value as any)}
              >
                <option value="v4">{t('tools.uuidGenerator.uuidv4')}</option>
                <option value="v7">{t('tools.uuidGenerator.uuidv7')}</option>
              </select>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('tools.uuidGenerator.count')}</label>
              <Input 
                type="number" 
                min="1" 
                max="100" 
                value={count} 
                onChange={(e) => setCount(parseInt(e.target.value))} 
              />
            </div>
          </div>
          <Button onClick={handleGenerate} className="w-full gap-2 mb-4">
            <RefreshCw size={16} /> {t('tools.uuidGenerator.generate')}
          </Button>

          {uuids.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto">
              {uuids.map((id, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-800 last:border-0">
                  <span className="font-mono text-sm text-slate-600 dark:text-slate-300">{id}</span>
                  <button 
                    onClick={() => copyToClipboard(id)}
                    className="text-slate-400 hover:text-indigo-500 p-1 transition-colors"
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Analyzer */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('tools.uuidGenerator.analyze')}</h2>
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder={t('tools.uuidGenerator.pasteUuid')} 
              value={analyzeInput}
              onChange={(e) => setAnalyzeInput(e.target.value)}
            />
            <Button variant="secondary" onClick={handleAnalyze}>
              <Search size={16} />
            </Button>
          </div>

          {analysis && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
               {analysis.error ? (
                 <div className="text-red-500 text-sm flex items-center gap-2">
                   <span className="font-bold">Error:</span> {analysis.error}
                 </div>
               ) : (
                 <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Version:</span>
                      <Badge color="indigo">{analysis.version}</Badge>
                    </div>
                    {analysis.timestamp && (
                      <div className="space-y-1">
                        <span className="text-sm text-slate-500 block">{t('tools.uuidGenerator.extractedTimestamp')}</span>
                        <div className="font-mono text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                          {analysis.timestamp}
                        </div>
                        <div className="text-xs text-slate-400">{t('tools.uuidGenerator.unixMs')} {analysis.timestampRaw}</div>
                      </div>
                    )}
                    {analysis.type && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Type:</span>
                        <span className="text-sm font-medium">{analysis.type}</span>
                      </div>
                    )}
                 </div>
               )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
