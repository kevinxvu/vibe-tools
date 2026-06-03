.PHONY: help install dev build build-prod build-local preview clean test check format docker-build docker-run docker-stop docker-logs docker-export docker-import docker-clean docker-up docker-down

# Docker configuration
DOCKER_IMAGE_NAME = vibetools
DOCKER_TAG = latest
DOCKER_CONTAINER_NAME = vibetools-web
DOCKER_PORT = 3000
DOCKER_EXPORT_FILE = vibetools-image.tar

# Default target
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  VibeTools - Makefile Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  make install       - Cài đặt dependencies"
	@echo "  make clean         - Xóa node_modules và cache"
	@echo ""
	@echo "🚀 Development:"
	@echo "  make dev           - Chạy dev server (http://localhost:5173)"
	@echo "  make build         - Build production (mặc định)"
	@echo "  make build-prod    - Build với PROD API URL (.env.production)"
	@echo "  make build-local   - Build với LOCAL API URL (.env.development)"
	@echo "  make preview       - Preview production build"
	@echo ""
	@echo "🔍 Code Quality:"
	@echo "  make check         - Kiểm tra TypeScript errors"
	@echo "  make audit         - Kiểm tra security vulnerabilities"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run Docker container"
	@echo "  make docker-stop   - Stop Docker container"
	@echo "  make docker-logs   - Xem logs của container"
	@echo "  make docker-export - Export image ra file .tar"
	@echo "  make docker-import - Import image từ file .tar"
	@echo "  make docker-clean  - Xóa image và container"
	@echo "  make docker-up     - Docker compose up (detached)"
	@echo "  make docker-down   - Docker compose down"
	@echo ""
	@echo "ℹ️  Node Version:"
	@echo "  make node-version  - Hiển thị Node & npm version"
	@echo ""

# Cài đặt dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Installation complete!"

# Chạy development server
dev:
	@echo "🚀 Starting development server..."
	@echo "📍 URL: http://localhost:5173"
	npm run dev

# Build production (default)
build:
	@echo "🏗️  Building for production..."
	npm run build
	@echo "✅ Build complete! Output: dist/"

# Build with production API URL
build-prod:
	@echo "🏗️  Building for production (PROD API)..."
	@echo "📡 API: $$(grep VITE_API_BASE_URL .env.production | cut -d= -f2)"
	npm run build:prod
	@echo "✅ Build complete! Output: dist/"

# Build with local API URL
build-local:
	@echo "🏗️  Building with local API URL..."
	@echo "📡 API: $$(grep VITE_API_BASE_URL .env.development | cut -d= -f2)"
	npm run build:local
	@echo "✅ Build complete! Output: dist/"

# Preview production build
preview:
	@echo "👀 Previewing production build..."
	npm run preview

# Xóa node_modules và cache
clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf dist
	rm -rf .vite
	rm -f package-lock.json
	@echo "✅ Cleanup complete!"

# Reinstall từ đầu
reinstall: clean install

# Kiểm tra TypeScript errors
check:
	@echo "🔍 Checking TypeScript errors..."
	npx tsc --noEmit

# Kiểm tra security vulnerabilities
audit:
	@echo "🔒 Running security audit..."
	npm audit

# Hiển thị phiên bản Node & npm
node-version:
	@echo "Node version:"
	@node --version
	@echo "npm version:"
	@npm --version

# Quick start (install + dev)
start: install dev

# Full setup (clean + install + dev)
setup: clean install
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start."
