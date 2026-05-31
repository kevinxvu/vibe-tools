
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileCode, Network, AlignLeft, Minimize2, 
  Upload, Save, Copy, Trash2, ChevronRight, ChevronDown, AlertTriangle 
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/UI';
import { useToast } from '../context/ToastContext';
import { CodeEditor } from '../components/CodeEditor';
import { useToolState } from '../lib/useToolState';

// --- Tree View Component ---
const XmlNode: React.FC<{ node: Node; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);

  // 1. Element Node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName;
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
          <span className="text-slate-400 mr-1 mt-1 shrink-0 w-4 flex justify-center">
            {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
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
              <XmlNode key={i} node={child} depth={depth + 1} />
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

  // 4. CDATA Node
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return (
      <div 
        className="font-mono text-sm leading-6 text-orange-600 dark:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded break-words"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        &lt;![CDATA[ {node.textContent} ]]&gt;
      </div>
    );
  }

  // 7. Processing Instruction
  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    return (
      <div 
        className="font-mono text-sm leading-6 text-pink-600 dark:text-pink-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-1 rounded"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        &lt;?{node.nodeName} {node.textContent}?&gt;
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

export const XmlFormatter: React.FC = () => {
  const [input, setInput] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1">
    <title>Clean Code</title>
    <author>Robert C. Martin</author>
    <price currency="USD">30.00</price>
  </book>
  <book id="2">
    <title>The Pragmatic Programmer</title>
    <author>Andrew Hunt</author>
    <price currency="USD">45.00</price>
  </book>
</library>`);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'tree'>('editor');
  const [fileName, setFileName] = useState('data.xml');
  const [xmlNodes, setXmlNodes] = useState<Node[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Load saved state on mount
  const { loadState } = useToolState('xml-formatter', {
    inputs: { xml: input, activeTab },
    outputs: {},
  });

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setInput(saved.inputs.xml || `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="1">
    <title>Clean Code</title>
    <author>Robert C. Martin</author>
    <price currency="USD">30.00</price>
  </book>
  <book id="2">
    <title>The Pragmatic Programmer</title>
    <author>Andrew Hunt</author>
    <price currency="USD">45.00</price>
  </book>
</library>`);
      setActiveTab(saved.inputs.activeTab || 'editor');
    }
  }, []);

  // Auto-save state
  useToolState('xml-formatter', {
    inputs: { xml: input, activeTab },
    outputs: {},
  });

  // --- Parsing ---
  useEffect(() => {
    if (!input.trim()) {
      setIsValid(null);
      setParseError(null);
      setXmlNodes([]);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'application/xml');
      
      // Check for parser errors (browsers return an XML document containing a parsererror tag)
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) {
        setIsValid(false);
        setParseError(errorNode.textContent || "Invalid XML");
        setXmlNodes([]);
      } else {
        setIsValid(true);
        setParseError(null);
        setXmlNodes(Array.from(doc.childNodes));
      }
    } catch (e) {
      setIsValid(false);
      setParseError("Failed to parse XML");
    }
  }, [input]);

  // --- Formatting ---
  const handleBeautify = () => {
    try {
      const shift = '  ';
      // 1. Flatten string: remove all newlines and whitespace between tags
      // Using new RegExp to avoid parsing issues with regex literals in .tsx
      const newlineRegex = new RegExp('\\r?\\n', 'g');
      const spaceBetweenTagsRegex = new RegExp('>\\s+<', 'g');
      
      const str = input.replace(newlineRegex, '').replace(spaceBetweenTagsRegex, '><').trim();
      
      // 2. Split into tokens using regex capturing group (<...>)
      // This splits by tags but KEEPS the tags in the array because of the () group
      const tagSplitRegex = new RegExp('(<[^>]+>)', 'g');
      const tokens = str.split(tagSplitRegex).filter(s => s.trim() !== '');
      
      let formatted = '';
      let indentLevel = 0;
      
      for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        
        // Detect Token Type
        const isClosing = token.startsWith('</');
        const isSelfClosing = token.startsWith('<') && token.endsWith('/>');
        const isProcessing = token.startsWith('<?');
        const isComment = token.startsWith('<!--');
        const isCdata = token.startsWith('<![CDATA[');
        const isDocType = token.startsWith('<!DOCTYPE');
        
        // Standard Opening Tag
        const isOpening = token.startsWith('<') && !isClosing && !isSelfClosing && !isProcessing && !isComment && !isCdata && !isDocType;
        
        const isText = !token.startsWith('<');
        
        // Adjust indent for closing tags
        if (isClosing) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indent = new Array(indentLevel + 1).join(shift);
        
        if (isText) {
           formatted += indent + token.trim() + '\n';
        } else {
           // Optimization: Inline short text content (e.g., <title>Text</title>)
           if (isOpening) {
              const nextToken = tokens[i+1];
              const nextNextToken = tokens[i+2];
              
              const isNextText = nextToken && !nextToken.startsWith('<');
              const isNextNextClosing = nextNextToken && nextNextToken.startsWith('</');
              
              // If pattern is <tag>text</tag> and text is short (< 60 chars)
              if (isNextText && isNextNextClosing && nextToken.length < 60) {
                 formatted += indent + token + nextToken.trim() + nextNextToken + '\n';
                 i += 2; // Skip next two tokens
                 continue; 
              }
           }
           
           formatted += indent + token + '\n';
           
           if (isOpening) {
             indentLevel++;
           }
        }
      }
      
      setInput(formatted.trim());
      showToast(t('tools.xmlFormatter.beautified'));
    } catch (e) {
      console.error(e);
      showToast(t('tools.xmlFormatter.formattingFailed'), 'error');
    }
  };

  const handleMinify = () => {
    // Using RegExp constructor for safety
    const newlineRegex = new RegExp('\\r?\\n', 'g');
    const spaceBetweenTagsRegex = new RegExp('>\\s+<', 'g');

    const minified = input
      .replace(newlineRegex, '') // Remove all newlines
      .replace(spaceBetweenTagsRegex, '><') // Remove spaces between tags
      .trim();
    setInput(minified);
    showToast(t('tools.xmlFormatter.minified'));
  };

  // --- File I/O ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInput(ev.target?.result as string);
      setFileName(file.name);
      showToast(t('tools.xmlFormatter.loadedFile', { filename: file.name }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('tools.xmlFormatter.fileSaved'));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(input);
    showToast(t('tools.xmlFormatter.copied'));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl lg:h-[calc(100vh-4rem)] h-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCode className="text-indigo-600" />
          XML Formatter
        </h1>
        <p className="text-sm text-slate-500">
          {t('tools.xmlFormatter.pageDescription')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        
        {/* Left: Editor */}
        <div className="lg:w-1/2 flex flex-col gap-4 lg:min-h-0">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept=".xml" onChange={handleFileUpload} />
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
              <Button variant="ghost" size="sm" onClick={() => setInput('')} className="text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="flex gap-2">
               <Button variant="secondary" size="sm" onClick={handleBeautify} className="gap-2">
                 <AlignLeft size={14} /> {t('tools.xmlFormatter.beautify')}
               </Button>
               <Button variant="secondary" size="sm" onClick={handleMinify} className="gap-2">
                 <Minimize2 size={14} /> {t('tools.xmlFormatter.minify')}
               </Button>
            </div>
          </div>

          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-2 border-transparent focus-within:border-indigo-500/50 transition-colors h-[400px] lg:h-auto">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-semibold text-slate-500 uppercase">{t('tools.xmlFormatter.xmlSource')}</span>
                 {isValid === true && <Badge color="green">{t('tools.xmlFormatter.validXml')}</Badge>}
                 {isValid === false && <Badge color="red">{t('tools.xmlFormatter.invalidXml')}</Badge>}
               </div>
               <Input 
                 className="h-6 w-32 text-xs py-0 px-2" 
                 value={fileName} 
                 onChange={e => setFileName(e.target.value)}
                 placeholder="data.xml"
               />
             </div>
             <CodeEditor 
               value={input} 
               onChange={setInput} 
               placeholder="<!-- Enter XML here -->"
             />
          </Card>
          
          {parseError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span className="font-mono text-xs">{parseError}</span>
            </div>
          )}
        </div>

        {/* Right: Tree View */}
        <div className="lg:w-1/2 flex flex-col lg:min-h-0 min-w-0">
           <Card className="h-[500px] lg:h-full flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-slate-800">
             <div className="bg-slate-50 dark:bg-slate-800/50 px-2 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
               <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                 <button 
                   onClick={() => setActiveTab('editor')}
                   className={`lg:hidden px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   Editor
                 </button>
                 <button 
                   onClick={() => setActiveTab('tree')}
                   className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all ${activeTab === 'tree' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                 >
                   <Network size={12} /> {t('tools.xmlFormatter.treeView')}
                 </button>
               </div>
             </div>
             
             <div className="flex-1 overflow-auto p-4 bg-white dark:bg-slate-900">
               {xmlNodes.length > 0 ? (
                 xmlNodes.map((node, i) => <XmlNode key={i} node={node} />)
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                   <FileCode size={48} className="mb-4 opacity-20" />
                   <p className="text-sm italic">
                     {isValid === false ? 'Fix XML errors to view tree' : 'Waiting for input...'}
                   </p>
                 </div>
               )}
             </div>
           </Card>
        </div>

      </div>
    </div>
  );
};