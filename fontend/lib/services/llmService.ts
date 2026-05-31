import apiClient from '../apiClient';

// ── AI Translator ─────────────────────────────────────────────────────────────

export interface TranslateRequest {
  input_text: string;
  source_lang: string;
  target_lang: string;
  context?: string;
}

export interface TranslateResponse {
  content: string;
}

/**
 * POST /api/v1/llm/ai-translator
 * Translates text from a source language to a target language via the backend.
 */
export const translateText = async (params: TranslateRequest): Promise<string> => {
  const response = await apiClient.post<TranslateResponse>(
    '/api/v1/llm/ai-translator',
    {
      input_text: params.input_text,
      source_lang: params.source_lang,
      target_lang: params.target_lang,
      context: params.context || '',
    }
  );

  return response.data.content;
};

// ── Text Summarizer ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/llm/text-summarizer
 * Summarizes and translates text based on the selected mode and target language.
 */
export const summarizeText = async (text: string, mode: string, target_lang: string): Promise<string> => {
  const response = await apiClient.post<{ content: string }>(
    '/api/v1/llm/text-summarizer',
    { text, mode, target_lang }
  );

  return response.data.content;
};

// ── Smart Chat Reply ─────────────────────────────────────────────────────────

export interface SmartChatReplyRequest {
  conversation?: string; // text mode
  image?: File;          // image mode
  target_lang: string;
  style: string;
}

/**
 * POST /api/v1/llm/smart-chat-reply
 * Analyzes a conversation (text or screenshot) and returns 5 reply suggestions.
 */
export const smartChatReply = async (params: SmartChatReplyRequest): Promise<string[]> => {
  const formData = new FormData();

  if (params.conversation) {
    formData.append('request', JSON.stringify({ conversation: params.conversation }));
  }
  if (params.image) {
    formData.append('image', params.image);
  }
  formData.append('target_lang', params.target_lang);
  formData.append('style', params.style);

  const response = await apiClient.post<{ suggestions: string[] }>(
    '/api/v1/llm/smart-chat-reply',
    formData
  );

  return response.data.suggestions;
};

// ── OCR ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/llm/ocr
 * Extracts text from an image using a vision-capable LLM.
 */
export const ocrExtract = async (image: File, format: string): Promise<string> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('format', format);

  const response = await apiClient.post<{ content: string }>(
    '/api/v1/llm/ocr',
    formData
  );

  return response.data.content;
};

// ── Markdown Format ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/llm/markdown-format
 * Reformats raw Markdown text following CommonMark / GFM best practices.
 */
export const formatMarkdown = async (markdown: string): Promise<string> => {
  const response = await apiClient.post<{ content: string }>(
    '/api/v1/llm/markdown-format',
    { markdown }
  );

  return response.data.content;
};

// ── Email Generator ───────────────────────────────────────────────────────────

export interface EmailGeneratorRequest {
  topic: string;
  tone: string;
  language: string;
}

export interface EmailGeneratorResponse {
  subject: string;
  body: string;
}

/**
 * POST /api/v1/llm/email-generator
 * Generates a professional email based on topic, tone, and target language.
 */
export const generateEmail = async (params: EmailGeneratorRequest): Promise<EmailGeneratorResponse> => {
  const response = await apiClient.post<EmailGeneratorResponse>(
    '/api/v1/llm/email-generator',
    {
      topic: params.topic,
      tone: params.tone,
      language: params.language,
    }
  );

  return response.data;
};

// ── Chat to Article ───────────────────────────────────────────────────────────

export interface ChatToArticleRequest {
  chat_log: string;
  target_lang: string;
}

/**
 * POST /api/v1/llm/chat-to-article
 * Converts a raw chat log into a structured technical article via the backend.
 */
export const chatToArticle = async (params: ChatToArticleRequest): Promise<string> => {
  const response = await apiClient.post<{ content: string }>(
    '/api/v1/llm/chat-to-article',
    {
      chat_log: params.chat_log,
      target_lang: params.target_lang,
    }
  );

  return response.data.content;
};

// ── AI Transcriber ────────────────────────────────────────────────────────────

export type TranscribeFormat = 'text' | 'json' | 'srt';

export interface TranscribeRequest {
  file: File;
  input_lang: string;
  output_lang: string;
  format: TranscribeFormat;
}

export interface TranscribeResponse {
  content: string;
}

/**
 * POST /api/v1/llm/ai-transcriber
 * Transcribes and translates an audio/video file via the backend service.
 */
export const transcribeAudio = async (params: TranscribeRequest): Promise<string> => {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('input_lang', params.input_lang);
  formData.append('output_lang', params.output_lang);
  formData.append('format', params.format);

  const response = await apiClient.post<TranscribeResponse>(
    '/api/v1/llm/ai-transcriber',
    formData
    // axios sets multipart/form-data Content-Type with boundary automatically
  );

  return response.data.content;
};
