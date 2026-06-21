
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, ArrowLeft, Copy, Trash2, Check, AlertCircle } from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

type Mode = 'decoder' | 'encoder';

type TimestampField = {
  path: string;
  value: string;
  unit: 's' | 'ms';
  date: Date;
};

// Helper to handle Base64URL encoding/decoding
const base64UrlDecode = (str: string) => {
  // Replace standard Base64 characters to Base64URL
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with =
  switch (output.length % 4) {
    case 0: break;
    case 2: output += '=='; break;
    case 3: output += '='; break;
    default: throw new Error('Illegal base64url string!');
  }
  return decodeURIComponent(escape(atob(output))); // UTF-8 decode
};

const base64UrlEncode = (str: string) => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const getTimestampDate = (value: unknown): Pick<TimestampField, 'unit' | 'date'> | null => {
  const rawValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^-?\d+$/.test(value)
      ? Number(value)
      : null;

  if (rawValue === null || !Number.isSafeInteger(rawValue)) return null;

  const secondsDate = new Date(rawValue * 1000);
  if (rawValue >= 946684800 && rawValue <= 4102444800 && !Number.isNaN(secondsDate.getTime())) {
    return { unit: 's', date: secondsDate };
  }

  const millisecondsDate = new Date(rawValue);
  if (rawValue >= 946684800000 && rawValue <= 4102444800000 && !Number.isNaN(millisecondsDate.getTime())) {
    return { unit: 'ms', date: millisecondsDate };
  }

  return null;
};

const collectTimestampFields = (value: unknown, path = ''): TimestampField[] => {
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectTimestampFields(item, `${path}[${index}]`));
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextPath = path ? `${path}.${key}` : key;
    const timestamp = getTimestampDate(nestedValue);

    if (timestamp) {
      return [{
        path: nextPath,
        value: String(nestedValue),
        ...timestamp,
      }];
    }

    return collectTimestampFields(nestedValue, nextPath);
  });
};

const formatClientDateTime = (date: Date) => date.toString();

