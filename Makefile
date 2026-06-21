.DEFAULT_GOAL := help

# HOST is only used for API specs generation
HOST ?= localhost:8080

# Frontend Docker configuration
FE_DOCKER_IMAGE_NAME = devtools
FE_DOCKER_TAG = latest
FE_DOCKER_CONTAINER_NAME = devtools-web
FE_DOCKER_PORT = 3000
FE_DOCKER_EXPORT_FILE = devtools-image.tar

# Generates a help message. Borrowed from https://github.com/pydanny/cookiecutter-djangopackage.
help: ## Display this help message
	@echo "Please use \`make <target>' where <target> is one of"
	@perl -nle'print $& if m{^[\.a-zA-Z_-]+:.*?## .*$$}' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-25s\033[0m %s\n", $$1, $$2}'

# ============================================================
# Backend (Go)
# ============================================================

depends: ## Install & build dependencies
	go get ./...
	go build ./...
	go mod tidy

provision: depends ## Provision dev environment
	docker-compose up -d
	scripts/waitdb.sh
	@$(MAKE) migrate

dev: ## Bring up the server on dev environment with hot reload
	air

remove: ## Bring down the server on dev environment, remove all docker related stuffs as well
	docker-compose down -v --remove-orphans

migrate: ## Run database migrations
	go run cmd/migration/main.go up

migrate.undo: ## Undo the last database migration
	go run cmd/migration/main.go down

migrate.status: ## Check migration status
	go run cmd/migration/main.go status

migrate.version: ## Show current migration version
	go run cmd/migration/main.go version

migrate.create: ## Create new migration file (usage: make migrate.create name=add_users_table)
	@if [ -z "$(name)" ]; then \
		echo "Error: name is required. Usage: make migrate.create name=add_users_table"; \
		exit 1; \
	fi
	go run cmd/migration/main.go create $(name) sql

migrate.reset: ## Rollback all migrations
	go run cmd/migration/main.go reset

migrate.redo: ## Redo the last migration
	go run cmd/migration/main.go redo

wire: ## Generate wire dependency injection code
	cd internal/di && GOFLAGS=-mod=mod wire

wire.check: ## Check if wire code is up to date
	cd internal/di && GOFLAGS=-mod=mod wire check

seed: ## Run database seeder
	echo "To be done!"

test: ## Run tests
	sh scripts/test.sh

test.cover: test ## Run tests and open coverage statistics page
	go tool cover -html=coverage-all.out

build: clean ## Build the server binary file on host machine
	sh scripts/build.sh

build.linux: ## Build the server binary file for Linux host
	@$(MAKE) GOOS=linux GOARCH=amd64 build

build.windows: ## Build the server binary file for Windows host
	@$(MAKE) GOOS=windows GOARCH=amd64 build

build.arm: clean ## Build the server binary file for ARM host
	GOOS=linux GOARCH=arm64 sh scripts/build-arm.sh

build.air: ## Build the server binary file for air hot reload
	sh scripts/build-air.sh

clean: ## Clean up the built & test files
	rm -rf ./server ./*.out

specs: ## Generate swagger specs
	swag fmt -g /cmd/api/main.go
	swag fmt -d ./internal/api
	swag init --parseInternal --parseDependency --parseDepth 1 -g /cmd/api/main.go -o ./internal/api/docs

# GHCR configuration — override via: make docker.push GHCR_USER=yourname
GHCR_USER   ?= kevinxvu
DOCKER_IMAGE ?= vibe-tools
DOCKER_TAG   ?= latest
GHCR_FULL_TAG = ghcr.io/$(GHCR_USER)/$(DOCKER_IMAGE):$(DOCKER_TAG)

docker.build: ## Build Docker image (backend)
	docker build -t $(GHCR_FULL_TAG) .

docker.push: ## Build and push image to GHCR (usage: make docker.push GHCR_USER=yourname)
	docker build -t $(GHCR_FULL_TAG) .
	docker push $(GHCR_FULL_TAG)
	@echo "✅ Pushed: $(GHCR_FULL_TAG)"

docker.buildx: ## Build multi-platform image and push to GHCR (amd64 + arm64)
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t $(GHCR_FULL_TAG) \
		--push .
	@echo "✅ Multi-platform image pushed: $(GHCR_FULL_TAG)"

docker.run: ## Run Docker container (requires running database)
	docker run -d \
		--name vibetools \
		-p 8080:8080 \
		$(GHCR_FULL_TAG)

docker.stop: ## Stop Docker container (backend)
	docker stop vibetools || true
	docker rm vibetools || true

docker.logs: ## View Docker container logs (backend)
	docker logs -f vibetools

docker.export: ## Export Docker image to tar file (backend)
	docker save $(GHCR_FULL_TAG) -o vibetools-latest.tar

# ============================================================
# Frontend (React / Vite) — targets prefixed with fe.
# ============================================================

fe.install: ## Install frontend dependencies
	@echo "📦 Installing frontend dependencies..."
	cd fontend && npm install
	@echo "✅ Installation complete!"

fe.dev: ## Run frontend dev server (http://localhost:5173)
	@echo "🚀 Starting frontend development server..."
	cd fontend && npm run dev

fe.build: ## Build frontend for production
	@echo "🏗️  Building frontend for production..."
	cd fontend && npm run build
	@echo "✅ Build complete! Output: fontend/dist/"

fe.preview: ## Preview frontend production build
	cd fontend && npm run preview

fe.clean: ## Clean frontend node_modules and dist
	@echo "🧹 Cleaning frontend..."
	rm -rf fontend/node_modules fontend/dist fontend/.vite fontend/package-lock.json
	@echo "✅ Cleanup complete!"

fe.reinstall: fe.clean fe.install ## Clean and reinstall frontend dependencies

fe.check: ## Check frontend TypeScript errors
	@echo "🔍 Checking frontend TypeScript errors..."
	cd fontend && npx tsc --noEmit

fe.audit: ## Check frontend security vulnerabilities
	@echo "🔒 Running frontend security audit..."
	cd fontend && npm audit

fe.docker-build: ## Build frontend Docker image
	docker build -t $(FE_DOCKER_IMAGE_NAME):$(FE_DOCKER_TAG) ./fontend

fe.docker-run: ## Run frontend Docker container
	docker run -d \
		--name $(FE_DOCKER_CONTAINER_NAME) \
		-p $(FE_DOCKER_PORT):80 \
		$(FE_DOCKER_IMAGE_NAME):$(FE_DOCKER_TAG)

fe.docker-stop: ## Stop frontend Docker container
	docker stop $(FE_DOCKER_CONTAINER_NAME) || true
	docker rm $(FE_DOCKER_CONTAINER_NAME) || true

fe.docker-logs: ## View frontend Docker container logs
	docker logs -f $(FE_DOCKER_CONTAINER_NAME)

fe.docker-export: ## Export frontend Docker image to tar file
	docker save $(FE_DOCKER_IMAGE_NAME):$(FE_DOCKER_TAG) -o $(FE_DOCKER_EXPORT_FILE)

fe.docker-import: ## Import frontend Docker image from tar file
	docker load -i $(FE_DOCKER_EXPORT_FILE)

fe.docker-clean: ## Remove frontend Docker image and container
	docker stop $(FE_DOCKER_CONTAINER_NAME) || true
	docker rm $(FE_DOCKER_CONTAINER_NAME) || true
	docker rmi $(FE_DOCKER_IMAGE_NAME):$(FE_DOCKER_TAG) || true

fe.docker-up: ## Docker compose up for frontend (detached)
	docker-compose up -d

fe.docker-down: ## Docker compose down for frontend
	docker-compose down

%: # prevent error for `up` target when passing arguments
ifeq ($(filter up,$(MAKECMDGOALS)),up)
	@:
else
	$(error No rule to make target `$@`.)
endif
