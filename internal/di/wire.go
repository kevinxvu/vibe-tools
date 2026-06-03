//go:build wireinject
// +build wireinject

package di

import (
	"context"

	"github.com/google/wire"
	"github.com/kevinxvu/vibe-tools/config"

	// authSvc "github.com/kevinxvu/vibe-tools/internal/api/service/auth"       // disabled - no database
	// countrySvc "github.com/kevinxvu/vibe-tools/internal/api/service/country" // disabled - no database
	llmSvc "github.com/kevinxvu/vibe-tools/internal/api/service/llm"
	// userSvc "github.com/kevinxvu/vibe-tools/internal/api/service/user"       // disabled - no database
	"github.com/kevinxvu/vibe-tools/internal/model"
	// "github.com/kevinxvu/vibe-tools/internal/repository"                     // disabled - no database
	// "github.com/kevinxvu/vibe-tools/pkg/database"                            // disabled - no database
	llmpkg "github.com/kevinxvu/vibe-tools/pkg/llm"
	genaiPkg "github.com/kevinxvu/vibe-tools/pkg/llm/genai"
	openaiPkg "github.com/kevinxvu/vibe-tools/pkg/llm/openai"
	"github.com/kevinxvu/vibe-tools/pkg/server"
	"github.com/labstack/echo/v4"
	googlegenai "google.golang.org/genai"
	// "gorm.io/gorm"                                                           // disabled - no database
)

// ProvideConfig loads configuration
func ProvideConfig() (*config.Configuration, error) {
	return config.Load()
}

// ProvideDB initializes database connection
// Disabled - no database configured
// func ProvideDB(cfg *config.Configuration) (*gorm.DB, error) {
// return database.New(cfg.DbType, cfg.DbDsn, cfg.DbLog)
// }

// ProvideUserDB creates user database repository
// Disabled - no database configured
// func ProvideUserDB() *repository.UserRepository {
// return repository.NewUserRepository()
// }

// ProvideCountryDB creates country database repository
// Disabled - no database configured
// func ProvideCountryDB() *repository.CountryRepository {
// return repository.NewCountryRepository()
// }

type publicAuth struct{}

func (publicAuth) User(echo.Context) *model.AuthUser {
	return nil
}

// ProvideAuth creates a no-op Auth implementation for public routes.
func ProvideAuth() model.Auth {
	return publicAuth{}
}

// ProvideAuthJWT creates auth.JWT interface from JWT service
// Disabled - no database configured
// func ProvideAuthJWT(jwtSvc *jwt.Service) authSvc.JWT {
// return jwtSvc
// }

// ProvideAuthService creates auth service
// Disabled - no database configured
// func ProvideAuthService(db *gorm.DB, userDB *repository.UserRepository, jwtSvc authSvc.JWT) authSvc.Service {
// return authSvc.New(db, userDB, jwtSvc)
// }

// ProvideUserService creates user service
// Disabled - no database configured
// func ProvideUserService(db *gorm.DB, userDB *repository.UserRepository) userSvc.Service {
// return userSvc.New(db, userDB)
// }

// ProvideCountryService creates country service
// Disabled - no database configured
// func ProvideCountryService(db *gorm.DB, countryDB *repository.CountryRepository) countrySvc.Service {
// return countrySvc.New(db, countryDB)
// }

// ProvideLLMFactory builds a Factory with all registered providers and returns
// the single active Provider selected by cfg.LLMProvider.
func ProvideLLMFactory(cfg *config.Configuration, openAI *openaiPkg.Service, genAI *genaiPkg.Service) (llmpkg.Provider, error) {
	f := llmpkg.NewFactory()
	if openAI != nil {
		f.Register(llmpkg.ProviderOpenAI, openAI)
	}
	if genAI != nil {
		f.Register(llmpkg.ProviderGenAI, genAI)
	}
	providerType := llmpkg.ProviderType(cfg.LLMProvider)
	p, err := f.Create(providerType)
	if err != nil {
		return llmpkg.NewDisabledProvider(providerType), nil
	}
	return p, nil
}

// ProvideLLMService creates llm service using the active Provider from the factory.
func ProvideLLMService(p llmpkg.Provider) llmSvc.Service {
	return llmSvc.New(p)
}

// ProvideServer creates Echo server
func ProvideServer(cfg *config.Configuration) *echo.Echo {
	return server.New(&server.Config{
		Stage:        cfg.Stage,
		Port:         cfg.Port,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		AllowOrigins: cfg.AllowOrigins,
		Debug:        cfg.Debug,
	})
}

// ProvideOpenAIService creates OpenAI service
func ProvideOpenAIService(cfg *config.Configuration) *openaiPkg.Service {
	if cfg.OpenAIAPIKey == "" {
		return nil
	}
	return openaiPkg.New(openaiPkg.Config{
		APIKey:          cfg.OpenAIAPIKey,
		BaseURL:         cfg.OpenAIBaseURL,
		Timeout:         cfg.LLMTimeout,
		MaxRetries:      cfg.LLMMaxRetries,
		TextModel:       cfg.LLMTextModel,
		AudioModel:      cfg.LLMAudioModel,
		MaxInputTokens:  cfg.LLMMaxInputTokens,
		MaxOutputTokens: cfg.LLMMaxOutputTokens,
		LimitTokenUsage: cfg.LLMLimitTokenUsage,
	})
}

// ProvideGenAIService creates Google GenAI service.
// Returns nil (no error) when no credentials are configured.
// APIKey and Project are mutually exclusive: APIKey is used for Gemini Developer API,
// Project+Location are used for Vertex AI.
func ProvideGenAIService(cfg *config.Configuration) (*genaiPkg.Service, error) {
	if cfg.GenAIAPIKey == "" {
		return nil, nil
	}
	genCfg := genaiPkg.Config{
		Backend:         googlegenai.Backend(cfg.GenAIBackend),
		TextModel:       cfg.LLMTextModel,
		Timeout:         cfg.LLMTimeout,
		MaxRetries:      cfg.LLMMaxRetries,
		MaxInputTokens:  cfg.LLMMaxInputTokens,
		MaxOutputTokens: cfg.LLMMaxOutputTokens,
		LimitTokenUsage: cfg.LLMLimitTokenUsage,
		APIKey:          cfg.GenAIAPIKey,
	}
	return genaiPkg.New(context.Background(), genCfg)
}

// Application holds all initialized services
type Application struct {
	Config *config.Configuration
	// DB         *gorm.DB           // disabled - no database
	Server *echo.Echo
	Auth   model.Auth
	// AuthSvc    authSvc.Service    // disabled - no database
	// UserSvc    userSvc.Service    // disabled - no database
	// CountrySvc countrySvc.Service // disabled - no database
	LLMSvc llmSvc.Service
}

// InitializeApplication uses wire to build all dependencies
func InitializeApplication() (*Application, error) {
	wire.Build(
		ProvideConfig,
		// ProvideDB,             // disabled - no database
		// ProvideUserDB,         // disabled - no database
		// ProvideCountryDB,      // disabled - no database
		ProvideAuth,
		// ProvideAuthJWT,        // disabled - no database
		// ProvideAuthService,    // disabled - no database
		// ProvideUserService,    // disabled - no database
		// ProvideCountryService, // disabled - no database
		ProvideLLMFactory,
		ProvideLLMService,
		ProvideServer,
		ProvideOpenAIService,
		ProvideGenAIService,
		wire.Struct(new(Application), "*"),
	)
	return nil, nil
}
