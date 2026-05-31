
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, RefreshCw, Copy, Search } from 'lucide-react';
import { Button, Input, Card, Badge } from '../components/UI';
import { useToast } from '../context/ToastContext';

export const SnowflakeGenerator: React.FC = () => {
  const [generatedId, setGeneratedId] = useState<string>('');
  const [analyzeId, setAnalyzeId] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  // Twitter Epoch: 1288834974657
  const EPOCH = 1288834974657n;
  const WORKER_ID_BITS = 5n;
  const DATA_CENTER_ID_BITS = 5n;
  const SEQUENCE_BITS = 12n;
  
  const MAX_WORKER_ID = -1n ^ (-1n << WORKER_ID_BITS);
  const MAX_DATA_CENTER_ID = -1n ^ (-1n << DATA_CENTER_ID_BITS);
  
  const WORKER_ID_SHIFT = SEQUENCE_BITS;
  const DATA_CENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
  const TIMESTAMP_LEFT_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATA_CENTER_ID_BITS;

  // Mock state for generation
  const [workerId, setWorkerId] = useState(1);
  const [dataCenterId, setDataCenterId] = useState(1);
  const [sequence, setSequence] = useState(0);

  const generateSnowflake = () => {
    const now = BigInt(Date.now());
    const worker = BigInt(workerId) & MAX_WORKER_ID;
    const dc = BigInt(dataCenterId) & MAX_DATA_CENTER_ID;
    const seq = BigInt(sequence); // In a real app, this would increment per ms

    const id = ((now - EPOCH) << TIMESTAMP_LEFT_SHIFT) |
               (dc << DATA_CENTER_ID_SHIFT) |
               (worker << WORKER_ID_SHIFT) |
               seq;
    
    setGeneratedId(id.toString());
    setSequence(prev => (prev + 1) % 4096);
  };

  const handleAnalyze = () => {
    try {
      const id = BigInt(analyzeId.trim());
      const timestamp = (id >> TIMESTAMP_LEFT_SHIFT) + EPOCH;
      const dcId = (id >> DATA_CENTER_ID_SHIFT) & MAX_DATA_CENTER_ID;
      const wId = (id >> WORKER_ID_SHIFT) & MAX_WORKER_ID;
      const seq = id & (-1n ^ (-1n << SEQUENCE_BITS));
      
      const date = new Date(Number(timestamp));

      setAnalysis({
        timestamp: date.toISOString(),
        unixMs: timestamp.toString(),
        dataCenterId: dcId.toString(),
        workerId: wId.toString(),
        sequence: seq.toString(),
        valid: true
      });
    } catch (e) {
      setAnalysis({ error: "Invalid Snowflake ID (Must be numeric)" });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedId);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="text-indigo-600" />
          Snowflake ID Generator
        </h1>
        <p className="text-sm text-slate-500">{t('tools.snowflakeGenerator.pageDescription')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generator */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Generate</h2>
          <div className="flex gap-4 mb-4">
            <Input 
              label="Worker ID (0-31)" 
              type="number" max="31" min="0" 
              value={workerId} 
              onChange={e => setWorkerId(parseInt(e.target.value))} 
            />
            <Input 
              label="Data Center ID (0-31)" 
              type="number" max="31" min="0" 
              value={dataCenterId} 
              onChange={e => setDataCenterId(parseInt(e.target.value))} 
            />
          </div>
          <Button onClick={generateSnowflake} className="w-full gap-2 mb-6">
            <RefreshCw size={16} /> Generate ID
          </Button>

          {generatedId && (
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <span className="block text-xs text-slate-500 mb-1">Generated Snowflake ID</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-300 tracking-wider">{generatedId}</span>
                <button 
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-indigo-500"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Analyzer */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Analyze / Extract</h2>
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder="Paste Snowflake ID..." 
              value={analyzeId}
              onChange={(e) => setAnalyzeId(e.target.value)}
            />
            <Button variant="secondary" onClick={handleAnalyze}>
              <Search size={16} />
            </Button>
          </div>

          {analysis && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
               {analysis.error ? (
                 <div className="text-red-500 text-sm font-medium">{analysis.error}</div>
               ) : (
                 <div className="space-y-3">
                    <div>
                        <span className="text-xs text-slate-500 uppercase font-semibold">Timestamp</span>
                        <div className="font-mono text-sm">{analysis.timestamp}</div>
                        <div className="text-xs text-slate-400">Unix ms: {analysis.unixMs}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                            <span className="text-xs text-slate-500">Worker ID</span>
                            <div className="font-mono">{analysis.workerId}</div>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500">DC ID</span>
                            <div className="font-mono">{analysis.dataCenterId}</div>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500">Sequence</span>
                            <div className="font-mono">{analysis.sequence}</div>
                        </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
