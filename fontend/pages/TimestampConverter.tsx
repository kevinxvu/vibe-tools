
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useToolState } from '../lib/useToolState';

export const TimestampConverter: React.FC = () => {
  const [now, setNow] = useState(Date.now());
  const [inputTs, setInputTs] = useState('');
  const [inputFormat, setInputFormat] = useState<'s'|'ms'|'ns'>('s');
  const [outputDate, setOutputDate] = useState('');
  
  const [inputDate, setInputDate] = useState('');
  const [outputTs, setOutputTs] = useState('');
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('timestamp-converter', {
    inputs: { inputTs, inputFormat, inputDate },
    outputs: { outputDate, outputTs },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInputTs(saved.inputs.inputTs || '');
      setInputFormat(saved.inputs.inputFormat || 's');
      setInputDate(saved.inputs.inputDate || '');
      setOutputDate(saved.outputs.outputDate || '');
      setOutputTs(saved.outputs.outputTs || '');
    }
  }, []);

  // Auto-save state
  useToolState('timestamp-converter', {
    inputs: { inputTs, inputFormat, inputDate },
    outputs: { outputDate, outputTs },
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const convertTimestamp = () => {
    if (!inputTs) return;
    try {
      let ms = 0;
      let nsPart = '000000000';
      
      const val = inputTs.trim();
      
      if (inputFormat === 's') {
        ms = parseInt(val) * 1000;
      } else if (inputFormat === 'ms') {
        ms = parseInt(val);
      } else {
        // Nanoseconds
        if (val.length > 13) {
           const msStr = val.substring(0, val.length - 6);
           ms = parseInt(msStr);
           nsPart = val.substring(val.length - 6).padEnd(6, '0') + "000"; // rough approx logic for display
        } else {
           ms = parseInt(val) / 1000000;
        }
      }

      const date = new Date(ms);
      if (isNaN(date.getTime())) {
        setOutputDate("Invalid Date");
        return;
      }
      
      // RFC3339Nano style
      setOutputDate(date.toISOString());
    } catch(e) {
      setOutputDate("Error");
    }
  };

  const convertDate = () => {
    try {
      const date = new Date(inputDate);
      if (isNaN(date.getTime())) {
        setOutputTs("Invalid Date Format");
        return;
      }
      
      const ms = date.getTime();
      setOutputTs(`Seconds: ${Math.floor(ms / 1000)}\nMilliseconds: ${ms}\nNanoseconds: ${ms}000000`);
    } catch(e) {
      setOutputTs("Error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t('tools.timestampConverter.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="text-indigo-600" />
          Timestamp Converter
        </h1>
        <p className="text-sm text-slate-500">{t('tools.timestampConverter.pageDescription')}</p>
      </div>

      {/* Current Time Banner */}
      <Card className="mb-8 p-6 flex flex-col md:flex-row items-center justify-between border-t-4 border-t-indigo-500">
         <div>
           <span className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{t('tools.timestampConverter.currentUnixTime')}</span>
           <div className="flex items-center gap-3 mt-1">
             <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white">{Math.floor(now / 1000)}</div>
             <button 
               onClick={() => copyToClipboard(Math.floor(now / 1000).toString())}
               className="text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors p-1"
               title="Copy Seconds"
             >
               <Copy size={20} />
             </button>
           </div>
         </div>
         <div className="flex flex-col items-end mt-4 md:mt-0 gap-1">
           <div className="flex items-center gap-2">
             <div className="font-mono text-slate-600 dark:text-slate-300">{now} <span className="text-xs text-slate-400">ms</span></div>
             <button 
               onClick={() => copyToClipboard(now.toString())}
               className="text-slate-400 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors p-1"
               title="Copy Milliseconds"
             >
               <Copy size={14} />
             </button>
           </div>
           <div className="flex items-center gap-2">
             <div className="font-mono text-slate-600 dark:text-slate-300">{now}000000 <span className="text-xs text-slate-400">ns</span></div>
             <button 
               onClick={() => copyToClipboard(`${now}000000`)}
               className="text-slate-400 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400 transition-colors p-1"
               title="Copy Nanoseconds"
             >
               <Copy size={14} />
             </button>
           </div>
           <div className="flex items-center gap-2 mt-1">
             <div className="font-medium text-lg text-indigo-600 dark:text-indigo-400">{new Date(now).toISOString()}</div>
             <button 
               onClick={() => copyToClipboard(new Date(now).toISOString())}
               className="text-indigo-400 hover:text-indigo-600 dark:text-indigo-400/70 dark:hover:text-indigo-300 transition-colors p-1"
               title="Copy ISO Date"
             >
               <Copy size={16} />
             </button>
           </div>
         </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TS -> Date */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('tools.timestampConverter.timestampToDate')}</h2>
          <div className="flex gap-2 mb-4">
             <Input 
                placeholder="1696500000" 
                value={inputTs} 
                onChange={e => setInputTs(e.target.value)} 
                type="number"
             />
             <select 
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={inputFormat}
                onChange={e => setInputFormat(e.target.value as any)}
             >
               <option value="s">Seconds</option>
               <option value="ms">Milliseconds</option>
               <option value="ns">Nanoseconds</option>
             </select>
          </div>
          <Button onClick={convertTimestamp} className="w-full mb-4">{t('tools.timestampConverter.convert')} <ArrowRight size={16} className="ml-2" /></Button>
          
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[60px] flex items-center justify-between">
            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{outputDate || 'Result...'}</span>
            {outputDate && <button onClick={() => copyToClipboard(outputDate)} className="text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>}
          </div>
        </Card>

        {/* Date -> TS */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t('tools.timestampConverter.dateToTimestamp')}</h2>
          <div className="mb-4">
            <Input 
              placeholder="YYYY-MM-DDTHH:mm:ss.sssZ" 
              value={inputDate} 
              onChange={e => setInputDate(e.target.value)} 
            />
            <p className="text-xs text-slate-400 mt-1">{t('tools.timestampConverter.isoFormat')}</p>
          </div>
          <Button onClick={convertDate} variant="secondary" className="w-full mb-4">{t('tools.timestampConverter.convert')} <ArrowRight size={16} className="ml-2" /></Button>
          
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 min-h-[60px] relative">
            <pre className="font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{outputTs || 'Result...'}</pre>
            {outputTs && <button onClick={() => copyToClipboard(outputTs)} className="absolute top-4 right-4 text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>}
          </div>
        </Card>
      </div>
    </div>
  );
};
