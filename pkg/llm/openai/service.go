package openai

import (
	"net/http"
	"sync/atomic"
	"time"

	"github.com/kevinxvu/vibe-tools/pkg/server/apperr"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

// Config holds the configuration for the OpenAI service
type Config struct {
	APIKey     string
	BaseURL    string
	Timeout    int
	MaxRetries int

	// Model defaults per capability
	TextModel  string // Default model for chat/text completions (e.g. gpt-4o)
	AudioModel string // Default model for audio transcription/translation (e.g. whisper-1)

	// Token limits
	MaxInputTokens  int   // Max estimated input tokens per request (0 = disabled)
	MaxOutputTokens int   // Max output tokens per request forwarded to API (0 = disabled)
	LimitTokenUsage int64 // Global cumulative token budget across all calls (0 = disabled)
}

// Service represents the OpenAI service
type Service struct {
	cfg             Config
	client          openai.Client
	totalTokensUsed int64 // cumulative token counter (atomic)
}

// GetTotalTokensUsed returns the cumulative token count since service start
func (s *Service) GetTotalTokensUsed() int64 {
	return atomic.LoadInt64(&s.totalTokensUsed)
}

// New creates a new OpenAI service instance
func New(cfg Config) *Service {
	opts := []option.RequestOption{
		option.WithAPIKey(cfg.APIKey),
	}

	// Add optional base URL (for Azure OpenAI or custom endpoints/proxies)
	if cfg.BaseURL != "" {
		opts = append(opts, option.WithBaseURL(cfg.BaseURL))
	}

	// Add timeout if specified
	if cfg.Timeout > 0 {
		opts = append(opts, option.WithRequestTimeout(time.Duration(cfg.Timeout)*time.Second))
	}

	// Add max retries if specified
	if cfg.MaxRetries > 0 {
		opts = append(opts, option.WithMaxRetries(cfg.MaxRetries))
	}

	return &Service{
		cfg:    cfg,
		client: openai.NewClient(opts...),
	}
}

// Custom errors for OpenAI service
var (
	// ErrInvalidAPIKey is returned when the API key is invalid or missing
	ErrInvalidAPIKey = apperr.NewHTTPError(http.StatusUnauthorized, "INVALID_API_KEY", "Invalid or missing OpenAI API key")

	// ErrEmptyPrompt is returned when the prompt is empty
	ErrEmptyPrompt = apperr.NewHTTPError(http.StatusBadRequest, "EMPTY_PROMPT", "Prompt cannot be empty")

	// ErrUnsupportedFormat is returned when the file format is not supported
	ErrUnsupportedFormat = apperr.NewHTTPError(http.StatusBadRequest, "UNSUPPORTED_FORMAT", "Unsupported file format")

	// ErrStreamingFailed is returned when streaming fails
	ErrStreamingFailed = apperr.NewHTTPError(http.StatusInternalServerError, "STREAMING_FAILED", "Streaming response failed")

	// ErrNoMessages is returned when no messages are provided
	ErrNoMessages = apperr.NewHTTPError(http.StatusBadRequest, "NO_MESSAGES", "At least one message is required")

	// ErrNoFile is returned when no file is provided for audio transcription
	ErrNoFile = apperr.NewHTTPError(http.StatusBadRequest, "NO_FILE", "Audio file is required")

	// ErrAPIError is returned when the OpenAI API returns an error
	ErrAPIError = apperr.NewHTTPError(http.StatusBadGateway, "OPENAI_API_ERROR", "OpenAI API error")

	// ErrInputTooLong is returned when the estimated input tokens exceed the configured limit
	ErrInputTooLong = apperr.NewHTTPError(http.StatusBadRequest, "INPUT_TOO_LONG", "Input exceeds maximum allowed tokens")

	// ErrTokenBudgetExceeded is returned when the global cumulative token budget has been reached
	ErrTokenBudgetExceeded = apperr.NewHTTPError(http.StatusTooManyRequests, "TOKEN_BUDGET_EXCEEDED", "Token usage limit has been reached")
)
