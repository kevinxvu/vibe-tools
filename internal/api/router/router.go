package router

import (
	"encoding/json"
	"io/fs"
	"mime"
	"net/http"
	"strings"

	"github.com/kevinxvu/vibe-tools/fontend"
	"github.com/kevinxvu/vibe-tools/pkg/server/middleware/secure"

	// "github.com/kevinxvu/vibe-tools/internal/api/handler/auth"   // disabled - no database
	// "github.com/kevinxvu/vibe-tools/internal/api/handler/country" // disabled - no database
	"github.com/kevinxvu/vibe-tools/internal/api/handler/llm"
	// "github.com/kevinxvu/vibe-tools/internal/api/handler/user"    // disabled - no database
	"github.com/kevinxvu/vibe-tools/internal/di"
	"github.com/labstack/echo/v4"
)

// RegisterRoutes registers all API routes
func RegisterRoutes(app *di.Application) {
	// Health check endpoint (no authentication required)
	app.Server.GET("/health", healthCheck)

	// Auth routes (no JWT middleware) - disabled (no database configured)
	// auth.NewHTTP(app.AuthSvc, app.Server)

	// Protected v1 routes with JWT middleware
	v1Router := app.Server.Group("/api/v1")
	//v1Router.Use(app.JWT.MWFunc())

	// Register module routes on sub-groups
	// user.NewHTTP(app.UserSvc, app.Auth, v1Router.Group("/users"))       // disabled - no database
	// country.NewHTTP(app.CountrySvc, app.Auth, v1Router.Group("/countries")) // disabled - no database
	llmV1Router := v1Router.Group("/llm", secure.VerifyHeader("X-App-Id", app.Config.AppID))
	llm.NewHTTP(app.LLMSvc, app.Auth, llmV1Router)

	// Runtime frontend config is served by the backend so the embedded SPA can use the same environment as this service.
	app.Server.GET("/runtime-config.js", runtimeConfig(app))

	// Serve frontend SPA (must be registered last to not shadow API routes)
	serveFrontend(app.Server)
}

func runtimeConfig(app *di.Application) echo.HandlerFunc {
	return func(c echo.Context) error {
		config := map[string]string{
			"API_BASE_URL":     app.Config.APIBaseURL,
			"APP_ID":           app.Config.AppID,
			"MARKDOWN_API_URL": app.Config.MarkdownAPIURL,
			"MARKDOWN_API_KEY": app.Config.MarkdownAPIKey,
		}

		payload, err := json.Marshal(config)
		if err != nil {
			return err
		}

		c.Response().Header().Set(echo.HeaderContentType, "application/javascript; charset=utf-8")
		c.Response().Header().Set(echo.HeaderCacheControl, "no-store, no-cache, must-revalidate, proxy-revalidate")
		c.Response().Header().Set("Pragma", "no-cache")
		return c.Blob(http.StatusOK, "application/javascript; charset=utf-8", []byte("window.__APP_CONFIG__ = "+string(payload)+";"))
	}
}

// serveFrontend serves the embedded frontend SPA.
// Static assets are served directly; any unmatched path falls back to index.html to support client-side routing.
func serveFrontend(e *echo.Echo) {
	// Ensure correct MIME types are registered for environments without /etc/mime.types (e.g. Alpine Linux Docker images)
	mime.AddExtensionType(".js", "text/javascript; charset=utf-8")
	mime.AddExtensionType(".mjs", "text/javascript; charset=utf-8")
	mime.AddExtensionType(".css", "text/css; charset=utf-8")

	distFS, err := fs.Sub(fontend.DistFS, "dist")
	if err != nil {
		panic(err)
	}
	fileServer := http.FileServerFS(distFS)

	e.GET("/*", func(c echo.Context) error {
		path := strings.TrimPrefix(c.Request().URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// If the requested file does not exist, rewrite to root so the SPA index.html is served and client-side routing can take over.
		if _, err := distFS.Open(path); err != nil {
			c.Request().URL.Path = "/"
		}

		fileServer.ServeHTTP(c.Response(), c.Request())
		return nil
	})
}

// healthCheck is a simple health check endpoint
func healthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"message": "Server is running",
	})
}
