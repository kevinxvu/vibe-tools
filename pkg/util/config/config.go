package cfgutil

import (
	"os"
	"strings"

	"github.com/caarlos0/env/v5"
	"github.com/joho/godotenv"
)

// Load loads configuration with priority order:
// 1. OS environment variables (highest priority)
// 2. .env file
// 3. .env.local file (lowest priority)
func Load(out interface{}, stage string) error {
	// Load .env files only if env vars are not already set in OS
	// godotenv.Load will NOT overwrite existing OS env vars
	if err := LoadLocalENV(stage); err != nil {
		return err
	}

	// Parse from environment variables (OS env vars take priority)
	if err := env.Parse(out); err != nil {
		return err
	}

	return nil
}

// LoadConfig loads configuration from .env file
func LoadConfig(out interface{}, appName, stage string) error {

	return Load(out, stage)
}

// LoadLocalENV reads .env* files and sets the values to os ENV
// Priority order (highest to lowest):
// 1. Existing OS environment variables (not overwritten)
// 2. .env file
// 3. .env.local file
func LoadLocalENV(stage string) error {
	basePath := ""
	if stage == "test" {
		basePath = "testdata/"
	}

	existingEnv := existingEnvironment()

	// Load local config first (.env.local) - lowest priority
	if _, err := os.Stat(basePath + ".env.local"); err == nil {
		if err := loadENVFile(basePath+".env.local", existingEnv, false); err != nil {
			return err
		}
	}

	// Load default config (.env) - can override .env.local values
	// but will NOT override OS env vars
	if _, err := os.Stat(basePath + ".env"); err == nil {
		if err := loadENVFile(basePath+".env", existingEnv, true); err != nil {
			return err
		}
	}

	// OS environment variables always have highest priority
	// They are never overwritten by .env* files

	return nil
}

func existingEnvironment() map[string]struct{} {
	env := make(map[string]struct{})
	for _, pair := range os.Environ() {
		key, _, ok := strings.Cut(pair, "=")
		if ok {
			env[key] = struct{}{}
		}
	}
	return env
}

func loadENVFile(path string, existingEnv map[string]struct{}, overwriteLoaded bool) error {
	values, err := godotenv.Read(path)
	if err != nil {
		return err
	}

	for key, value := range values {
		if _, exists := existingEnv[key]; exists {
			continue
		}
		if !overwriteLoaded {
			if _, exists := os.LookupEnv(key); exists {
				continue
			}
		}
		if err := os.Setenv(key, value); err != nil {
			return err
		}
	}

	return nil
}
