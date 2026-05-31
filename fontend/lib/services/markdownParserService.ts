import axios from 'axios';

// ── Dedicated Axios instance for the Markdown Parser API ───────────────────────
// This service targets a separate server from the main LLM backend.
// Base URL: VITE_MARKDOWN_API_URL (e.g. https://api.genzdev.net)
// Auth: x-api-key header (VITE_MARKDOWN_API_KEY)

const MARKDOWN_API_BASE_URL = import.meta.env.VITE_MARKDOWN_API_URL as string;
const MARKDOWN_API_KEY = import.meta.env.VITE_MARKDOWN_API_KEY as string;

const markdownApiClient = axios.create({
  baseURL: MARKDOWN_API_BASE_URL,
  timeout: 300_000, // 5 minutes — file parsing can be slow
  headers: {
    accept: 'application/json',
    'x-api-key': MARKDOWN_API_KEY,
  },
});

// ── Response shape ─────────────────────────────────────────────────────────────

interface MarkdownParserResponse {
  markdown_content: string;
  message: string;
  metadata: Record<string, unknown>;
  success: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extracts the content from a successful response, or throws a descriptive error. */
const extractContent = (data: MarkdownParserResponse): string => {
  if (!data.success) {
    throw new Error(data.message || 'Markdown Parser API returned an error.');
  }
  return data.markdown_content;
};

// ── API Functions ──────────────────────────────────────────────────────────────

/**
 * POST /v1/markdown/convert/html
 * Converts raw HTML or plain text to Markdown.
 */
export const parseMarkdownFromText = async (html_text: string): Promise<string> => {
  const response = await markdownApiClient.post<MarkdownParserResponse>(
    '/v1/markdown/convert/html',
    { html_text },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return extractContent(response.data);
};

/**
 * POST /v1/markdown/convert/url
 * Fetches a public webpage by URL and converts its content to Markdown.
 */
export const parseMarkdownFromUrl = async (url: string): Promise<string> => {
  const response = await markdownApiClient.post<MarkdownParserResponse>(
    '/v1/markdown/convert/url',
    { url },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return extractContent(response.data);
};

/**
 * POST /v1/markdown/convert/file
 * Uploads a file (DOC, DOCX, XLS, XLSX, PDF, HTML, TXT, CSV, RTF) and converts it to Markdown.
 * Uses multipart/form-data — axios sets the Content-Type boundary automatically.
 */
export const parseMarkdownFromFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await markdownApiClient.post<MarkdownParserResponse>(
    '/v1/markdown/convert/file',
    formData
  );
  return extractContent(response.data);
};
