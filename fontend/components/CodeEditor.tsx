
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Search, X, ArrowDown, Replace, Copy, 
  CaseSensitive, Regex as RegexIcon, ReplaceAll 
} from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>; // Allow parent to access ref
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void; // Allow parent to listen to scroll
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  readOnly = false,
  className = '',
  textareaRef: externalRef,
  onScroll
}) => {
  // Use external ref if provided, otherwise fallback to internal
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  
  const lineNumsRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  // Robustly handle potential non-string values to prevent crashes
  const safeValue = typeof value === 'string' ? value : String(value || '');
  const lineCount = safeValue.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    // Sync line numbers
    if (textareaRef.current && lineNumsRef.current) {
      lineNumsRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    // Notify parent
    if (onScroll) {
      onScroll(e);
    }
  };

  // --- Search Logic ---

  const getRegex = useCallback(() => {
    try {
      const flags = matchCase ? 'g' : 'gi';
      // If not using regex, escape special characters to treat input as literal string
      const pattern = useRegex ? findTerm : findTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(pattern, flags);
    } catch (e) {
      return null;
    }
  }, [findTerm, useRegex, matchCase]);

  const findNext = () => {
    if (!textareaRef.current || !findTerm) return;
    
    const text = safeValue;
    const regex = getRegex();
    if (!regex) return;

    // Remove 'g' flag for single search to find next index
    const singleRegex = new RegExp(regex.source, matchCase ? '' : 'i');
    
    const startPos = textareaRef.current.selectionEnd;
    const textAfter = text.substring(startPos);
    const textBefore = text.substring(0, startPos);

    let match = singleRegex.exec(textAfter);
    let absoluteIndex = -1;

    if (match) {
      absoluteIndex = startPos + match.index;
    } else {
      // Wrap around
      match = singleRegex.exec(textBefore);
      if (match) {
        absoluteIndex = match.index;
      }
    }

    if (absoluteIndex !== -1 && match) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(absoluteIndex, absoluteIndex + match[0].length);
      
      // Scroll into view logic (basic)
      const lineHeight = 24; // approximate
      const lineNumber = text.substring(0, absoluteIndex).split('\n').length;
      textareaRef.current.scrollTop = (lineNumber - 3) * lineHeight;
    }
  };

  const handleReplaceOne = () => {
    if (!textareaRef.current || disabled || readOnly) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = safeValue.substring(start, end);

    // Check if the current selection matches the search term
    const regex = getRegex();
    if (!regex) return;
    
    const singleRegex = new RegExp(`^${regex.source}$`, matchCase ? '' : 'i');
    
    if (singleRegex.test(selectedText)) {
      const newValue = safeValue.substring(0, start) + replaceTerm + safeValue.substring(end);
      onChange(newValue);
      
      // Preserve cursor/selection after replace
      setTimeout(() => {
        if(textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start + replaceTerm.length);
        }
        findNext(); // Auto find next
      }, 0);
    } else {
      findNext();
    }
  };

  const handleReplaceAll = () => {
    if (disabled || readOnly || !findTerm) return;
    
    const regex = getRegex();
    if (!regex) return;

    const newValue = safeValue.replace(regex, replaceTerm);
    if (newValue !== safeValue) {
      onChange(newValue);
    }
  };

  const toggleSearch = (e?: React.KeyboardEvent) => {
    e?.preventDefault();
    if (isSearchOpen) {
      setIsSearchOpen(false);
      textareaRef.current?.focus();
    } else {
      setIsSearchOpen(true);
      // Pre-fill search with selection if any
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      if (end > start) {
        setFindTerm(safeValue.substring(start, end));
      }
      setTimeout(() => findInputRef.current?.focus(), 100);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if this specific instance has focus
      const isFocused = document.activeElement === textareaRef.current;
      
      // Ctrl+H or Cmd+H
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'h')) {
        // Only trigger if focused
        if (isFocused) {
          e.preventDefault();
          setIsSearchOpen(prev => {
              if (!prev) setTimeout(() => findInputRef.current?.focus(), 100);
              return !prev;
          });
        }
      }
      
      // Esc to close (only if search is open and this instance is either focused or the search box is focused)
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // Already handled by global listener with focus check
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Find previous logic could go here, for now just find next
        findNext(); 
      } else {
        findNext();
      }
    }
  };

  return (
    <div className={`flex flex-1 relative h-full font-mono text-sm bg-white dark:bg-slate-900 overflow-hidden group ${disabled ? 'opacity-70' : ''} ${className}`}>
      
      {/* Search Widget Overlay */}
      {isSearchOpen && (
        <div className="absolute top-2 right-4 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-2 flex flex-col gap-2 w-80 animate-in fade-in slide-in-from-top-2">
          
          {/* Find Row */}
          <div className="flex items-center gap-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                ref={findInputRef}
                className="w-full h-8 pl-7 pr-2 rounded border bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Find"
                value={findTerm}
                onChange={e => setFindTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            
            <button 
              onClick={() => setMatchCase(!matchCase)}
              className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${matchCase ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}
              title="Match Case"
            >
              <CaseSensitive size={16} />
            </button>
            <button 
              onClick={() => setUseRegex(!useRegex)}
              className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${useRegex ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}
              title="Use Regex"
            >
              <RegexIcon size={16} />
            </button>
            <button 
              onClick={findNext}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              title="Find Next (Enter)"
            >
              <ArrowDown size={16} />
            </button>
          </div>

          {/* Replace Row */}
          {!readOnly && !disabled && (
            <div className="flex items-center gap-1">
               <div className="relative flex-1">
                <Replace size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="w-full h-8 pl-7 pr-2 rounded border bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Replace"
                  value={replaceTerm}
                  onChange={e => setReplaceTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleReplaceOne}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                title="Replace Current"
              >
                <Replace size={16} />
              </button>
              <button 
                onClick={handleReplaceAll}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                title="Replace All"
              >
                <ReplaceAll size={16} />
              </button>
            </div>
          )}

          <button 
            onClick={() => { setIsSearchOpen(false); textareaRef.current?.focus(); }}
            className="absolute -top-2 -right-2 bg-slate-200 dark:bg-slate-700 rounded-full p-1 text-slate-500 hover:text-red-500 shadow-sm"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Line Numbers Column */}
      <div
        ref={lineNumsRef}
        className="h-full py-4 pr-3 pl-2 text-right text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 overflow-hidden select-none z-10"
        style={{ minWidth: '3.5rem' }}
      >
        {lineNumbers.map(n => (
          <div key={n} className="leading-6 text-xs">{n}</div>
        ))}
      </div>
      
      {/* Editor Area */}
      <textarea
        ref={textareaRef}
        className={`flex-1 h-full p-4 min-w-0 bg-transparent focus:outline-none resize-none whitespace-pre-wrap break-words leading-6 text-slate-800 dark:text-slate-200 ${disabled ? 'cursor-not-allowed' : ''}`}
        value={safeValue}
        onChange={(e) => !disabled && !readOnly && onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleEditorKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
};
