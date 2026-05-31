package genai

import (
	"context"
	"errors"
	"net/http"
	"sync/atomic"
	"time"

	llm "github.com/kevinxvu/vibe-tools/pkg/llm"
	"github.com/kevinxvu/vibe-tools/pkg/server/apperr"
	googlegenai "google.golang.org/genai"
)

// Config holds configuration for the Google GenAI service.
// Supports both Gemini API (APIKey) and Vertex AI (Project + Location).
type Config struct {
	// Gemini Developer API key. Required when using BackendGeminiAPI.
	// Can also be set via GOOGLE_API_KEY or GEMINI_API_KEY env vars.
	APIKey string

	// Backend selects Gemini API or Vertex AI.
	// 0 = auto-detect from env vars, 1 = Gemini API, 2 = Vertex AI.
	Backend googlegenai.Backend

	// Default model for chat/text completions (e.g. "gemini-3-flash-preview").
	// Also used for audio transcription via multimodal input.
	TextModel string

	// Max retries on transient errors (0 = no retries)
	MaxRetries int

	// Max estimated input tokens per request; request is rejected client-side before
	// hitting the API (0 = disabled)
	MaxInputTokens int

	// HTTP timeout in seconds (0 = no timeout)
	Timeout int

	// Max output tokens per request forwarded to the API (0 = disabled)
	MaxOutputTokens int

	// Global cumulative token budget across all calls (0 = disabled)
	LimitTokenUsage int64
}

// Service is the Google GenAI provider implementation of llm.Provider.
type Service struct {
	cfg             Config
	client          *googlegenai.Client
	totalTokensUsed int64 // atomic cumulative token counter
}

// Errors
var (
	ErrNoMessages          = apperr.NewHTTPInternalError("no messages provided")
	ErrEmptyPrompt         = apperr.NewHTTPInternalError("message content cannot be empty")
	ErrNoFile              = apperr.NewHTTPInternalError("no audio file provided")
	ErrInputTooLong        = apperr.NewHTTPInternalError("input exceeds maximum token limit")
	ErrAPIError            = apperr.NewHTTPInternalError("genai api error")
	ErrStreamingFailed     = apperr.NewHTTPInternalError("streaming failed")
	ErrTokenBudgetExceeded = apperr.NewHTTPInternalError("token budget exceeded")
)

// New creates a new Google GenAI service instance.
func New(ctx context.Context, cfg Config) (*Service, error) {
	cc := &googlegenai.ClientConfig{
		APIKey:  cfg.APIKey,
		Backend: cfg.Backend,
	}

	if cfg.Timeout > 0 {
		cc.HTTPClient = &http.Client{
			Timeout: time.Duration(cfg.Timeout) * time.Second,
		}
	}

	client, err := googlegenai.NewClient(ctx, cc)
	if err != nil {
		return nil, err
	}

	return &Service{cfg: cfg, client: client}, nil
}

// withRetry executes fn, retrying up to s.cfg.MaxRetries times on transient errors.
func (s *Service) withRetry(fn func() error) error {
	var err error
	attempts := 1 + s.cfg.MaxRetries
	for i := 0; i < attempts; i++ {
		if err = fn(); err == nil {
			return nil
		}
		// Only retry on API errors, not validation errors
		var appErr *apperr.HTTPError
		if errors.As(err, &appErr) && appErr != ErrAPIError {
			return err
		}
		if i < attempts-1 {
			time.Sleep(time.Duration(i+1) * 500 * time.Millisecond)
		}
	}
	return err
}

// GetTotalTokensUsed returns the cumulative token count since service start.
func (s *Service) GetTotalTokensUsed() int64 {
	return atomic.LoadInt64(&s.totalTokensUsed)
}

// ModelNames returns the resolved model names.
// GenAI uses the same multimodal model for both text and audio.
func (s *Service) ModelNames() llm.ModelNames {
	model := s.getTextModel(nil)
	return llm.ModelNames{
		TextModel:  model,
		AudioModel: model,
	}
}

// getTextModel returns the model name from the request or the configured default.
func (s *Service) getTextModel(model *string) string {
	if model != nil && *model != "" {
		return *model
	}
	if s.cfg.TextModel != "" {
		return s.cfg.TextModel
	}
	return "gemini-3-flash-preview"
}
