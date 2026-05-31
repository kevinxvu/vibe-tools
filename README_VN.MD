# VibeTools

Một bộ công cụ cho developer, dành cho những ngày bạn không muốn mở 17 tab chỉ để format JSON, decode JWT, rồi nhờ AI tóm tắt một bức tường chữ.

VibeTools gom backend Go, frontend SPA nhúng sẵn, và rất nhiều tool hữu ích vào một chỗ.

English version: [README.MD](README.MD)

---

## VibeTools Là Gì?

VibeTools là dự án full-stack tập trung vào hai việc:

- Xử lý các tác vụ dev hằng ngày nhanh gọn.
- Tận dụng AI theo hướng thực dụng, đỡ nói đạo lý, tăng năng suất.

Bạn có cả dev tools truyền thống lẫn AI tools trong cùng một ứng dụng, chạy trên kiến trúc Go sạch sẽ.

---

## Tính Năng

### AI Tools

- Chat to Article: Biến chat log thành bài viết kỹ thuật có cấu trúc.
- Text Summarizer: Tóm tắt nội dung dài theo nhiều phong cách.
- Email Generator: Soạn email với nhiều giọng điệu.
- Smart Chat Reply: Gợi ý trả lời từ hội thoại text hoặc ảnh chụp.
- AI Transcriber: Chuyển audio/video thành `text`, `json`, hoặc `srt`.
- AI Translator: Dịch có ngữ cảnh, kiểm soát chặt input/output.
- OCR Tool: Trích xuất chữ từ ảnh.
- Markdown Format: Dọn markdown lộn xộn thành bản dễ đọc.
- Markdown Parser: Chuyển đổi HTML, plain text, URL website và file (DOC, XLSX, PDF) thành Markdown sạch.

### Dev Tools

