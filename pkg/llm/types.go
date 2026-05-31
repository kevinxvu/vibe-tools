package llm

import "io"

// Message represents a chat message with optional image URLs
type Message struct {
	Role      string   `json:"role"`       // system, user, or assistant
	Content   string   `json:"content"`    // Text content
	ImageURLs []string `json:"image_urls"` // Optional image URLs for vision models
}

// ChatRequest represents a chat completion request
type ChatRequest struct {
	Messages     []Message `json:"messages"`                // List of messages
	Model        *string   `json:"model,omitempty"`         // Optional model override
	MaxTokens    *int64    `json:"max_tokens,omitempty"`    // Optional max tokens override
	Temperature  *float64  `json:"temperature,omitempty"`   // Optional temperature override (0.0 to 2.0)
	SystemPrompt *string   `json:"system_prompt,omitempty"` // Optional system prompt
	TopP         *float64  `json:"top_p,omitempty"`         // Optional nucleus sampling
	Stop         []string  `json:"stop,omitempty"`          // Optional stop sequences
}

// TokenUsage represents token usage statistics
type TokenUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// ChatResponse represents a chat completion response
type ChatResponse struct {
	ID           string     `json:"id"`
	Content      string     `json:"content"`
	Model        string     `json:"model"`
	FinishReason string     `json:"finish_reason"`
	Usage        TokenUsage `json:"usage"`
	CreatedAt    int64      `json:"created_at"`
}

// AudioRequest represents an audio transcription request
type AudioRequest struct {
	File     io.Reader `json:"-"`                         // Audio file reader
	FileName string    `json:"file_name"`                 // File name (required for API)
	Language *string   `json:"language,omitempty"`        // Optional language code (ISO-639-1, e.g., "en")
	Prompt   *string   `json:"prompt,omitempty"`          // Optional context to guide transcription
	Format   *string   `json:"response_format,omitempty"` // Optional format (json, text, srt, vtt)
}

// AudioResponse represents an audio transcription response
type AudioResponse struct {
	Text     string   `json:"text"`               // Transcribed text
	Language string   `json:"language,omitempty"` // Detected language (if available)
	Duration *float64 `json:"duration,omitempty"` // Duration in seconds (if available)
}

// AudioWithPromptRequest represents a chat-completion-based audio request
type AudioWithPromptRequest struct {
	File         io.Reader `json:"-"`
	FileName     string    `json:"file_name"`
	SystemPrompt *string   `json:"system_prompt,omitempty"`
	UserPrompt   string    `json:"user_prompt"`
}

// StreamHandler is a callback function that receives streaming chunks.
// chunk: the text content of the current chunk.
// done: true when streaming is complete.
type StreamHandler func(chunk string, done bool) error

// ModelNames holds the resolved model names for external inspection
type ModelNames struct {
	TextModel  string
	AudioModel string
}
