<div align="center">

# VibeTools

**An all-in-one developer toolbox. AI-powered utilities and classic dev tools, in one self-hosted app.**

[![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://go.dev)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)](https://www.docker.com)

[Getting Started](#getting-started) · [AI Tools](#ai-tools) · [Dev Tools](#dev-tools) · [Self-Hosting](#self-hosting) · [Docs](docs/TECHNICAL.md)

</div>

---

VibeTools replaces the 17 browser tabs you open every day — JSON formatter, JWT decoder, AI summarizer, HTTP client, and more — with a single self-hosted app. No accounts, no telemetry, no internet required after setup.

> 🇻🇳 Vietnamese readme: [README_VN.MD](README_VN.MD)

## Features

- **29 tools** across AI and developer categories
- **AI tools** powered by OpenAI, Google Gemini, or Vertex AI
- **Dev tools** run entirely in the browser — no data leaves your machine
- **Single binary** — Go backend with the React SPA embedded inside
- **Self-hostable** in minutes via Docker or from source
- **Multilingual UI** — English and Vietnamese

---

## Getting Started

### Docker

The fastest way to get started:

```sh
docker run -p 8080:8080 ghcr.io/kevinxvu/vibe-tools:latest
```

Open **http://localhost:8080** and log in with the default credentials.

### Docker Compose

```sh
git clone <repo-url>
cd vibe-tools

# Copy and edit the environment file
cp .env.example .env

docker compose up -d
```

### From Source

**Prerequisites:** Go 1.24+, Docker, [`air`](https://github.com/air-verse/air), [`wire`](https://github.com/google/wire), [`swag`](https://github.com/swaggo/swag)

```sh
git clone <repo-url>
cd vibe-tools

make provision   # Start database container and run migrations
make dev         # Start the server with hot reload
```

**Default credentials**

| Username | Password |
| --- | --- |
| `superadmin` | `superadmin123!@#` |

> **Note:** Change these before exposing the app to any network.

---

## AI Tools

AI tools call your configured LLM provider. See [Configuring AI](#configuring-ai) to set one up.

| Tool | Description |
| --- | --- |
| **Chat to Article** | Turn a chat log or Slack thread into a structured technical article. |
| **Text Summarizer** | Summarize long content in multiple styles — bullets, paragraph, TLDR, executive. |
| **Email Generator** | Draft professional emails in different tones from a short brief. |
| **Smart Chat Reply** | Get reply suggestions from a conversation thread or a screenshot. |
| **AI Transcriber** | Transcribe audio or video files to `text`, `json`, or `srt`. |
| **AI Translator** | Context-aware translation with configurable source/target language and tone. |
| **OCR Tool** | Extract text from images — screenshots, scanned documents, whiteboard photos. |
| **Markdown Format** | Clean up messy or malformed markdown into a consistently formatted version. |
| **Markdown Parser** | Convert HTML, plain text, URLs, or files (DOC, XLSX, PDF) to clean Markdown. |

---

## Dev Tools

All dev tools run locally in the browser. No data is sent to any server.

| Tool | Description |
| --- | --- |
| **HTTP Client** | Send REST requests and inspect responses, headers, and status codes. |
| **JSON Formatter** | Pretty-print, minify, validate, and explore JSON as a tree. |
| **JWT Tool** | Decode a JWT to inspect its claims, or encode a new one with a custom secret. |
| **Markdown Viewer** | Live editor and preview with synchronized scrolling. |
| **HTML Viewer** | Edit and preview HTML with live rendering, tree view, and beautify. |
| **XML Formatter** | Format, minify, and explore XML as an interactive tree. |
| **String Hash** | Compute MD5, SHA-1, SHA-256, SHA-512, and Keccak hashes. |
| **Bcrypt Tool** | Hash a password with bcrypt, or verify a password against a hash. |
| **String Length Calculator** | Count characters, words, lines, and tokens. Useful for sizing LLM prompts. |
| **Multiline Converter** | Join, quote, bracket, or transform multi-line text in one click. |
| **Text Case Converter** | Convert between camelCase, PascalCase, snake_case, kebab-case, slug, and more. |
| **String Escaper** | Escape and unescape for HTML, XML, JS, JSON, CSV, and SQL. |
| **Text Replacer** | Template replacement with `{{variable}}` placeholders. |
| **HTML Encoder** | Encode and decode HTML entities. |
| **Base64 Converter** | Encode and decode Base64 — text or file content. |
| **URL Converter** | URL-encode and decode strings and query parameters. |
| **Password Generator** | Generate strong passwords with configurable character sets and length. |
| **UUID Generator** | Generate `v4` and `v7` UUIDs and inspect the fields of any UUID. |
| **Snowflake Generator** | Generate Snowflake IDs and decode the embedded timestamp and machine ID. |
| **Timestamp Converter** | Convert between Unix, milliseconds, and RFC3339 datetime formats. |
| **Log Analyzer** | View and filter structured JSON logs (SQL, API) in a clean table layout. |

---

## Self-Hosting

### Minimum `.env`

```env
STAGE=production
PORT=8080
JWT_SECRET=replace-with-a-long-random-secret

DB_TYPE=mysql
DB_DSN=user:password@tcp(db-host:3306)/vibetools?charset=utf8mb4&parseTime=True&loc=Local
```

For all available options, see the [Configuration Reference](docs/TECHNICAL.md#configuration-reference).

### Configuring AI

<details>
<summary><strong>OpenAI</strong></summary>

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_TEXT_MODEL=gpt-4o
LLM_AUDIO_MODEL=whisper-1
```

</details>

<details>
<summary><strong>Google Gemini (Developer API)</strong></summary>

```env
LLM_PROVIDER=genai
GENAI_API_KEY=AIza...
GENAI_BACKEND=1
LLM_TEXT_MODEL=gemini-2.0-flash
```

</details>

<details>
<summary><strong>Google Vertex AI</strong></summary>

```env
LLM_PROVIDER=genai
GENAI_BACKEND=2
GENAI_PROJECT=my-gcp-project
GENAI_LOCATION=us-central1
GENAI_CREDENTIALS_FILE=/path/to/service-account.json
LLM_TEXT_MODEL=gemini-2.0-flash
```

</details>

<details>
<summary><strong>Azure OpenAI / OpenAI-compatible endpoints</strong></summary>

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=<your-key>
OPENAI_BASE_URL=https://your-endpoint/openai/deployments/your-model
LLM_TEXT_MODEL=your-deployment-name
```

</details>

---

## Documentation

| Document | Description |
| --- | --- |
| [docs/TECHNICAL.md](docs/TECHNICAL.md) | Architecture, API reference, development guide, deployment |

---

## Contributing

Contributions are welcome. Please open an issue to discuss a change before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes
4. Open a pull request

See [docs/TECHNICAL.md](docs/TECHNICAL.md) for architecture details and development setup.

---

## License

[MIT](LICENSE)
