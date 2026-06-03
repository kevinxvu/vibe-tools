package llm

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kevinxvu/vibe-tools/pkg/server/apperr"
)

// DisabledProvider is used when no LLM credentials are configured.
// It lets the app start while LLM endpoints fail with a clear 503 response.
type DisabledProvider struct {
	provider ProviderType
}

// NewDisabledProvider returns a Provider that reports LLM configuration is missing.
func NewDisabledProvider(provider ProviderType) *DisabledProvider {
	if provider == "" {
		provider = ProviderOpenAI
	}
	return &DisabledProvider{provider: provider}
}

func (p *DisabledProvider) ChatCompletion(context.Context, ChatRequest) (*ChatResponse, error) {
	return nil, p.err()
}

func (p *DisabledProvider) ChatCompletionStream(context.Context, ChatRequest, StreamHandler) (*ChatResponse, error) {
	return nil, p.err()
}

func (p *DisabledProvider) TranscribeAudio(context.Context, AudioRequest) (*AudioResponse, error) {
	return nil, p.err()
}

func (p *DisabledProvider) TranscribeAudioWithPrompt(context.Context, AudioWithPromptRequest) (*ChatResponse, error) {
	return nil, p.err()
}

func (p *DisabledProvider) TranslateAudio(context.Context, AudioRequest) (*AudioResponse, error) {
	return nil, p.err()
}

func (p *DisabledProvider) GetTotalTokensUsed() int64 {
	return 0
}

func (p *DisabledProvider) ModelNames() ModelNames {
	return ModelNames{}
}

func (p *DisabledProvider) err() *apperr.HTTPError {
	return apperr.NewHTTPError(
		http.StatusServiceUnavailable,
		"LLM_PROVIDER_DISABLED",
		fmt.Sprintf("LLM provider %q is not configured", p.provider),
	)
}