- HTTP Client: Gửi và kiểm tra request REST (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- JSON Formatter: Format đẹp, minify và xem cấu trúc JSON.
- JWT Tool: Decode và encode JWT (`HS256`).
- Markdown Viewer: Soạn thảo + preview, cuộn đồng bộ.
- HTML Viewer: Edit, preview, tree view, beautify.
- XML Formatter: Format, minify, tree view cho XML.
- String Hash: MD5, SHA, Keccak.
- Bcrypt Tool: Tạo và kiểm tra bcrypt hash.
- String Length Calculator: Thống kê ký tự/từ, đếm theo token.
- Multiline Converter: Làm sạch và chuyển đổi văn bản nhiều dòng.
- Text Case Converter: Upper, lower, camel, snake, slug, v.v.
- String Escaper: Escape/unescape cho HTML, XML, JS, JSON, CSV, SQL.
- Text Replacer: Thay thế theo template kiểu `{{var}}`.
- HTML Encoder: Encode/decode HTML entity.
- Base64 Converter: Encode/decode text và nội dung file.
- URL Converter: URL encode/decode.
- Password Generator: Tạo mật khẩu mạnh + gợi ý độ mạnh.
- UUID Generator: Tạo và phân tích UUID (`v4`, `v7`).
- Snowflake Generator: Tạo và phân tích Snowflake ID.
- Timestamp Converter: Chuyển đổi Unix timestamp và RFC3339.
- Log Analyzer: Xem và phân tích log JSON có cấu trúc (SQL, API) dạng bảng.

---

## Tech Stack

| Lớp | Công nghệ |
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
| Frontend Delivery | Embedded SPA bằng `//go:embed` |

---

## Cấu Trúc Dự Án

```text
.
├── cmd/
│   ├── api/                # Entry point API
│   └── migration/          # CLI migration
├── config/                 # Struct cấu hình runtime
├── fontend/
│   ├── dist/               # Bundle frontend đã build
│   └── static.go           # Embedded FS cho frontend assets
├── internal/
│   ├── api/
│   │   ├── docs/           # Kết quả Swagger
│   │   ├── handler/        # HTTP handlers
│   │   ├── router/         # Đăng ký routes
│   │   └── service/        # Business logic
│   ├── di/                 # Wire providers + generated wiring
│   ├── migrations/         # SQL migration files
│   ├── model/              # DB models
│   └── repository/         # Data access layer
└── pkg/
    ├── aws/                # AWS wrappers
    ├── database/           # DB utilities cơ bản
    ├── logging/            # Logger utilities
    ├── openai/             # OpenAI wrappers
    ├── server/             # Echo server, middleware, errors
    └── util/               # Shared helpers
```

---

## Tổng Quan API

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

## Bắt Đầu Nhanh

### Yêu Cầu Trước Khi Chạy

- Go `1.24+`
- Docker và Docker Compose
- `air` để hot reload
- `wire` để generate dependency injection
- `swag` để generate Swagger

### Thiết Lập Lần Đầu

```bash
make provision
make dev
```

App URL: `http://localhost:8080`

Swagger UI: `http://localhost:8080/docs/index.html`

### Tài Khoản Mặc Định

```json
{
  "username": "superadmin",
  "password": "superadmin123!@#"
}
```

Mật khẩu nhìn rất "quyết tâm", nhưng production thì nhớ đổi cho bình yên cuộc đời.

---

## Lệnh Phát Triển

```bash
make dev                  # Chạy app với hot reload
make specs                # Tạo swagger specs
make wire                 # Generate lại Wire DI
make test.cover           # Chạy test và mở coverage

make migrate              # Chạy migration còn pending
make migrate.status       # Xem trạng thái migration
make migrate.version      # Xem version migration hiện tại
make migrate.undo         # Undo migration gần nhất
make migrate.create name=add_feature
make migrate.reset        # Rollback toàn bộ migration
make migrate.redo         # Chạy lại migration gần nhất

make build.linux          # Build cho Linux
make build.windows        # Build cho Windows
make build.arm            # Build cho ARM
make remove               # Dừng server và xóa Docker resources
make clean                # Dọn file build

make docker.build         # Build Docker image
make docker.run           # Chạy container
make docker.logs          # Xem logs
make docker.stop          # Dừng và xóa container
make docker.export        # Export image ra tar

# Frontend (chạy từ thư mục gốc dự án)
make fe.install           # Cài dependencies frontend
make fe.dev               # Dev server frontend → http://localhost:5173
make fe.build             # Build frontend (nhúng vào binary)
make fe.build-local       # Build frontend với API URL local
make fe.build-prod        # Build frontend với API URL production
make fe.preview           # Preview bản build production frontend
```

---

## Ghi Chú Kiến Trúc

- Luồng chính: `Service -> Handler -> Router`.
- Dependency graph được generate ở compile-time bằng Wire.
- Frontend được nhúng vào binary từ `fontend/dist` và serve theo kiểu SPA fallback.
- Route `/*` của frontend được đăng ký sau cùng để không đè API routes.

---

## Cấu Hình

Thứ tự ưu tiên biến môi trường:

1. OS environment variables
2. `.env.local`
3. `.env`

### Server

| Biến | Mặc định | Ví dụ | Mô tả |
| --- | --- | --- | --- |
| `STAGE` | — | `development` | Môi trường chạy. Ảnh hưởng đến logging và hành vi ứng dụng. Dùng `production` khi deploy thật. |
| `HOST` | — | `0.0.0.0` | Địa chỉ host mà server lắng nghe. |
| `PORT` | — | `8080` | Cổng TCP của HTTP server. |
| `READ_TIMEOUT` | — | `10` | Timeout đọc HTTP, tính bằng giây. |
| `WRITE_TIMEOUT` | — | `5` | Timeout ghi HTTP, tính bằng giây. |
| `ALLOW_ORIGINS` | — | `https://example.com` | Danh sách origin cho phép CORS, phân cách bằng dấu phẩy. Chỉ dùng `*` trong môi trường phát triển. |
| `DEBUG` | `false` | `true` | Bật logging debug chi tiết. |
| `DB_LOG` | `false` | `true` | Bật logging câu lệnh SQL của GORM. |
| `APP_ID` | `vibetools` | `vibetools` | Định danh ứng dụng dùng nội bộ. |

### API Docs

| Biến | Mặc định | Ví dụ | Mô tả |
| --- | --- | --- | --- |
| `IS_ENABLE_API_DOCS` | `false` | `true` | Bật Swagger UI tại `/docs/index.html`. Nên tắt khi production. |
| `API_DOCS_PATH` | — | `docs` | Tiền tố đường dẫn cho các file Swagger. |

### LLM (Tính năng AI)

| Biến | Mặc định | Ví dụ | Mô tả |
| --- | --- | --- | --- |
| `LLM_PROVIDER` | `openai` | `openai` | Provider LLM đang dùng. `openai` dùng API tương thích OpenAI; `genai` dùng Google GenAI / Vertex AI. |
| `LLM_TEXT_MODEL` | — | `gpt-4o` | Tên model cho chat và sinh văn bản. |
| `LLM_AUDIO_MODEL` | — | `whisper-1` | Tên model cho nhận dạng giọng nói (transcription). |
| `LLM_TIMEOUT` | `300` | `120` | Timeout tính bằng giây cho mỗi request LLM. |
| `LLM_MAX_RETRIES` | `0` | `2` | Số lần tự động thử lại khi LLM trả lỗi tạm thời. |
| `LLM_MAX_INPUT_TOKENS` | `0` | `12000` | Giới hạn token đầu vào mỗi request. `0` = không giới hạn. |
| `LLM_MAX_OUTPUT_TOKENS` | `0` | `4096` | Giới hạn token đầu ra mỗi request. `0` = không giới hạn. |
| `LLM_LIMIT_TOKEN_USAGE` | `0` | `10000000` | Ngân sách token tích lũy cho tất cả request. `0` = không giới hạn. |

### OpenAI Provider

| Biến | Mặc định | Ví dụ | Mô tả |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | — | `sk-...` | API key của OpenAI hoặc dịch vụ tương thích. Bắt buộc khi `LLM_PROVIDER=openai`. |
| `OPENAI_BASE_URL` | — | `https://api.openai.com/v1` | Ghi đè base URL. Dùng cho Azure OpenAI, proxy nội bộ, hoặc endpoint tương thích Gemini (`https://generativelanguage.googleapis.com/v1beta/openai/`). |

### Google GenAI Provider

| Biến | Mặc định | Ví dụ | Mô tả |
| --- | --- | --- | --- |
| `GENAI_API_KEY` | — | `AIza...` | API key cho Gemini Developer API. Dùng khi `GENAI_BACKEND=1`. |
| `GENAI_BACKEND` | `2` | `1` | Chọn backend: `0` = tự phát hiện, `1` = Gemini Developer API, `2` = Vertex AI. |
| `GENAI_PROJECT` | — | `my-gcp-project` | Project ID trên GCP. Bắt buộc khi dùng Vertex AI (`GENAI_BACKEND=2`). |
| `GENAI_LOCATION` | — | `us-central1` | Region GCP cho Vertex AI. |
| `GENAI_CREDENTIALS_FILE` | — | `/secrets/sa.json` | Đường dẫn đến file JSON service account của GCP. Bỏ trống để dùng Application Default Credentials. |

---

## Docker

Build và chạy:

```bash
make docker.build
make docker.run
```

Health endpoint:

```bash
GET /health
```

Script khởi động container sẽ chạy migration trước khi mở traffic.

---

## License

MIT
