<div align="center">

# VibeTools

**Hộp công cụ all-in-one cho developer. AI utilities và dev tools kinh điển, gói gọn trong một app tự host.**

[![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://go.dev)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)](https://www.docker.com)

[Bắt Đầu](#bắt-đầu) · [AI Tools](#ai-tools) · [Dev Tools](#dev-tools) · [Tự Host](#tự-host) · [Docs](docs/TECHNICAL.md)

</div>

---

VibeTools thay thế 17 tab trình duyệt bạn mở mỗi ngày — JSON formatter, JWT decoder, AI summarizer, HTTP client, v.v. — bằng một app duy nhất tự host. Không tài khoản, không telemetry, không cần internet sau khi cài xong.

> 🇬🇧 English readme: [README.MD](README.MD)

## Tính Năng Nổi Bật

- **29 tools** thuộc hai nhóm AI và developer
- **AI tools** hỗ trợ OpenAI, Google Gemini, và Vertex AI
- **Dev tools** chạy hoàn toàn trên trình duyệt — dữ liệu không rời máy bạn
- **Single binary** — Go backend với React SPA nhúng bên trong
- **Tự host trong vài phút** bằng Docker hoặc từ source
- **Giao diện đa ngôn ngữ** — Tiếng Anh và Tiếng Việt

---

## Bắt Đầu

### Docker

Cách nhanh nhất để chạy:

```sh
docker run -p 8080:8080 ghcr.io/kevinxvu/vibe-tools:latest
```

Mở **http://localhost:8080** và đăng nhập bằng tài khoản mặc định.

### Docker Compose

```sh
git clone <repo-url>
cd vibe-tools

# Sao chép và chỉnh sửa file môi trường
cp .env.example .env

docker compose up -d
```

### Từ Source

**Yêu cầu:** Go 1.24+, Docker, [`air`](https://github.com/air-verse/air), [`wire`](https://github.com/google/wire), [`swag`](https://github.com/swaggo/swag)

```sh
git clone <repo-url>
cd vibe-tools

make provision   # Khởi động database và chạy migration
make dev         # Chạy server với hot reload
```

**Tài khoản mặc định**

| Username | Password |
| --- | --- |
| `superadmin` | `superadmin123!@#` |

> **Lưu ý:** Đổi thông tin đăng nhập trước khi expose app ra mạng.

---

## AI Tools

AI tools gọi tới LLM provider bạn đã cấu hình. Xem [Cấu Hình AI](#cấu-hình-ai) để thiết lập.

| Tool | Mô tả |
| --- | --- |
| **Chat to Article** | Biến chat log hoặc thread Slack thành bài viết kỹ thuật có cấu trúc. |
| **Text Summarizer** | Tóm tắt nội dung dài theo nhiều phong cách — bullets, đoạn văn, TLDR, executive. |
| **Email Generator** | Soạn email chuyên nghiệp với nhiều giọng điệu từ một brief ngắn. |
| **Smart Chat Reply** | Gợi ý câu trả lời từ chuỗi hội thoại hoặc ảnh chụp màn hình. |
| **AI Transcriber** | Transcript audio hoặc video sang `text`, `json`, hoặc `srt`. |
| **AI Translator** | Dịch có nhận thức ngữ cảnh với ngôn ngữ nguồn/đích và giọng điệu tùy chỉnh. |
| **OCR Tool** | Trích xuất văn bản từ ảnh — screenshot, tài liệu scan, ảnh chụp bảng trắng. |
| **Markdown Format** | Dọn markdown lộn xộn thành phiên bản sạch và nhất quán. |
| **Markdown Parser** | Chuyển đổi HTML, plain text, URL, hoặc file (DOC, XLSX, PDF) sang Markdown sạch. |

---

## Dev Tools

Tất cả dev tools chạy cục bộ trên trình duyệt. Không có dữ liệu nào được gửi đến server.

| Tool | Mô tả |
| --- | --- |
| **HTTP Client** | Gửi REST request và kiểm tra response, headers, status codes. |
| **JSON Formatter** | Pretty-print, minify, validate và khám phá JSON dạng cây. |
| **JWT Tool** | Decode JWT để xem claims, hoặc encode token mới với secret và claims tùy chỉnh. |
| **Markdown Viewer** | Editor và preview cạnh nhau với cuộn đồng bộ. |
| **HTML Viewer** | Edit và preview HTML trực tiếp với tree view và beautify. |
| **XML Formatter** | Format, minify và khám phá XML dạng cây tương tác. |
| **String Hash** | Tính hash MD5, SHA-1, SHA-256, SHA-512 và Keccak. |
| **Bcrypt Tool** | Hash mật khẩu bằng bcrypt, hoặc xác minh mật khẩu với hash. |
| **String Length Calculator** | Đếm ký tự, từ, dòng và token. Hữu ích để kiểm tra kích thước LLM prompt. |
| **Multiline Converter** | Nối, quote, wrap hoặc biến đổi văn bản nhiều dòng chỉ với một click. |
| **Text Case Converter** | Chuyển đổi giữa camelCase, PascalCase, snake_case, kebab-case, slug và nhiều hơn. |
| **String Escaper** | Escape và unescape cho HTML, XML, JS, JSON, CSV và SQL. |
| **Text Replacer** | Thay thế text theo template với placeholder `{{biến}}`. |
| **HTML Encoder** | Encode và decode HTML entities. |
| **Base64 Converter** | Encode và decode Base64 — text hoặc nội dung file. |
| **URL Converter** | URL-encode và decode chuỗi và query parameters. |
| **Password Generator** | Tạo mật khẩu mạnh với bộ ký tự và độ dài tùy chỉnh. |
| **UUID Generator** | Tạo UUID `v4` và `v7`, kiểm tra các trường của UUID bất kỳ. |
| **Snowflake Generator** | Tạo Snowflake ID và giải mã timestamp cùng machine ID nhúng bên trong. |
| **Timestamp Converter** | Chuyển đổi giữa Unix, milliseconds và datetime RFC3339. |
| **Log Analyzer** | Xem và lọc structured JSON log (SQL, API) dạng bảng gọn gàng. |

---

## Tự Host

### `.env` Tối Thiểu

```env
STAGE=production
PORT=8080
JWT_SECRET=thay-bằng-chuỗi-ngẫu-nhiên-dài

DB_TYPE=mysql
DB_DSN=user:password@tcp(db-host:3306)/vibetools?charset=utf8mb4&parseTime=True&loc=Local
```

Xem toàn bộ tùy chọn cấu hình tại [Configuration Reference](docs/TECHNICAL.md#configuration-reference).

### Cấu Hình AI

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
<summary><strong>Azure OpenAI / Endpoint tương thích OpenAI</strong></summary>

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=<your-key>
OPENAI_BASE_URL=https://your-endpoint/openai/deployments/your-model
LLM_TEXT_MODEL=your-deployment-name
```

</details>

---

## Tài Liệu

| Tài liệu | Mô tả |
| --- | --- |
| [docs/TECHNICAL.md](docs/TECHNICAL.md) | Kiến trúc, API reference, hướng dẫn phát triển, triển khai |

---

## Đóng Góp

Mọi đóng góp đều được chào đón. Vui lòng mở issue để thảo luận trước khi gửi pull request.

1. Fork repository
2. Tạo feature branch: `git checkout -b feat/your-feature`
3. Commit thay đổi
4. Mở pull request

Xem [docs/TECHNICAL.md](docs/TECHNICAL.md) để biết chi tiết kiến trúc và cách thiết lập môi trường phát triển.

---

## License

[MIT](LICENSE)
