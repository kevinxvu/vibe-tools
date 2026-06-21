package llm

import (
	"io"
	"net/http"

	"github.com/kevinxvu/vibe-tools/pkg/server/apperr"
)

// langLabels maps language codes to display labels used across all LLM prompts
var langLabels = map[string]string{
	"auto": "Auto-Detect (Identify spoken language first)",
	"vi":   "Vietnamese",
	"en":   "English",
	"th":   "Thai",
	"zh":   "Chinese",
	"ja":   "Japanese",
	"ko":   "Korean",
	"fr":   "French",
	"de":   "German",
	"es":   "Spanish",
}

// emailTones maps tone IDs to their display labels
var emailTones = map[string]string{
	"professional": "Professional",
	"formal":       "Formal",
	"casual":       "Casual",
	"friendly":     "Friendly",
	"urgent":       "Urgent",
	"apologetic":   "Apologetic",
}

// smartChatStyles maps style IDs to labels for SmartChatReply
var smartChatStyles = map[string]string{
	"professional": "Professional",
	"friendly":     "Friendly",
	"flirty":       "Flirty/Romantic",
	"humorous":     "Humorous",
	"witty":        "Witty/Sarcastic",
	"mimic":        "Mimic/Mirror",
	"empathetic":   "Empathetic",
	"direct":       "Direct/Concise",
}

// summarizerModes maps mode IDs to their descriptions
var summarizerModes = map[string]string{
	"shortest":     "Condense into the absolute shortest paragraph possible. Extreme compression — retain only the single core message.",
	"key_points":   "Extract main ideas as a structured bulleted list only. No paragraphs, no filler, just the essential points.",
	"concise":      "Write a brief but complete summary. Every main idea must be present; cut only redundant or filler content.",
	"detailed":     "Write a comprehensive summary covering all major and minor ideas. Remove only repetition and fluff; preserve all substance.",
	"professional": "Produce a well-structured document: H1 title, short introduction, H2 sections for each topic, bullet points for details, and a brief conclusion. Tone must be professional and logical.",
}

// Custom errors
var (
	ErrChatFailed        = apperr.NewHTTPError(http.StatusInternalServerError, "CHAT_FAILED", "Failed to generate article from chat")
	ErrTranscribeFailed  = apperr.NewHTTPError(http.StatusInternalServerError, "TRANSCRIBE_FAILED", "Failed to transcribe audio file")
	ErrTranslateFailed   = apperr.NewHTTPError(http.StatusInternalServerError, "TRANSLATE_FAILED", "Failed to translate text")
	ErrEmailGenFailed    = apperr.NewHTTPError(http.StatusInternalServerError, "EMAIL_GEN_FAILED", "Failed to generate email")
	ErrMarkdownFmtFailed = apperr.NewHTTPError(http.StatusInternalServerError, "MARKDOWN_FMT_FAILED", "Failed to format markdown")
	ErrMermaidGenFailed  = apperr.NewHTTPError(http.StatusInternalServerError, "MERMAID_GEN_FAILED", "Failed to generate Mermaid diagram")
	ErrOcrFailed         = apperr.NewHTTPError(http.StatusInternalServerError, "OCR_FAILED", "Failed to extract text from image")
	ErrSmartChatFailed   = apperr.NewHTTPError(http.StatusInternalServerError, "SMART_CHAT_FAILED", "Failed to generate chat reply suggestions")
	ErrSummaryFailed     = apperr.NewHTTPError(http.StatusInternalServerError, "SUMMARY_FAILED", "Failed to generate summary")
)

// ChatToArticleData contains request data for chat to article
type ChatToArticleData struct {
	ChatLog    string `json:"chat_log" validate:"required"`
	TargetLang string `json:"target_lang" validate:"required,oneof=en vi fr de es ja ko zh"`
}

// ChatToArticleResp contains article content generated from chat
type ChatToArticleResp struct {
	Content string `json:"content"`
}

// AiTranslatorData contains request data for text translation
type AiTranslatorData struct {
	InputText  string `json:"input_text" validate:"required"`
	SourceLang string `json:"source_lang" validate:"required,oneof=auto vi en th zh ja ko fr de es"`
	TargetLang string `json:"target_lang" validate:"required,oneof=vi en th zh ja ko fr de es"`
	Context    string `json:"context"`
}

// AiTranslatorResp contains the translated text
type AiTranslatorResp struct {
	Content string `json:"content"`
}

// AiTranscriberData contains request data for audio/video transcription
type AiTranscriberData struct {
	File       io.Reader `json:"-"`
	FileName   string    `json:"file_name" validate:"required"`
	InputLang  string    `json:"input_lang" validate:"required,oneof=auto vi en th zh ja ko fr de es"`
	OutputLang string    `json:"output_lang" validate:"required,oneof=vi en th zh ja ko fr de es"`
	Format     string    `json:"format" validate:"required,oneof=text json srt"`
}

// AiTranscriberResp contains the transcribed and translated content
type AiTranscriberResp struct {
	Content string `json:"content"`
}

// EmailGeneratorData contains request data for email generation
type EmailGeneratorData struct {
	Topic    string `json:"topic" validate:"required"`
	Language string `json:"language" validate:"required,oneof=vi en th zh ja ko"`
	Tone     string `json:"tone" validate:"required,oneof=professional formal casual friendly urgent apologetic"`
}

// EmailGeneratorResp contains the generated email subject and body
type EmailGeneratorResp struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

// MarkdownFormatData contains request data for markdown formatting
type MarkdownFormatData struct {
	Markdown string `json:"markdown" validate:"required"`
}

// MarkdownFormatResp contains the formatted markdown content
type MarkdownFormatResp struct {
	Content string `json:"content"`
}

// MermaidGeneratorData contains request data for Mermaid diagram generation
type MermaidGeneratorData struct {
	Description string `json:"description" validate:"required"`
	DiagramType string `json:"diagram_type" validate:"required,oneof=auto flowchart sequenceDiagram classDiagram stateDiagram erDiagram journey gantt mindmap"`
}

// MermaidGeneratorResp contains Mermaid chart source generated from a prompt
type MermaidGeneratorResp struct {
	Content string `json:"content"`
}

// OcrData contains request data for OCR image text extraction
type OcrData struct {
	Image    []byte `json:"-"`
	MimeType string `json:"mime_type" validate:"required,oneof=image/jpeg image/png image/gif image/webp"`
	Format   string `json:"format" validate:"required,oneof=text markdown html json"`
}

// OcrResp contains the extracted text from the image
type OcrResp struct {
	Content string `json:"content"`
}

// SmartChatReplyData contains request data for smart chat reply generation.
// Either TextInput or Image+MimeType must be provided.
type SmartChatReplyData struct {
	TextInput  string `json:"text_input"`
	Image      []byte `json:"-"`
	MimeType   string `json:"mime_type"`
	TargetLang string `json:"target_lang" validate:"required,oneof=vi en th zh ja ko"`
	Style      string `json:"style" validate:"required,oneof=professional friendly flirty humorous witty mimic empathetic direct"`
}

// SmartChatReplyResp contains 5 generated reply suggestions
type SmartChatReplyResp struct {
	Suggestions []string `json:"suggestions"`
}

// TextSummarizerData contains request data for text summarization
type TextSummarizerData struct {
	Text       string `json:"text" validate:"required"`
	TargetLang string `json:"target_lang" validate:"required,oneof=vi en th zh ja ko"`
	Mode       string `json:"mode" validate:"required,oneof=shortest key_points concise detailed professional"`
}

// TextSummarizerResp contains the generated summary
type TextSummarizerResp struct {
	Content string `json:"content"`
}
