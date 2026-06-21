package config

import (
	"fmt"
	"os"

	cfgutil "github.com/kevinxvu/vibe-tools/pkg/util/config"
)

// Configuration holds data necessery for configuring application
type Configuration struct {
	Stage           string   `env:"STAGE" envDefault:"production"`
	Host            string   `env:"HOST"`
	Port            int      `env:"PORT" envDefault:"8080"`
	ReadTimeout     int      `env:"READ_TIMEOUT" envDefault:"30"`
	WriteTimeout    int      `env:"WRITE_TIMEOUT" envDefault:"30"`
	AllowOrigins    []string `env:"ALLOW_ORIGINS" envDefault:"*"`
	Debug           bool     `env:"DEBUG" envDefault:"true"`
	DbLog           bool     `env:"DB_LOG"`
	DbType          string   `env:"DB_TYPE"`
	DbDsn           string   `env:"DB_DSN"`
	JwtSecret       string   `env:"JWT_SECRET"`
	JwtDuration     int      `env:"JWT_DURATION"`
	JwtAlgorithm    string   `env:"JWT_ALGORITHM"`
	IsEnableAIPDocs bool     `env:"IS_ENABLE_API_DOCS" envDefault:"false"`
	APIDocsPath     string   `env:"API_DOCS_PATH" envDefault:"docs"`
	AppID           string   `env:"APP_ID" envDefault:"vibe-tools"`

	// Frontend runtime configuration exposed to the embedded SPA.
	APIBaseURL     string `env:"API_BASE_URL" envDefault:"http://localhost:8080"`
	MarkdownAPIURL string `env:"MARKDOWN_API_URL"`
	MarkdownAPIKey string `env:"MARKDOWN_API_KEY"`

	// LLM shared configuration – applies to whichever provider is active.
	LLMProvider        string `env:"LLM_PROVIDER" envDefault:"openai"` // "openai" or "genai"
	LLMTextModel       string `env:"LLM_TEXT_MODEL" envDefault:"gpt-5.5"`
	LLMAudioModel      string `env:"LLM_AUDIO_MODEL" envDefault:"whisper-1"`
	LLMTimeout         int    `env:"LLM_TIMEOUT" envDefault:"300"`
	LLMMaxRetries      int    `env:"LLM_MAX_RETRIES" envDefault:"0"`
	LLMMaxInputTokens  int    `env:"LLM_MAX_INPUT_TOKENS"`  // 0 = unlimited
	LLMMaxOutputTokens int    `env:"LLM_MAX_OUTPUT_TOKENS"` // 0 = unlimited
	LLMLimitTokenUsage int64  `env:"LLM_LIMIT_TOKEN_USAGE"` // 0 = unlimited

	// OpenAI-specific configuration
	OpenAIAPIKey  string `env:"OPENAI_API_KEY"`
	OpenAIBaseURL string `env:"OPENAI_BASE_URL"`

	// Google GenAI-specific configuration (Gemini API or Vertex AI)
	GenAIAPIKey  string `env:"GENAI_API_KEY"`
	GenAIBackend int    `env:"GENAI_BACKEND" envDefault:"2"` // 0=auto, 1=Gemini API, 2=Vertex AI
}

// Load returns Configuration struct
func Load() (*Configuration, error) {
	appName := os.Getenv("AWS_LAMBDA_FUNCTION_NAME")
	if configname := os.Getenv("CONFIG_NAME"); configname != "" {
		appName = configname
	}
	stage := os.Getenv("STAGE")
	if configstage := os.Getenv("CONFIG_STAGE"); configstage != "" {
		stage = configstage
	}

	cfg := new(Configuration)
	if err := cfgutil.LoadConfig(cfg, appName, stage); err != nil {
		return nil, fmt.Errorf("Error parsing environment config: %s", err)
	}
	return cfg, nil
}
