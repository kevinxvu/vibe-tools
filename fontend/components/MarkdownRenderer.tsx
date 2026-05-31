import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../context/ThemeContext';

// ── Mermaid Lightbox ───────────────────────────────────────────────────────────

const MermaidLightbox: React.FC<{ svg: string; onClose: () => void }> = ({ svg, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      {/* Close hint */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-white/70 text-xs select-none pointer-events-none">
        <span className="bg-white/10 rounded px-2 py-1 font-mono">Esc</span>
        <span>or click outside to close</span>
      </div>

      {/* Diagram container — fills most of the screen, SVG scales to fit */}
      <div
        className="relative w-[70vw] h-[70vh] overflow-auto rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
        style={{
          animation: 'mermaid-lightbox-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mermaid-lightbox-inner w-full h-full flex items-center justify-center"
          style={{ minHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <style>{`
        @keyframes mermaid-lightbox-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .mermaid-lightbox-inner svg {
          width: 100% !important;
          height: auto !important;
          max-height: calc(70vh - 3rem) !important;
        }
      `}</style>
    </div>
  );
};

// ── Mermaid Block ──────────────────────────────────────────────────────────────

const MermaidBlock: React.FC<{ code: string }> = ({ code }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { theme } = useTheme();
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let cancelled = false;
    setSvg('');
    setError('');

    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
        });
        const { svg: rendered } = await mermaid.render(idRef.current, code.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to render diagram');
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code, theme]);

  const handleClose = useCallback(() => setLightboxOpen(false), []);

  if (error) {
    return (
      <div className="my-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 overflow-x-auto">
        <p className="text-xs font-semibold text-red-500 mb-1">Mermaid error</p>
        <pre className="text-red-400 text-xs whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="text-sm text-slate-400">Rendering diagram...</span>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail — clickable */}
      <div
        role="button"
        tabIndex={0}
        title="Click to expand"
        onClick={() => setLightboxOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setLightboxOpen(true)}
        className="group my-4 overflow-x-auto rounded-lg bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 flex justify-center relative transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"
        style={{ cursor: 'zoom-in' }}
      >
        {/* Expand hint badge */}
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] font-medium bg-indigo-500/90 text-white rounded px-1.5 py-0.5 select-none pointer-events-none">
          Expand
        </span>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {/* Lightbox */}
      {lightboxOpen && <MermaidLightbox svg={svg} onClose={handleClose} />}
    </>
  );
};

// ── Image Lightbox & Block ─────────────────────────────────────────────────────

const ImageLightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isZoomed ? 'p-0' : 'p-6'}`}
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => {
        // Close if click is on the backdrop
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className={`fixed top-4 right-4 flex items-center gap-2 text-white/70 text-xs select-none pointer-events-none z-10 transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}>
        <span className="bg-white/10 rounded px-2 py-1 font-mono">Esc</span>
        <span>or click outside to close</span>
      </div>

      <img
        src={src}
        alt={alt}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsZoomed(!isZoomed);
        }}
        className={`shadow-2xl object-contain transition-all duration-300 ${
          isZoomed
            ? 'w-[100vw] h-[100vh] max-w-[100vw] max-h-[100vh] rounded-none cursor-zoom-out bg-black/50 border-transparent'
            : 'w-[50vw] h-[50vh] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-zoom-in'
        }`}
      />
    </div>
  );
};

const ImageBlock: React.FC<any> = ({ node, ...props }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const handleClose = useCallback(() => setLightboxOpen(false), []);

  return (
    <>
      <img
        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', cursor: 'zoom-in' }}
        className="hover:opacity-90 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setLightboxOpen(true);
        }}
        {...props}
      />
      {lightboxOpen && (
        <ImageLightbox src={props.src} alt={props.alt || ''} onClose={handleClose} />
      )}
    </>
  );
};

// ── Code Block ─────────────────────────────────────────────────────────────────

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
        <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150 select-none"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Highlighted code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={theme === 'dark' ? oneDark : oneLight}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.85rem',
          lineHeight: '1.6',
          padding: '1rem',
        }}
        showLineNumbers={false}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// ── Markdown Renderer ──────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  children: string;
  className?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  className = '',
  scrollRef,
  onScroll,
}) => (
  <div
    ref={scrollRef}
    onScroll={onScroll}
    className={`markdown-body text-slate-800 dark:text-slate-200 overflow-y-auto w-full break-words scrollbar-thin ${className}`}
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ImageBlock,
        a: ({ node, ...props }) => <a className="text-indigo-600 hover:underline" {...props} />,
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match?.[1] ?? '';
          const isInline = !className && !String(children).includes('\n');

          // Mermaid
          if (language === 'mermaid') {
            return <MermaidBlock code={String(children).trim()} />;
          }

          // Inline code
          if (isInline) {
            return (
              <code
                className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400"
                {...props}
              >
                {children}
              </code>
            );
          }

          // Fenced code block with syntax highlighting
          return <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />;
        },
        pre: ({ children }) => <>{children}</>,

        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-400 pl-4 py-1 my-4 text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-r" {...props} />,
        table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700" {...props} /></div>,
        th: ({ node, ...props }) => <th className="bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700" {...props} />,
        td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap text-sm border-b border-slate-100 dark:border-slate-800" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);
