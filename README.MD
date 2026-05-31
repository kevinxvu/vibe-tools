# VibeTools

A practical toolkit for developers who are tired of opening 17 tabs just to format JSON, decode a JWT, and ask AI to summarize a 4,000-word rant.

VibeTools combines a Go backend, an embedded frontend SPA, and a bunch of useful tools in one place.

Vietnamese version: [README_VN.MD](README_VN.MD)

---

## What Is VibeTools?

VibeTools is a full-stack developer toolbox with two big goals:

- Make everyday dev tasks fast and painless.
- Add AI helpers that actually save time instead of adding buzzwords.

You get classic dev utilities and AI-powered tools in one app, backed by a clean Go architecture.

---

## Features

### AI Tools

- Chat to Article: Convert chat logs into structured technical articles.
- Text Summarizer: Summarize long content in multiple styles.
- Email Generator: Draft emails in different tones.
- Smart Chat Reply: Suggest replies from text or screenshot context.
- AI Transcriber: Transcribe audio/video and export as `text`, `json`, or `srt`.
- AI Translator: Context-aware translation with strict input/output behavior.
- OCR Tool: Extract text from images.
- Markdown Format: Clean up messy markdown into readable format.
- Markdown Parser: Convert HTML, plain text, website URLs, and files (DOC, XLSX, PDF) to clean Markdown format.

### Dev Tools

- HTTP Client: Send and inspect REST requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- JSON Formatter: Pretty print, minify, and inspect JSON.
- JWT Tool: Decode and encode JWT (`HS256`).
- Markdown Viewer: Editor + preview with synchronized scrolling.
- HTML Viewer: Edit, preview, tree view, beautify.
- XML Formatter: Format, minify, and inspect XML tree.
- String Hash: MD5, SHA family, Keccak.
- Bcrypt Tool: Generate and verify bcrypt hashes.
- String Length Calculator: Character/word stats, token-aware counting.
- Multiline Converter: Clean and transform multiline text.
- Text Case Converter: Upper, lower, camel, snake, slug, and more.
- String Escaper: Escape/unescape for HTML, XML, JS, JSON, CSV, SQL.
- Text Replacer: Template replacement with `{{var}}` style placeholders.
- HTML Encoder: HTML entity encode/decode.
- Base64 Converter: Encode/decode text and file content.
- URL Converter: URL encode/decode.
- Password Generator: Strong password generation + strength hints.
- UUID Generator: Generate and inspect UUID (`v4`, `v7`).
- Snowflake Generator: Generate and inspect Snowflake IDs.
- Timestamp Converter: Convert Unix timestamps and RFC3339 datetimes.
- Log Analyzer: Tabular view and detailed inspector for structured JSON logs (SQL, API types).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend Framework | Echo v4 |
| ORM | GORM |
| Database | PostgreSQL / MySQL / MariaDB / SQLite |
| Auth | JWT (HS256 / RS256) |
| Migration | Goose (SQL-based) |
| Dependency Injection | Google Wire |
| Logging | Uber Zap (structured JSON) |
| API Docs | Swaggo (Swagger / OpenAPI) |
| AI Integration | OpenAI Go SDK (chat + audio) |
| Cloud Integrations | AWS SES, S3, SNS, SQS |
| Frontend Delivery | Embedded SPA via `//go:embed` |

---

## Project Structure

```text
.
├── cmd/
│   ├── api/                # API entrypoint
│   └── migration/          # Migration CLI entrypoint
├── config/                 # Runtime configuration struct
├── fontend/
│   ├── dist/               # Built frontend bundle
│   └── static.go           # Embedded FS for frontend assets
├── internal/
│   ├── api/
│   │   ├── docs/           # Swagger output
│   │   ├── handler/        # HTTP handlers
│   │   ├── router/         # Route registration
│   │   └── service/        # Business logic
│   ├── di/                 # Wire providers + generated wiring
│   ├── migrations/         # SQL migration files
│   ├── model/              # DB models
│   └── repository/         # Data access layer
└── pkg/
    ├── aws/                # AWS wrappers
    ├── database/           # Base DB utilities
    ├── logging/            # Logger utilities
    ├── openai/             # OpenAI wrappers
    ├── server/             # Echo server, middleware, errors
    └── util/               # Shared helpers
```

---

## API Overview

Public endpoints:

- `POST /login`
- `POST /refresh-token`
- `GET /health`

Protected endpoints (base: `/api/v1`):

- Users: `/users`, `/users/:id`, `/users/me`, `/users/me/password`
- Countries: `/countries`, `/countries/:id`
- LLM tools:
  - `/llm/chat-to-article`
  - `/llm/ai-transcriber`
  - `/llm/ai-translator`
  - `/llm/email-generator`
  - `/llm/markdown-format`
  - `/llm/ocr`
  - `/llm/smart-chat-reply`
  - `/llm/text-summarizer`

---

## Getting Started

### Prerequisites

- Go `1.24+`
- Docker and Docker Compose
- `air` for hot reload
- `wire` for dependency injection generation
- `swag` for Swagger generation

### First Time Setup

```bash
make provision
make dev
```

App URL: `http://localhost:8080`

Swagger UI: `http://localhost:8080/docs/index.html`

### Default Credentials

```json
{
  "username": "superadmin",
  "password": "superadmin123!@#"
}
```

