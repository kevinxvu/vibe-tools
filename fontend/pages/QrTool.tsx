import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode, Upload, Copy, Download, X, Link, Mail, Phone,
  Wifi, FileText, Loader2, ImageIcon, ExternalLink, RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Button, Card } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { useToolState } from '../lib/useToolState';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'generator' | 'reader';
type ECLevel = 'L' | 'M' | 'Q' | 'H';
type QrSize = 256 | 512 | 1024;
type ContentType = 'url' | 'email' | 'phone' | 'wifi' | 'vcard' | 'text';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectContentType(value: string): ContentType {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return 'url';
  if (/^mailto:/i.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';
  if (/^tel:/i.test(v) || /^\+?[\d\s\-().]{7,}$/.test(v)) return 'phone';
  if (/^WIFI:/i.test(v)) return 'wifi';
  if (/^BEGIN:VCARD/i.test(v)) return 'vcard';
  return 'text';
}

const CONTENT_TYPE_META: Record<ContentType, { label: string; color: string; Icon: React.FC<{ size?: number }> }> = {
  url:   { label: 'URL',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',   Icon: Link },
  email: { label: 'Email',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', Icon: Mail },
  phone: { label: 'Phone',  color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', Icon: Phone },
  wifi:  { label: 'WiFi',   color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',       Icon: Wifi },
  vcard: { label: 'vCard',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', Icon: FileText },
  text:  { label: 'Text',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',  Icon: FileText },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const QrTool: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // ── Shared state ──
  const [activeTab, setActiveTab] = useState<Tab>('generator');

  // ── Generator state ──
  const [genInput, setGenInput]     = useState('');
  const [genSize, setGenSize]       = useState<QrSize>(512);
  const [genEcc, setGenEcc]         = useState<ECLevel>('M');
  const [genFg, setGenFg]           = useState('#000000');
  const [genBg, setGenBg]           = useState('#ffffff');
  const [genMargin, setGenMargin]   = useState(2);
  const [genQrUrl, setGenQrUrl]     = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const genCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Reader state ──
  const [readImage, setReadImage]       = useState<string | null>(null);
  const [readResult, setReadResult]     = useState<string>('');
  const [readLoading, setReadLoading]   = useState(false);
  const [readDragActive, setReadDragActive] = useState(false);
  const [readError, setReadError]       = useState<string>('');
  const readFileRef = useRef<HTMLInputElement>(null);

  // ── Tool state persistence ──
  const { loadState } = useToolState('qr-tool', {
    inputs:  { activeTab, genInput, genSize, genEcc, genFg, genBg, genMargin },
    outputs: { readResult },
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setActiveTab(saved.inputs.activeTab || 'generator');
      setGenInput(saved.inputs.genInput || '');
      setGenSize(saved.inputs.genSize || 512);
      setGenEcc(saved.inputs.genEcc || 'M');
      setGenFg(saved.inputs.genFg || '#000000');
      setGenBg(saved.inputs.genBg || '#ffffff');
      setGenMargin(saved.inputs.genMargin ?? 2);
      setReadResult(saved.outputs.readResult || '');
    }
  }, []);

  useToolState('qr-tool', {
    inputs:  { activeTab, genInput, genSize, genEcc, genFg, genBg, genMargin },
    outputs: { readResult },
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  GENERATOR — QR rendering
  // ─────────────────────────────────────────────────────────────────────────

  const renderQR = useCallback(async () => {
    if (!genInput.trim()) { setGenQrUrl(null); return; }
    setGenLoading(true);
    try {
      const effectiveEcc: ECLevel = logoDataUrl ? 'H' : genEcc;
      const dataUrl = await QRCode.toDataURL(genInput, {
        width: genSize,
        margin: genMargin,
        color: { dark: genFg, light: genBg },
        errorCorrectionLevel: effectiveEcc,
      });

      if (logoDataUrl) {
        // Composite logo onto QR using canvas
        const canvas = document.createElement('canvas');
        canvas.width = genSize;
        canvas.height = genSize;
        const ctx = canvas.getContext('2d')!;

        const qrImg = new Image();
        await new Promise<void>((res) => {
          qrImg.onload = () => res();
          qrImg.src = dataUrl;
        });
        ctx.drawImage(qrImg, 0, 0, genSize, genSize);

        const logoImg = new Image();
        await new Promise<void>((res) => {
          logoImg.onload = () => res();
          logoImg.src = logoDataUrl;
        });

        const logoSize = genSize * 0.22;
        const cx = (genSize - logoSize) / 2;
        const cy = (genSize - logoSize) / 2;
        const radius = logoSize * 0.15;
        const pad = logoSize * 0.06;

        // White background rounded rect
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - pad + radius, cy - pad);
        ctx.lineTo(cx + logoSize + pad - radius, cy - pad);
        ctx.quadraticCurveTo(cx + logoSize + pad, cy - pad, cx + logoSize + pad, cy - pad + radius);
        ctx.lineTo(cx + logoSize + pad, cy + logoSize + pad - radius);
        ctx.quadraticCurveTo(cx + logoSize + pad, cy + logoSize + pad, cx + logoSize + pad - radius, cy + logoSize + pad);
        ctx.lineTo(cx - pad + radius, cy + logoSize + pad);
        ctx.quadraticCurveTo(cx - pad, cy + logoSize + pad, cx - pad, cy + logoSize + pad - radius);
        ctx.lineTo(cx - pad, cy - pad + radius);
        ctx.quadraticCurveTo(cx - pad, cy - pad, cx - pad + radius, cy - pad);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        ctx.drawImage(logoImg, cx, cy, logoSize, logoSize);

        setGenQrUrl(canvas.toDataURL('image/png'));
      } else {
        setGenQrUrl(dataUrl);
      }
    } catch {
      showToast(t('tools.qrTool.generateFailed'), 'error');
      setGenQrUrl(null);
    } finally {
      setGenLoading(false);
    }
  }, [genInput, genSize, genEcc, genFg, genBg, genMargin, logoDataUrl, showToast, t]);

  useEffect(() => {
    const timer = setTimeout(() => renderQR(), 300);
    return () => clearTimeout(timer);
  }, [renderQR]);

  const handleDownload = () => {
    if (!genQrUrl) return;
    const a = document.createElement('a');
    a.href = genQrUrl;
    a.download = 'qrcode.png';
    a.click();
    showToast(t('tools.qrTool.downloaded'));
  };

  const handleCopyQr = async () => {
    if (!genQrUrl) return;
    try {
      const res = await fetch(genQrUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast(t('tools.qrTool.imageCopied'));
    } catch {
      showToast(t('tools.qrTool.copyFailed'), 'error');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoDataUrl(ev.target?.result as string);
      if (genEcc !== 'H') setGenEcc('H');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoDataUrl(null);
    if (logoFileRef.current) logoFileRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  READER — decode QR from image
  // ─────────────────────────────────────────────────────────────────────────

  const tryDecodeOnCanvas = (img: HTMLImageElement, scale: number, mode: 'normal' | 'highContrast' | 'binarize'): string | null => {
    const canvas = document.createElement('canvas');
    const minSize = 400;
    const finalW = Math.max(Math.round(img.width * scale), minSize);
    const finalH = Math.max(Math.round(img.height * scale), minSize);
    canvas.width = finalW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d')!;

    if (mode === 'highContrast') {
      ctx.filter = 'contrast(200%) brightness(110%) grayscale(100%)';
    }
    ctx.drawImage(img, 0, 0, finalW, finalH);

    let imageData = ctx.getImageData(0, 0, finalW, finalH);

    // Hard binarize pass — convert each pixel to pure black or white
    if (mode === 'binarize') {
      const data = new Uint8ClampedArray(imageData.data);
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const v = lum < 128 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      imageData = new ImageData(data, finalW, finalH);
    }

    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    return result ? result.data : null;
  };

  const decodeImage = (img: HTMLImageElement) => {
    // Try progressively: normal → upscaled → high-contrast → binarize → binarize upscaled
    const passes: Array<{ scale: number; mode: 'normal' | 'highContrast' | 'binarize' }> = [
      { scale: 1, mode: 'normal'       },
      { scale: 2, mode: 'normal'       },
      { scale: 4, mode: 'normal'       },
      { scale: 1, mode: 'highContrast' },
      { scale: 2, mode: 'highContrast' },
      { scale: 1, mode: 'binarize'     },
      { scale: 2, mode: 'binarize'     },
      { scale: 4, mode: 'binarize'     },
    ];

    let decoded: string | null = null;
    for (const { scale, mode } of passes) {
      decoded = tryDecodeOnCanvas(img, scale, mode);
      if (decoded) break;
    }

    if (decoded) {
      setReadResult(decoded);
      showToast(t('tools.qrTool.decodeSuccess'), 'success');
    } else {
      setReadError(t('tools.qrTool.decodeNoQr'));
      showToast(t('tools.qrTool.decodeNoQr'), 'error');
    }
    setReadLoading(false);
  };

  const decodeQrFromFile = (file: File) => {
    setReadError('');
    setReadResult('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;

      // 1️⃣ Show image immediately — React will render before decode starts
      setReadImage(dataUrl);
      setReadLoading(true);

      // 2️⃣ Decode asynchronously after React has painted the image
      const img = new Image();
      img.onload = () => {
        // Use setTimeout to yield to the browser's render cycle first
        setTimeout(() => decodeImage(img), 0);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };


  const handleReadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) decodeQrFromFile(file);
  };

  const handleReadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setReadDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) decodeQrFromFile(file);
  };

  // Global paste handler for Reader tab
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'reader') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], 'pasted.png', { type: blob.type });
            decodeQrFromFile(file);
            e.preventDefault();
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  const clearReader = () => {
    setReadImage(null);
    setReadResult('');
    setReadError('');
    if (readFileRef.current) readFileRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Derived values
  // ─────────────────────────────────────────────────────────────────────────

  const contentType = genInput.trim() ? detectContentType(genInput) : null;
  const readContentType = readResult ? detectContentType(readResult) : null;

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="text-indigo-600" />
          {t('tools.qrTool.pageTitle')}
        </h1>
        <p className="text-sm text-slate-500">{t('tools.qrTool.pageDescription')}</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit gap-1">
        {(['generator', 'reader'] as Tab[]).map((tab) => (
          <button
            key={tab}
            id={`qr-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t(`tools.qrTool.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* ════════════ GENERATOR TAB ════════════ */}
      {activeTab === 'generator' && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: Controls */}
          <div className="lg:w-[420px] flex flex-col gap-4">

            {/* Input */}
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('tools.qrTool.inputLabel')}
                </label>
                <div className="flex items-center gap-2">
                  {contentType && (() => {
                    const meta = CONTENT_TYPE_META[contentType];
                    const Icon = meta.Icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-slate-400">{genInput.length} chars</span>
                </div>
              </div>
              <textarea
                id="qr-generator-input"
                rows={5}
                value={genInput}
                onChange={(e) => setGenInput(e.target.value)}
                placeholder={t('tools.qrTool.inputPlaceholder')}
                className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </Card>

            {/* Options */}
            <Card className="p-4 flex flex-col gap-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('tools.qrTool.options')}</p>

              {/* Size */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">{t('tools.qrTool.size')}</label>
                <div className="flex gap-2">
                  {([256, 512, 1024] as QrSize[]).map((s) => (
                    <button
                      key={s}
                      id={`qr-size-${s}`}
                      onClick={() => setGenSize(s)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        genSize === s
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                      }`}
                    >
                      {s}px
                    </button>
                  ))}
                </div>
              </div>


              {/* Colors */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">{t('tools.qrTool.colorDark')}</label>
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
                    <input id="qr-color-dark" type="color" value={genFg} onChange={(e) => setGenFg(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{genFg}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">{t('tools.qrTool.colorLight')}</label>
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
                    <input id="qr-color-light" type="color" value={genBg} onChange={(e) => setGenBg(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{genBg}</span>
                  </div>
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
                  {t('tools.qrTool.margin')}: <span className="text-indigo-500 font-semibold">{genMargin}</span>
                </label>
                <input
                  id="qr-margin"
                  type="range" min={0} max={4} step={1} value={genMargin}
                  onChange={(e) => setGenMargin(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </Card>

            {/* Logo upload */}
            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('tools.qrTool.logoTitle')}</p>
              <p className="text-xs text-slate-400 mb-3">{t('tools.qrTool.logoHint')}</p>
              {logoDataUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoDataUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{t('tools.qrTool.logoActive')}</p>
                  </div>
                  <button
                    id="qr-logo-remove"
                    onClick={removeLogo}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition"
                    title={t('tools.qrTool.removeLogo')}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  id="qr-logo-upload"
                  onClick={() => logoFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-3 flex flex-col items-center gap-1.5 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group"
                >
                  <Upload size={20} className="text-slate-400 group-hover:text-indigo-500 transition" />
                  <span className="text-xs text-slate-500 group-hover:text-indigo-500 transition">{t('tools.qrTool.logoUpload')}</span>
                </button>
              )}
              <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </Card>
          </div>

          {/* Right: QR Preview */}
          <div className="flex-1 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col items-center justify-center p-6 min-h-[400px]">
              {genLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={36} className="animate-spin text-indigo-500" />
                  <p className="text-sm">{t('tools.qrTool.generating')}</p>
                </div>
              ) : genQrUrl ? (
                <>
                  <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200 dark:ring-slate-700">
                    <img src={genQrUrl} alt="QR Code" className="block max-w-[280px] w-full" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button id="qr-download" onClick={handleDownload} className="gap-2">
                      <Download size={16} /> {t('tools.qrTool.download')}
                    </Button>
                    <Button id="qr-copy-image" variant="secondary" onClick={handleCopyQr} className="gap-2">
                      <Copy size={16} /> {t('tools.qrTool.copyImage')}
                    </Button>
                    <Button id="qr-reset" variant="ghost" size="sm" onClick={() => { setGenInput(''); setGenQrUrl(null); removeLogo(); }} className="gap-1 text-slate-400">
                      <RefreshCw size={14} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-600">
                  <QrCode size={72} strokeWidth={1} />
                  <p className="text-sm text-slate-400">{t('tools.qrTool.previewPlaceholder')}</p>
                </div>
              )}
            </Card>
            <canvas ref={genCanvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* ════════════ READER TAB ════════════ */}
      {activeTab === 'reader' && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: Upload zone */}
          <div className="lg:flex-1 flex flex-col gap-4">
            <div
              onDragEnter={(e) => { e.preventDefault(); setReadDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setReadDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleReadDrop}
              className={`min-h-[320px] flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all ${
                readDragActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {readImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={readImage} alt="QR to decode" className="max-w-full max-h-[300px] object-contain rounded-lg shadow" />
                  <button
                    onClick={clearReader}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                    title={t('common.clear')}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    {t('tools.qrTool.readerUploadTitle')}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {t('tools.qrTool.readerDragHint')}{' '}
                    <span
                      className="text-indigo-500 cursor-pointer hover:underline"
                      onClick={() => readFileRef.current?.click()}
                    >
                      {t('tools.qrTool.readerBrowse')}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 opacity-70">
                    {t('tools.qrTool.readerPasteHint')}
                  </p>
                </div>
              )}
            </div>
            <input ref={readFileRef} type="file" accept="image/*" className="hidden" onChange={handleReadFileChange} />
          </div>

          {/* Right: Result */}
          <div className="lg:flex-1 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-[320px]">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t('tools.qrTool.readerResult')}
                  </span>
                  {readContentType && (() => {
                    const meta = CONTENT_TYPE_META[readContentType];
                    const Icon = meta.Icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    );
                  })()}
                </div>
                <Button
                  variant="ghost" size="sm"
                  disabled={!readResult}
                  onClick={() => { navigator.clipboard.writeText(readResult); showToast(t('common.copiedToClipboard')); }}
                  className="h-8 gap-1"
                >
                  <Copy size={14} /> {t('common.copy')}
                </Button>
              </div>

              <div className="flex-1 p-4 overflow-auto flex flex-col">
                {readLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                    <p className="text-sm">{t('tools.qrTool.decoding')}</p>
                  </div>
                ) : readError ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center text-red-500">
                      <X size={22} />
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{readError}</p>
                    <p className="text-xs text-slate-400">{t('tools.qrTool.decodeErrorHint')}</p>
                  </div>
                ) : readResult ? (
                  <div className="flex flex-col gap-4 flex-1">
                    <pre className="whitespace-pre-wrap break-all font-mono text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-black/20 rounded-lg p-3 flex-1">
                      {readResult}
                    </pre>
                    {readContentType === 'url' && (
                      <a
                        href={readResult}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="qr-open-link"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition self-start"
                      >
                        <ExternalLink size={14} /> {t('tools.qrTool.openLink')}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-3">
                    <QrCode size={52} strokeWidth={1} />
                    <p className="text-sm text-slate-400">{t('tools.qrTool.readerWaiting')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
