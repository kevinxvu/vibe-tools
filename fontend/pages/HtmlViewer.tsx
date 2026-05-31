
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileCode, Eye, Network, AlignLeft, Minimize2, 
  Upload, Download, Copy, Trash2, ChevronRight, ChevronDown, Save, Maximize2
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

// --- Tree View Component ---
const DomNode: React.FC<{ node: Node; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);

  // 1. Element Node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    const hasChildren = element.childNodes.length > 0;
    
    // Attributes
    const attrs = Array.from(element.attributes).map(a => (
      <span key={a.name} className="ml-1">
        <span className="text-yellow-600 dark:text-yellow-500">{a.name}</span>=
        <span className="text-green-600 dark:text-green-400">"{a.value}"</span>
      </span>
    ));

    return (
      <div className="font-mono text-sm leading-6">
        <div 
          className="flex items-start hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded cursor-pointer select-none"
          style={{ paddingLeft: `${depth * 1.25}rem` }}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          <span className="text-slate-400 mr-1 mt-1 shrink-0">
            {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div className="w-3.5" />}
          </span>
          <div className="break-all">
            <span className="text-blue-600 dark:text-blue-400">&lt;{tagName}</span>
            {attrs}
            <span className="text-blue-600 dark:text-blue-400">&gt;</span>
            {!expanded && hasChildren && <span className="text-slate-400 mx-1">...</span>}
            {!expanded && hasChildren && <span className="text-blue-600 dark:text-blue-400">&lt;/{tagName}&gt;</span>}
          </div>
        </div>
        {expanded && hasChildren && (
          <div>
            {Array.from(element.childNodes).map((child, i) => (
              <DomNode key={i} node={child} depth={depth + 1} />
            ))}
            <div 
              className="hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded text-blue-600 dark:text-blue-400"
              style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
            >
              &lt;/{tagName}&gt;
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Text Node
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (!text) return null; // Skip empty whitespace nodes
    return (
      <div 
        className="font-mono text-sm leading-6 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded break-words"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        {text}
      </div>
    );
  }

  // 8. Comment Node
  if (node.nodeType === Node.COMMENT_NODE) {
    return (
      <div 
        className="font-mono text-sm leading-6 text-slate-400 italic hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        &lt;!-- {node.textContent} --&gt;
      </div>
    );
  }

  return null;
};

export const HtmlViewer: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { color: #6366f1; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a <strong>live preview</strong> of your HTML.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</body>
</html>`);
  
  const [activeTab, setActiveTab] = useState<'preview' | 'tree'>('preview');
  const [fileName, setFileName] = useState('index.html');
  const [domTree, setDomTree] = useState<Node[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('html-viewer', {
    inputs: { html: htmlInput, activeTab },
    outputs: {},
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setHtmlInput(saved.inputs.html || `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { color: #6366f1; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a <strong>live preview</strong> of your HTML.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</body>
</html>`);
      setActiveTab(saved.inputs.activeTab || 'preview');
    }
  }, []);

  // Auto-save state
  useToolState('html-viewer', {
    inputs: { html: htmlInput, activeTab },
    outputs: {},
  });

  // --- Parsing for Tree View ---
  useEffect(() => {
    if (activeTab === 'tree') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlInput, 'text/html');
        setDomTree(Array.from(doc.childNodes));
      } catch (e) {
        // Ignore parsing errors for tree view
      }
    }
  }, [htmlInput, activeTab]);

  // --- Formatting Logic ---
  const handleBeautify = () => {
    try {
      const tab = '  ';
      let output = '';
      
      // 1. Flatten but preserve single spaces
      const source = htmlInput.replace(/\s+/g, ' ').trim();
      
      // 2. Tokenize by splitting tags
      const tokens = source.split(/(<[^>]+>)/g).filter(s => s.trim() !== '');
      
      let indentLevel = 0;
      
      const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
      
      // Tags that we generally want on new lines, but might inline if short
      const blockTags = new Set([
        'html', 'head', 'body', 'div', 'ul', 'ol', 'table', 'tr', 'td', 'th', 
        'section', 'article', 'header', 'footer', 'nav', 'main', 'aside', 
        'style', 'script', 'meta', 'link', 'title', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'
      ]);

      const getTagName = (token: string) => {
        const match = token.match(/^<\/?([^\s>]+)/);
        return match ? match[1].toLowerCase() : null;
      };

      let i = 0;
      while (i < tokens.length) {
        const token = tokens[i].trim();
        const tagName = getTagName(token);
        
        const isComment = token.startsWith('<!--');
        const isClosing = token.startsWith('</');
        const isSelfClosing = token.endsWith('/>') || (tagName && voidTags.has(tagName));
        const isOpening = token.startsWith('<') && !isClosing && !isSelfClosing && !isComment;
        
        if (isOpening && tagName) {
           output += '\n' + tab.repeat(indentLevel) + token;
           
           // Heuristic: Check if this block should be inlined (e.g. <p>Text</p>)
           if (blockTags.has(tagName) && tagName !== 'html' && tagName !== 'body' && tagName !== 'head') {
              let j = i + 1;
              let contentStr = '';
              let hasBlockChildren = false;
              let closingFound = false;
              
              // Look ahead to see if we can inline the content
              while (j < tokens.length) {
                 const rawNextToken = tokens[j]; // Use raw next token from split array to preserve spaces if needed
                 const nextTokenTrimmed = rawNextToken.trim();
                 const nextTagName = getTagName(nextTokenTrimmed);
                 
                 if (nextTokenTrimmed.startsWith('</' + tagName + '>')) {
                    closingFound = true;
                    break;
                 }
                 
                 // If we encounter another block tag opening, we can't inline
                 if (nextTagName && blockTags.has(nextTagName)) {
                    hasBlockChildren = true;
                    break;
                 }
                 
                 contentStr += rawNextToken;
                 j++;
              }
              
              // If simple content and short enough, print inline
              // We use a generous limit (e.g. 120 chars) for inline content
              if (closingFound && !hasBlockChildren && contentStr.length < 120) {
                 output += contentStr + tokens[j].trim();
                 i = j; // Advance main loop to closing tag
              } else {
                 indentLevel++;
              }
           } else {
             indentLevel++;
           }
           
        } else if (isClosing) {
           indentLevel = Math.max(0, indentLevel - 1);
           output += '\n' + tab.repeat(indentLevel) + token;
        } else if (isSelfClosing || isComment) {
           output += '\n' + tab.repeat(indentLevel) + token;
        } else {
           // Text content
           output += '\n' + tab.repeat(indentLevel) + token;
        }
        i++;
      }
      
      setHtmlInput(output.trim());
      showToast(t('tools.htmlViewer.beautified'));
    } catch (e) {
      console.error(e);
      showToast(t('tools.htmlViewer.formattingFailed'), 'error');
    }
  };

  const handleMinify = () => {
    const whitespaceRegex = new RegExp('\\s+', 'g');
    const spaceBetweenTagsRegex = new RegExp('>\\s+<', 'g');
    
    // Simple minify: replace multiple spaces with single space, remove spaces between tags
    const minified = htmlInput.replace(whitespaceRegex, ' ').replace(spaceBetweenTagsRegex, '><').trim();
    setHtmlInput(minified);
    showToast(t('tools.htmlViewer.minified'));
  };

  // --- File I/O ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHtmlInput(ev.target?.result as string);
      setFileName(file.name);
      showToast(t('tools.chatToArticle.fileLoaded', { filename: file.name }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const blob = new Blob([htmlInput], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('tools.htmlViewer.fileSaved'));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlInput);
    showToast(t('common.copiedToClipboard'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCode className="text-indigo-600" />
          HTML Viewer & Editor
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.htmlViewer.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Editor */}
        <div className="lg:w-1/2 flex flex-col gap-4 lg:min-h-0">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept=".html,.htm" onChange={handleFileUpload} />
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Upload">
                <Upload size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} title="Save">
                <Save size={16} />
              </Button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} title="Copy">
                <Copy size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setHtmlInput('')} className="text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex gap-2">
               <Button variant="secondary" size="sm" onClick={handleBeautify} className="gap-2">
                 <AlignLeft size={14} /> {t('common.beautify')}
               </Button>
               <Button variant="secondary" size="sm" onClick={handleMinify} className="gap-2">
                 <Minimize2 size={14} /> {t('common.minify')}
               </Button>
            </div>
          </div>

          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors h-[400px] lg:h-auto">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.htmlViewer.htmlSource')}</span>
               <Input 
                 className="h-6 w-32 text-xs py-0 px-2" 
                 value={fileName} 
                 onChange={e => setFileName(e.target.value)}
                 placeholder="filename.html"
               />
             </div>
             <CodeEditor 
               value={htmlInput} 
               onChange={setHtmlInput} 
               placeholder="<!-- Enter HTML here -->"
             />
          </Card>
        </div>

        {/* Right: Preview / Tree */}
        <div className="lg:w-1/2 flex flex-col lg:min-h-0 min-w-0">
           <Card className="h-[500px] lg:h-full flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-2 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                 <button 
                   onClick={() => setActiveTab('preview')}
                   className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   <Eye size={12} /> {t('tools.htmlViewer.preview')}
                 </button>
                 <button 
                   onClick={() => setActiveTab('tree')}
                   className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${activeTab === 'tree' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   <Network size={12} /> {t('tools.htmlViewer.treeView')}
                 </button>
               </div>
               
               {activeTab === 'preview' && (
                 <button 
                   onClick={() => setIsFullScreen(true)}
                   className="text-slate-400 hover:text-indigo-500 transition-colors mr-2"
                   title="Full Screen Preview"
                 >
                   <Maximize2 size={16} />
                 </button>
               )}
             </div>
             
             <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
               {activeTab === 'preview' ? (
                 <iframe 
                   title="HTML Preview"
                   srcDoc={htmlInput}
                   className="w-full h-full border-0 bg-white" 
                   sandbox="allow-scripts" 
                 />
               ) : (
                 <div className="w-full h-full overflow-auto p-4">
                   {domTree.length > 0 ? (
                     domTree.map((node, i) => <DomNode key={i} node={node} />)
                   ) : (
                     <div className="text-slate-400 text-sm italic p-4">Invalid HTML structure</div>
                   )}
                 </div>
               )}
             </div>
           </Card>
        </div>

      </div>

      {/* Full Screen Preview Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Eye className="text-indigo-600" size={20} />
              Full Screen Preview
            </h2>
            <div className="flex items-center gap-4">
               <span className="text-sm text-slate-500">{fileName}</span>
               <Button onClick={() => setIsFullScreen(false)} variant="secondary" className="gap-2">
                 <Minimize2 size={16} /> {t('tools.htmlViewer.exitFullScreen')}
               </Button>
            </div>
          </div>
          <div className="flex-1 w-full h-full bg-white">
            <iframe 
              title="Full Screen HTML Preview"
              srcDoc={htmlInput}
              className="w-full h-full border-0" 
              sandbox="allow-scripts" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
