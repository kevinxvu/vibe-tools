# Stage 1: Go build
FROM golang:1.24-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/root/go/pkg/mod go mod download
COPY . .

RUN --mount=type=cache,target=/root/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -ldflags="-w -s" -o /app/server ./cmd/api

# Stage 2: Runtime
FROM alpine:3.23
RUN apk --no-cache add ca-certificates tzdata wget
WORKDIR /app
COPY --from=builder /app/server /app/server
COPY --from=builder /app/scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["/app/server"]
