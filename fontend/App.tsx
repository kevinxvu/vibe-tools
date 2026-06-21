
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { HttpClient } from './pages/HttpClient';
import { TextReplacer } from './pages/TextReplacer';
import { JsonFormatter } from './pages/JsonFormatter';
import { StringEscaper } from './pages/StringEscaper';
import { OcrTool } from './pages/OcrTool';
import { UuidGenerator } from './pages/UuidGenerator';
import { SnowflakeGenerator } from './pages/SnowflakeGenerator';
import { TimestampConverter } from './pages/TimestampConverter';
import { PasswordGenerator } from './pages/PasswordGenerator';
import { MultilineConverter } from './pages/MultilineConverter';
import { ChatToArticle } from './pages/ChatToArticle';
import { TextSummarizer } from './pages/TextSummarizer';
import { Base64Converter } from './pages/Base64Converter';
import { UrlConverter } from './pages/UrlConverter';
import { JwtTool } from './pages/JwtTool';
import { StringLengthCalculator } from './pages/StringLengthCalculator';
import { HtmlEncoder } from './pages/HtmlEncoder';
import { StringHash } from './pages/StringHash';
import { BcryptTool } from './pages/BcryptTool';
import { TextCaseConverter } from './pages/TextCaseConverter';
import { EmailGenerator } from './pages/EmailGenerator';
import { SmartChatReply } from './pages/SmartChatReply';
import { MarkdownViewer } from './pages/MarkdownViewer';
import { HtmlViewer } from './pages/HtmlViewer';
import { XmlFormatter } from './pages/XmlFormatter';
import { AiTranscriber } from './pages/AiTranscriber';
import { AiTranslator } from './pages/AiTranslator';
import { LogAnalyzer } from './pages/LogAnalyzer';
import { MarkdownParser } from './pages/MarkdownParser';
import { MermaidGenerator } from './pages/MermaidGenerator';
import { Login } from './pages/Login';
import { Donate } from './pages/Donate';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <SidebarProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
              <Navbar />
              <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
                <Sidebar />
                <main className="flex-1 min-w-0 flex flex-col">
                  <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/tools/http-client" element={<HttpClient />} />
                  <Route path="/tools/text-replacer" element={<TextReplacer />} />
                  <Route path="/tools/multiline-converter" element={<MultilineConverter />} />
                  <Route path="/tools/json-formatter" element={<JsonFormatter />} />
                  <Route path="/tools/string-escaper" element={<StringEscaper />} />
                  <Route path="/tools/ocr" element={<OcrTool />} />
                  <Route path="/tools/chat-to-article" element={<ChatToArticle />} />
                  <Route path="/tools/text-summarizer" element={<TextSummarizer />} />
                  <Route path="/tools/string-length" element={<StringLengthCalculator />} />
                  <Route path="/tools/uuid-generator" element={<UuidGenerator />} />
                  <Route path="/tools/snowflake-generator" element={<SnowflakeGenerator />} />
                  <Route path="/tools/timestamp-converter" element={<TimestampConverter />} />
                  <Route path="/tools/password-generator" element={<PasswordGenerator />} />
                  <Route path="/tools/base64-converter" element={<Base64Converter />} />
                  <Route path="/tools/url-encoder" element={<UrlConverter />} />
                  <Route path="/tools/html-encoder" element={<HtmlEncoder />} />
                  <Route path="/tools/jwt" element={<JwtTool />} />
                  <Route path="/tools/string-hash" element={<StringHash />} />
                  <Route path="/tools/bcrypt" element={<BcryptTool />} />
                  <Route path="/tools/string-case-converter" element={<TextCaseConverter />} />
                  <Route path="/tools/email-generator" element={<EmailGenerator />} />
                  <Route path="/tools/smart-chat-reply" element={<SmartChatReply />} />
                  <Route path="/tools/markdown-viewer" element={<MarkdownViewer />} />
                  <Route path="/tools/html-viewer" element={<HtmlViewer />} />
                  <Route path="/tools/xml-formatter" element={<XmlFormatter />} />
                  <Route path="/tools/ai-transcriber" element={<AiTranscriber />} />
                  <Route path="/tools/ai-translator" element={<AiTranslator />} />
                  <Route path="/tools/log-analyzer" element={<LogAnalyzer />} />
                  <Route path="/tools/markdown-parser" element={<MarkdownParser />} />
                  <Route path="/tools/mermaid-generator" element={<MermaidGenerator />} />
                  {/* Fallback route */}
                  <Route path="*" element={<Dashboard />} />
                </Routes>
                </main>
              </div>
            </div>
            </SidebarProvider>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
