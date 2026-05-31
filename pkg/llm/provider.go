package llm

import "context"

// Provider is the unified interface for LLM provider implementations.
// The OpenAI service (*openai.Service) satisfies this interface.
type Provider interface {
	// ChatCompletion performs a chat completion request
	ChatCompletion(ctx context.Context, req ChatRequest) (*ChatResponse, error)

	// ChatCompletionStream performs a streaming chat completion request
	ChatCompletionStream(ctx context.Context, req ChatRequest, handler StreamHandler) (*ChatResponse, error)

	// TranscribeAudio transcribes an audio file using the configured audio model
	TranscribeAudio(ctx context.Context, req AudioRequest) (*AudioResponse, error)

	// TranscribeAudioWithPrompt transcribes audio using a custom system/user prompt
	TranscribeAudioWithPrompt(ctx context.Context, req AudioWithPromptRequest) (*ChatResponse, error)

	// TranslateAudio translates audio content to English
	TranslateAudio(ctx context.Context, req AudioRequest) (*AudioResponse, error)

	// GetTotalTokensUsed returns the cumulative token count since service start
	GetTotalTokensUsed() int64

	// ModelNames returns the resolved text and audio model names
	ModelNames() ModelNames
}