Yes, this password is dramatic. Use environment-specific credentials in real deployments.

---

## Development Commands

```bash
make dev                  # Run app with hot reload
make specs                # Generate swagger specs
make wire                 # Regenerate Wire DI
make test.cover           # Run tests and open coverage

make migrate              # Run pending migrations
make migrate.status       # Check migration status
make migrate.version      # Show migration version
make migrate.undo         # Undo last migration
make migrate.create name=add_feature
make migrate.reset        # Rollback all migrations
make migrate.redo         # Redo last migration

make build.linux          # Cross-compile for Linux
make build.windows        # Cross-compile for Windows
make build.arm            # Cross-compile for ARM
make remove               # Bring down server and remove Docker resources
make clean                # Clean built files

make docker.build         # Build Docker image
make docker.run           # Run container
make docker.logs          # Tail logs
make docker.stop          # Stop and remove container
make docker.export        # Export image to tar

# Frontend (run from project root)
make fe.install           # Install frontend dependencies
make fe.dev               # Start frontend dev server → http://localhost:5173
make fe.build             # Build frontend (embedded into binary)
make fe.build-local       # Build frontend with local API URL
make fe.build-prod        # Build frontend with production API URL
make fe.preview           # Preview production frontend build
```

---

## Architecture Notes

- Flow is `Service -> Handler -> Router`.
- Dependency graph is generated at compile-time using Wire.
- Frontend is embedded into the binary (`fontend/dist`) and served as SPA fallback.
- `/*` frontend route is registered last, so API routes are not shadowed.

---

## Configuration

Environment variable priority:

1. OS environment variables
2. `.env.local`
3. `.env`

### Server

| Variable | Default | Example | Description |
| --- | --- | --- | --- |
| `STAGE` | — | `development` | Runtime stage. Affects logging and behavior. Use `production` in prod. |
| `HOST` | — | `0.0.0.0` | Host address the server binds to. |
| `PORT` | — | `8080` | TCP port the HTTP server listens on. |
| `READ_TIMEOUT` | — | `10` | HTTP read timeout in seconds. |
| `WRITE_TIMEOUT` | — | `5` | HTTP write timeout in seconds. |
| `ALLOW_ORIGINS` | — | `https://example.com` | Comma-separated CORS allowed origins. Use `*` for development only. |
| `DEBUG` | `false` | `true` | Enable verbose debug logging. |
| `DB_LOG` | `false` | `true` | Enable GORM SQL query logging. |
| `APP_ID` | `vibetools` | `vibetools` | Application identifier used internally. |

### API Docs

| Variable | Default | Example | Description |
| --- | --- | --- | --- |
| `IS_ENABLE_API_DOCS` | `false` | `true` | Enable Swagger UI at `/docs/index.html`. Disable in production. |
| `API_DOCS_PATH` | — | `docs` | Path prefix for Swagger files. |

### LLM (AI features)

| Variable | Default | Example | Description |
| --- | --- | --- | --- |
| `LLM_PROVIDER` | `openai` | `openai` | Active LLM provider. `openai` uses the OpenAI-compatible API; `genai` uses Google GenAI / Vertex AI. |
| `LLM_TEXT_MODEL` | — | `gpt-4o` | Model name for text/chat completions. |
| `LLM_AUDIO_MODEL` | — | `whisper-1` | Model name for audio transcription. |
| `LLM_TIMEOUT` | `300` | `120` | Request timeout in seconds for LLM calls. |
| `LLM_MAX_RETRIES` | `0` | `2` | Number of automatic retries on transient LLM errors. |
| `LLM_MAX_INPUT_TOKENS` | `0` | `12000` | Maximum input tokens per request. `0` = unlimited. |
| `LLM_MAX_OUTPUT_TOKENS` | `0` | `4096` | Maximum output tokens per request. `0` = unlimited. |
| `LLM_LIMIT_TOKEN_USAGE` | `0` | `10000000` | Cumulative token budget across all requests. `0` = unlimited. |

### OpenAI Provider

| Variable | Default | Example | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | — | `sk-...` | OpenAI (or compatible) API key. Required when `LLM_PROVIDER=openai`. |
| `OPENAI_BASE_URL` | — | `https://api.openai.com/v1` | Base URL override. Use for Azure OpenAI, local proxies, or the Gemini OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/`). |

### Google GenAI Provider

| Variable | Default | Example | Description |
| --- | --- | --- | --- |
| `GENAI_API_KEY` | — | `AIza...` | Gemini Developer API key. Used when `GENAI_BACKEND=1` (Gemini API). |
| `GENAI_BACKEND` | `2` | `1` | Backend selector: `0` = auto-detect, `1` = Gemini Developer API, `2` = Vertex AI. |
| `GENAI_PROJECT` | — | `my-gcp-project` | GCP project ID. Required for Vertex AI (`GENAI_BACKEND=2`). |
| `GENAI_LOCATION` | — | `us-central1` | GCP region for Vertex AI. |
| `GENAI_CREDENTIALS_FILE` | — | `/secrets/sa.json` | Path to a GCP service account JSON key file. Omit to use Application Default Credentials. |

---

## Docker

Build and run:

```bash
make docker.build
make docker.run
```

Health endpoint:

```bash
GET /health
```

The container startup script runs migrations before serving traffic.

---

## License

MIT
