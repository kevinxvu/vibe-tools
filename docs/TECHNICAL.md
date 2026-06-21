# VibeTools — Technical Documentation

> This document covers architecture, project structure, development setup, API reference, and deployment details for contributors and self-hosters.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started (Development)](#getting-started-development)
- [Configuration Reference](#configuration-reference)
- [API Reference](#api-reference)
- [LLM Provider System](#llm-provider-system)
- [Dependency Injection (Wire)](#dependency-injection-wire)
- [Frontend (Embedded SPA)](#frontend-embedded-spa)
- [Docker & Deployment](#docker--deployment)
- [Development Commands](#development-commands)

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend Framework | Echo v4 |
| Dependency Injection | Google Wire |
| Logging | Uber Zap (structured JSON) |
| API Docs | Swaggo (Swagger / OpenAPI) |
| AI Integration | OpenAI Go SDK (chat + audio), Google GenAI / Vertex AI |
| Frontend Framework | React 19 + TypeScript 5.8 + Vite 6 |
| Frontend Styling | Tailwind CSS |
| Frontend Delivery | Embedded SPA via `//go:embed` |

---

## Architecture Overview

VibeTools follows a clean architecture pattern with three main layers:

```
cmd/  →  internal/  →  pkg/
```

- **`cmd/api`** — HTTP server entrypoint + dependency injection bootstrap
- **`internal/`** — Application-specific code (handlers, services, repositories, models)
- **`pkg/`** — Reusable infrastructure packages (database, logging, LLM, AWS, etc.)

### Request Flow

```
HTTP Request
  → Echo Router (internal/api/router/)
  → Middleware (JWT, Logger, Security)
  → Handler (internal/api/handler/{module}/)
  → Service (internal/api/service/{module}/)
```

---

## Project Structure

```text
.
├── cmd/
│   ├── api/                    # HTTP server entrypoint
│   └── migration/              # Migration CLI entrypoint
├── config/
│   └── config.go               # Runtime configuration struct
├── docs/                       # Technical documentation
├── fontend/
│   ├── App.tsx                 # React router + route definitions
│   ├── index.tsx               # React entry point
│   ├── static.go               # //go:embed all:dist
│   ├── vite.config.ts
│   ├── components/             # Shared UI components
│   ├── context/                # React context providers
│   ├── data/
│   │   └── internalTools.json  # Tool definitions (id, name, url, icon, order)
│   ├── lib/
│   │   ├── apiClient.ts        # Axios instance
│   │   ├── localStorage.ts     # Tool state persistence helpers
│   │   ├── useToolState.ts     # Auto-save hook (500ms debounce)
│   │   └── services/           # LLM + markdown service clients
│   ├── locales/
│   │   ├── en.json             # English translations
│   │   └── vi.json             # Vietnamese translations
│   └── pages/                  # One file per tool (30 tools)
├── internal/
│   ├── api/
│   │   ├── docs/               # Swagger/OpenAPI output (generated)
│   │   ├── handler/            # HTTP handlers per module
│   │   ├── router/             # Route registration
│   │   └── service/            # Business logic per module
│   ├── di/
│   │   ├── wire.go             # Wire provider definitions (build tag: wireinject)
│   │   └── wire_gen.go         # Generated DI wiring — do NOT edit manually
│   ├── migrations/             # SQL migration files (Goose format)
│   ├── model/                  # GORM models (embed model.Base, not gorm.Model)
│   └── repository/             # Data access layer (flat structure)
└── pkg/
    ├── aws/
    │   ├── email/              # SES email sending
    │   ├── s3/                 # S3 file storage
    │   ├── sns/                # SNS notifications
    │   └── sqs/                # SQS messaging
    ├── database/               # Base repository CRUD (Create, View, List, Update, Delete)
    ├── llm/
    │   ├── factory.go          # Provider factory (selects openai or genai)
    │   ├── provider.go         # Provider interface
    │   ├── types.go            # Shared types
    │   ├── openai/             # OpenAI-compatible client
    │   └── genai/              # Google GenAI / Vertex AI client
    ├── logging/                # Uber Zap wrapper + GORM adapter
    └── server/
        ├── server.go           # Echo server setup
        ├── apperr/             # HTTP error helpers
        ├── binder/             # Request binding + custom validators
        └── middleware/         # JWT, logger, security middleware
```

---

## Getting Started (Development)

### Prerequisites

- Go `1.24+`
- Docker and Docker Compose
- `air` — hot reload: `go install github.com/air-verse/air@latest`
- `wire` — DI codegen: `go install github.com/google/wire/cmd/wire@latest`
- `swag` — Swagger codegen: `go install github.com/swaggo/swag/cmd/swag@latest`

### First Time Setup

```bash
# Clone and enter the repo
git clone git@github.com:kevinxvu/vibe-tools.git
cd vibe-tools

# Provision database (starts Docker MariaDB container)
make provision

# Start with hot reload
make dev
```

- App: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs/index.html`

### Adding a New Module

Follow the **Service → Handler → Router** pattern:

1. Create `internal/api/service/{module}/service.go` — DTOs, Service interface, DB interface, business logic
2. Create `internal/api/handler/{module}/handler.go` — HTTP handlers, route registration via `NewHTTP()`
3. Add `ProvideXXX()` function to `internal/di/wire.go` and add field to `Application` struct
4. Register routes in `internal/api/router/router.go`
5. Run `make wire`
---

## Configuration Reference

Environment variable priority: **OS env > `.env` > `.env.local`**

### Server

| Variable | Default | Description |
| --- | --- | --- |
| `STAGE` | — | Runtime stage (`development`, `production`). Affects logging behavior. |
| `HOST` | — | Host address the server binds to (e.g. `0.0.0.0`). |
| `PORT` | — | TCP port (e.g. `8080`). |
| `READ_TIMEOUT` | — | HTTP read timeout in seconds. |
| `WRITE_TIMEOUT` | — | HTTP write timeout in seconds. |
| `ALLOW_ORIGINS` | — | Comma-separated CORS allowed origins. Use `*` in development only. |
| `DEBUG` | `false` | Enable verbose debug logging. |
| `DB_LOG` | `false` | Enable GORM SQL query logging. |
| `APP_ID` | `vibetools` | Application identifier. |

### API Docs

| Variable | Default | Description |
| --- | --- | --- |
| `IS_ENABLE_API_DOCS` | `false` | Enable Swagger UI at `/docs/index.html`. Disable in production. |
| `API_DOCS_PATH` | — | Path prefix for Swagger files. |

### LLM (AI Features)

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_PROVIDER` | `openai` | Active provider: `openai` or `genai`. |
| `LLM_TEXT_MODEL` | — | Model name for text/chat completions (e.g. `gpt-4o`). |
| `LLM_AUDIO_MODEL` | — | Model name for audio transcription (e.g. `whisper-1`). |
| `LLM_TIMEOUT` | `300` | Request timeout in seconds. |
| `LLM_MAX_RETRIES` | `0` | Automatic retries on transient errors. |
| `LLM_MAX_INPUT_TOKENS` | `0` | Max input tokens per request. `0` = unlimited. |
| `LLM_MAX_OUTPUT_TOKENS` | `0` | Max output tokens per request. `0` = unlimited. |
| `LLM_LIMIT_TOKEN_USAGE` | `0` | Cumulative token budget. `0` = unlimited. |

### OpenAI Provider

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | API key. Required when `LLM_PROVIDER=openai`. |
| `OPENAI_BASE_URL` | — | Base URL override for Azure OpenAI, local proxies, or Gemini OpenAI-compatible endpoint. |

### Google GenAI Provider

| Variable | Default | Description |
| --- | --- | --- |
| `GENAI_API_KEY` | — | Gemini Developer API key. Used when `GENAI_BACKEND=1`. |
| `GENAI_BACKEND` | `2` | Backend: `0` = auto, `1` = Gemini Developer API, `2` = Vertex AI. |
| `GENAI_PROJECT` | — | GCP project ID. Required for Vertex AI. |
| `GENAI_LOCATION` | — | GCP region (e.g. `us-central1`). |
| `GENAI_CREDENTIALS_FILE` | — | Path to GCP service account JSON. Omit for Application Default Credentials. |

---

## API Reference

### Public Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |

**LLM / AI Tools**

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/llm/chat-to-article` | Convert chat to structured article |
| `POST` | `/llm/ai-transcriber` | Transcribe audio/video |
| `POST` | `/llm/ai-translator` | Translate text with context |
| `POST` | `/llm/email-generator` | Generate emails |
| `POST` | `/llm/markdown-format` | Clean and format markdown |
| `POST` | `/llm/ocr` | Extract text from images |
| `POST` | `/llm/smart-chat-reply` | Suggest chat replies |
| `POST` | `/llm/text-summarizer` | Summarize long content |

Full interactive API docs available at `/docs/index.html` (requires `IS_ENABLE_API_DOCS=true`).

---

## LLM Provider System

The LLM layer uses a factory pattern. All services receive a `llm.Provider` interface — never a concrete type.

```go
type Provider interface {
    Chat(ctx context.Context, req ChatRequest) (ChatResponse, error)
    Transcribe(ctx context.Context, req TranscribeRequest) (TranscribeResponse, error)
}
```

**Provider selection** is controlled by `LLM_PROVIDER`:
- `openai` — uses `pkg/llm/openai`, compatible with OpenAI API, Azure OpenAI, and Gemini OpenAI-compatible endpoint
- `genai` — uses `pkg/llm/genai`, supports Gemini Developer API and Vertex AI

**DI wiring** (`internal/di/wire.go`):
```
ProvideOpenAIService(cfg) → *openaiPkg.Service
ProvideGenAIService(cfg)  → *genaiPkg.Service
ProvideLLMFactory(cfg, openAI, genAI) → llm.Provider
ProvideLLMService(p) → llmSvc.Service
```

---

## Dependency Injection (Wire)

All DI is defined in `internal/di/wire.go` (build tag: `wireinject`).  
Generated code lives in `wire_gen.go` — **never edit manually**.

```bash
make wire   # Regenerate wire_gen.go after changing providers
```

**Steps to add a new provider:**
1. Create a `ProvideXXX(deps...) *YourService` function in `wire.go`
2. Add it to `wire.Build(...)` call
3. Add corresponding field to the `Application` struct
4. Run `make wire`

---

## Frontend (Embedded SPA)

The React frontend is built into `fontend/dist/` and embedded into the Go binary via:

```go
//go:embed all:dist
var dist embed.FS
```

> **Critical**: Use `all:dist`, not `dist`. Without `all:`, files starting with `_` or `.` are excluded — Vite outputs chunks like `_basePickBy-*.js` that would silently go missing.

The SPA fallback route is registered **last** in `internal/api/router/router.go` so API routes are not shadowed.

### Frontend Dev Commands

```bash
cd fontend
make install        # npm install
make dev            # Dev server → http://localhost:3000
make build-local    # Build with .env.development
make build-prod     # Build with .env.production
make check          # TypeScript type check
```

Or from project root:

```bash
make fe.install
make fe.dev
make fe.build
make fe.build-local
make fe.build-prod
```

### Adding a New Tool (Frontend)

1. Add entry to `fontend/data/internalTools.json` (`id`, `name`, `categories`, `url`, `iconName`, `isEnable`, `order`)
2. Create `fontend/pages/YourTool.tsx`
3. Add route in `fontend/App.tsx`
4. Add translation keys to `fontend/locales/en.json` and `fontend/locales/vi.json`

---

## Docker & Deployment

```bash
make docker.build   # Build Docker image
make docker.run     # Run container (requires DB at host.docker.internal:3306)
make docker.stop    # Stop and remove container
make docker.logs    # Tail container logs
make docker.export  # Export image as tar
```

The container entrypoint script (`scripts/docker-entrypoint.sh`) runs pending migrations before starting the HTTP server.

**Health check:** `GET /health`

**Linux note:** On Linux Docker hosts, use `172.17.0.1` instead of `host.docker.internal` to reach the host database.

---

## Development Commands

```bash
make provision              # First-time: start Docker DB + run migrations
make dev                    # Start app with hot reload (air)
make specs                  # Generate Swagger docs (swag)
make wire                   # Regenerate Wire DI code
make test.cover             # Run tests and open coverage report

make build.linux            # Cross-compile for Linux (amd64)
make build.windows          # Cross-compile for Windows
make build.arm              # Cross-compile for ARM
make clean                  # Remove build artifacts
make remove                 # Stop server + remove Docker resources
```