// Signature helpers using Web Crypto API
async function signHmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC", cryptoKey, encoder.encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const JwtTool: React.FC = () => {
  const [mode, setMode] = useState<Mode>('decoder');
  const { showToast } = useToast();
  const { t } = useTranslation();

  // --- Decoder State ---
  const [encodedToken, setEncodedToken] = useState('');
  const [decodedHeader, setDecodedHeader] = useState('');
  const [decodedPayload, setDecodedPayload] = useState('');
  const [decodedPayloadData, setDecodedPayloadData] = useState<unknown | null>(null);
  const [decodeSecret, setDecodeSecret] = useState('');
  const [decodeStatus, setDecodeStatus] = useState<'valid' | 'invalid' | 'unknown'>('unknown');
  const [isFormatValid, setIsFormatValid] = useState(false);

  // --- Encoder State ---
  const [headerInput, setHeaderInput] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadInput, setPayloadInput] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [encodeSecret, setEncodeSecret] = useState('secret');
  const [generatedToken, setGeneratedToken] = useState('');
  const clientTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local timezone', []);
  const payloadTimestampFields = useMemo(() => collectTimestampFields(decodedPayloadData), [decodedPayloadData]);

  // Load saved state on mount
  const { loadState } = useToolState('jwt-tool', {
    inputs: { mode, encodedToken, decodeSecret, headerInput, payloadInput, encodeSecret },
    outputs: { decodedHeader, decodedPayload, generatedToken },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setMode(saved.inputs.mode || 'decoder');
      setEncodedToken(saved.inputs.encodedToken || '');
      setDecodeSecret(saved.inputs.decodeSecret || '');
      setHeaderInput(saved.inputs.headerInput || '{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
      setPayloadInput(saved.inputs.payloadInput || '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
      setEncodeSecret(saved.inputs.encodeSecret || 'secret');
      setGeneratedToken(saved.outputs.generatedToken || '');
    }
  }, []);

  // Auto-save state
  useToolState('jwt-tool', {
    inputs: { mode, encodedToken, decodeSecret, headerInput, payloadInput, encodeSecret },
    outputs: { decodedHeader, decodedPayload, generatedToken },
  });

  // --- Decoder Logic ---
  useEffect(() => {
    if (!encodedToken.trim()) {
      setDecodedHeader('');
      setDecodedPayload('');
      setDecodedPayloadData(null);
      setIsFormatValid(false);
      setDecodeStatus('unknown');
      return;
    }

    try {
      const parts = encodedToken.split('.');
      if (parts.length !== 3) throw new Error("Invalid JWT Format");

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));

      setDecodedHeader(JSON.stringify(header, null, 2));
      setDecodedPayload(JSON.stringify(payload, null, 2));
      setDecodedPayloadData(payload);
      setIsFormatValid(true);

      verifySignature(parts[0], parts[1], parts[2], decodeSecret);
    } catch (e) {
      setDecodedHeader('');
      setDecodedPayload('');
      setDecodedPayloadData(null);
      setIsFormatValid(false);
      setDecodeStatus('invalid');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encodedToken, decodeSecret]);

  const verifySignature = async (head: string, pay: string, sig: string, secret: string) => {
    if (!secret) {
      setDecodeStatus('unknown');
      return;
    }
    try {
      const computedSig = await signHmacSha256(secret, `${head}.${pay}`);
      setDecodeStatus(computedSig === sig ? 'valid' : 'invalid');
    } catch (e) {
      setDecodeStatus('invalid');
    }
  };

  // --- Encoder Logic ---
  useEffect(() => {
    generateJwt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerInput, payloadInput, encodeSecret]);

  const generateJwt = async () => {
    try {
      // Validate JSON
      JSON.parse(headerInput);
      JSON.parse(payloadInput);

      // Encode
      const encHeader = base64UrlEncode(headerInput.replace(/\s/g, '')); // Minify before encode
      const encPayload = base64UrlEncode(payloadInput.replace(/\s/g, ''));
      
      const signature = await signHmacSha256(encodeSecret, `${encHeader}.${encPayload}`);
      
      setGeneratedToken(`${encHeader}.${encPayload}.${signature}`);
    } catch (e) {
      // If JSON is invalid, don't generate
      setGeneratedToken('');
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" />
          JWT Decoder / Encoder
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.jwtTool.pageDescription')}
        </p>
      </div>

      {/* Toggle Mode */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex mb-6 shadow-inner max-w-md">
        <button
          onClick={() => setMode('decoder')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'decoder'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('tools.jwtTool.decoderTab')}
        </button>
        <button
          onClick={() => setMode('encoder')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'encoder'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.01]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {t('tools.jwtTool.encoderTab')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {mode === 'decoder' ? (
          <>
            {/* LEFT: Token Input */}
            <div className="lg:w-5/12 flex flex-col lg:min-h-0 min-w-0">
              <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.jwtTool.encodedToken')}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setEncodedToken('')} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    <button onClick={() => copyToClipboard(encodedToken)} className="text-slate-400 hover:text-indigo-500"><Copy size={16} /></button>
                  </div>
                </div>
                
                {/* Status Bar inside input area */}
                <div className={`px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-medium ${
                  isFormatValid 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                    : encodedToken ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
                }`}>
                  {isFormatValid ? t('tools.jwtTool.validFormat') : encodedToken ? t('tools.jwtTool.invalidFormat') : t('tools.jwtTool.enterJwt')}
                  {decodeStatus === 'valid' && <span className="flex items-center gap-1 ml-auto"><Check size={12}/> {t('tools.jwtTool.signatureVerified')}</span>}
                  {decodeStatus === 'invalid' && <span className="flex items-center gap-1 ml-auto"><AlertCircle size={12}/> {t('tools.jwtTool.signatureInvalid')}</span>}
                </div>

                <CodeEditor 
                  value={encodedToken} 
                  onChange={setEncodedToken}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="font-mono text-sm leading-relaxed"
                />
              </Card>
            </div>

            {/* RIGHT: Decoded Output */}
            <div className="lg:flex-1 flex flex-col gap-4 lg:overflow-y-auto pr-1">
              {/* Header */}
              <Card className="flex-1 min-h-[150px] p-0 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Header</span>
                  <button onClick={() => copyToClipboard(decodedHeader)} className="text-slate-400 hover:text-indigo-500"><Copy size={14} /></button>
                </div>
                <CodeEditor 
                   value={decodedHeader} 
                   onChange={() => {}} 
                   readOnly={true} 
                   className="bg-transparent"
                />
              </Card>

              {/* Payload */}
              <Card className="flex-[2] min-h-[200px] p-0 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Payload</span>
                  <button onClick={() => copyToClipboard(decodedPayload)} className="text-slate-400 hover:text-indigo-500"><Copy size={14} /></button>
                </div>
                {payloadTimestampFields.length > 0 && (
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/60 dark:bg-indigo-950/20">
                    <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Timestamp fields
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {payloadTimestampFields.map((field) => (
                        <div
                          key={`${field.path}-${field.value}`}
                          className="rounded-md border border-indigo-100 dark:border-indigo-900/60 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                        >
                          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{field.path}</span>
                          <span className="mx-1 text-slate-400">=</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{field.value}</span>
                          <span className="ml-1 text-slate-400">({field.unit})</span>
                          <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                          <span className="font-mono text-slate-700 dark:text-slate-200">{formatClientDateTime(field.date)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <CodeEditor 
                   value={decodedPayload} 
                   onChange={() => {}} 
                   readOnly={true} 
                   className="bg-transparent"
                />
              </Card>

              {/* Signature Verification */}
              <Card className="p-4 border-l-4 border-l-indigo-500">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('tools.jwtTool.verifySignature')}</h3>
                <div className="flex gap-2">
                   <Input 
                     placeholder="Enter secret to verify..." 
                     value={decodeSecret}
                     onChange={e => setDecodeSecret(e.target.value)}
                     className="font-mono text-sm"
                   />
                </div>
                {decodeStatus !== 'unknown' && (
                  <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${decodeStatus === 'valid' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {decodeStatus === 'valid' ? <Check size={14} /> : <AlertCircle size={14} />}
                    {decodeStatus === 'valid' ? t('tools.jwtTool.signatureVerified') : t('tools.jwtTool.invalidSignature')}
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* ENCODER MODE */}
            <div className="lg:w-5/12 flex flex-col gap-4 lg:overflow-y-auto">
               <Card className="flex-1 min-h-[150px] p-0 overflow-hidden">
                 <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Header</span>
                 </div>
                 <CodeEditor value={headerInput} onChange={setHeaderInput} />
               </Card>
               <Card className="flex-[2] min-h-[200px] p-0 overflow-hidden">
                 <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Payload</span>
                 </div>
                 <CodeEditor value={payloadInput} onChange={setPayloadInput} />
               </Card>
               <Card className="p-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Secret (HMAC SHA256)</label>
                  <Input 
                     value={encodeSecret} 
                     onChange={e => setEncodeSecret(e.target.value)}
                     className="font-mono"
                  />
               </Card>
            </div>

            <div className="lg:flex-1 flex flex-col lg:min-h-0 min-w-0">
               <Card className="h-full flex flex-col p-0 overflow-hidden border-2 border-indigo-100 dark:border-slate-700">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.jwtTool.generatedToken')}</span>
                    <button onClick={() => copyToClipboard(generatedToken)} className="text-slate-400 hover:text-indigo-500 flex items-center gap-1 text-xs">
                       <Copy size={14} /> {t('common.copy')}
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
                     {generatedToken ? (
                        <div className="p-4 break-all font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                           {generatedToken}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                           <ShieldCheck size={48} className="mb-4 opacity-20" />
                           <p>{t('tools.jwtTool.fixJson')}</p>
                        </div>
                     )}
                  </div>
               </Card>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
