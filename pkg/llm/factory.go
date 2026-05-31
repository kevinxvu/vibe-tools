package llm

import "fmt"

// ProviderType identifies an LLM backend.
type ProviderType string

const (
	// ProviderOpenAI selects the OpenAI backend.
	ProviderOpenAI ProviderType = "openai"

	// ProviderGenAI selects the Google GenAI (Gemini / Vertex AI) backend.
	ProviderGenAI ProviderType = "genai"
)

// Factory holds registered Provider implementations and creates the active one.
// Only one provider is active at a time, selected by ProviderType.
type Factory struct {
	providers map[ProviderType]Provider
}

// NewFactory returns an empty Factory.
func NewFactory() *Factory {
	return &Factory{providers: make(map[ProviderType]Provider)}
}

// Register adds a Provider under the given ProviderType.
// Returns the Factory so calls can be chained.
func (f *Factory) Register(t ProviderType, p Provider) *Factory {
	f.providers[t] = p
	return f
}

// Create returns the Provider registered under t.
// If t is empty it defaults to ProviderOpenAI.
// Returns an error if the requested provider was not registered.
func (f *Factory) Create(t ProviderType) (Provider, error) {
	if t == "" {
		t = ProviderOpenAI
	}
	p, ok := f.providers[t]
	if !ok {
		return nil, fmt.Errorf("llm: provider %q is not registered", t)
	}
	return p, nil
}
