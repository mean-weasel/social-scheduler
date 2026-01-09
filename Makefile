# Social Scheduler - Makefile
# Run `make help` to see available commands

.PHONY: help install dev dev-api dev-web dev-full serve build build-api build-web test test-e2e lint typecheck knip format check fix clean all

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Get local IP for network access
LOCAL_IP = $(shell /sbin/ifconfig en0 2>/dev/null | grep "inet " | awk '{print $$2}' || /sbin/ifconfig en1 2>/dev/null | grep "inet " | awk '{print $$2}' || hostname -I 2>/dev/null | awk '{print $$1}' || echo "localhost")

help: ## Show this help message
	@echo "$(BLUE)Social Scheduler$(RESET) - Available commands:"
	@echo ""
	@echo "$(YELLOW)Development (Next.js + Supabase)$(RESET)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(dev|supabase|db-)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Build & Deploy$(RESET)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(build|deploy|preview)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Testing$(RESET)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E 'test' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Code Quality$(RESET)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(lint|type|format|check|knip)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Utilities$(RESET)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '(clean|install|setup|mcp|ip|logs)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Setup
# =============================================================================

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	npm ci
	@echo "$(BLUE)Installing MCP server dependencies...$(RESET)"
	cd mcp-server && npm ci
	@echo "$(BLUE)Installing Playwright browsers...$(RESET)"
	npx playwright install chromium
	@echo ""
	@echo "$(GREEN)✓ Dependencies installed! Run 'make setup' for first-time setup.$(RESET)"

setup: install ## First-time setup (install deps + start Supabase + reset DB)
	@echo "$(BLUE)Starting local Supabase...$(RESET)"
	supabase start
	@echo "$(BLUE)Resetting database with migrations...$(RESET)"
	supabase db reset
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(RESET)"
	@echo "$(YELLOW)Run 'make dev' to start developing.$(RESET)"

nuke: ## Remove all node_modules and reinstall
	rm -rf node_modules package-lock.json
	rm -rf api-server/node_modules api-server/package-lock.json
	rm -rf mcp-server/node_modules mcp-server/package-lock.json
	npm install
	cd mcp-server && npm install

# =============================================================================
# Development (Next.js + Supabase)
# =============================================================================

# Default ports (override with PORT=xxxx make dev)
NEXT_PORT ?= 3000

dev: ## Start Next.js dev server (requires Supabase running)
	@echo ""
	@echo "$(GREEN)Starting Next.js dev server...$(RESET)"
	@echo "$(YELLOW)Requested port: $${PORT:-$(NEXT_PORT)} (will auto-increment if busy)$(RESET)"
	@echo "$(YELLOW)Supabase Studio: http://localhost:54323$(RESET)"
	@echo ""
	@PORT=$${PORT:-$(NEXT_PORT)} npm run dev:next

dev-full: ## Start Supabase + Next.js together
	@echo ""
	@echo "$(GREEN)Starting Supabase and Next.js...$(RESET)"
	@make -j2 supabase-start dev-next-only 2>/dev/null || (make supabase-start && make dev-next-only)

dev-next-only:
	@sleep 3
	@PORT=$${PORT:-$(NEXT_PORT)} npm run dev:next

# Legacy dev commands (for transition period)
dev-legacy: ## Start legacy API + Vite servers
	@echo "$(YELLOW)Starting legacy servers (API + Vite)...$(RESET)"
	CI=true PORT=$${PORT:-5173} API_PORT=$${API_PORT:-3001} npm run dev:full

dev-api-legacy: ## Start legacy API server only
	@echo "$(GREEN)Starting legacy API server on http://localhost:$${API_PORT:-3001}...$(RESET)"
	CI=true API_PORT=$${API_PORT:-3001} npm run api

dev-web-legacy: ## Start legacy Vite web server only
	@echo "$(GREEN)Starting legacy Vite server on http://localhost:$${PORT:-5173}...$(RESET)"
	CI=true PORT=$${PORT:-5173} npm run dev

# =============================================================================
# Supabase
# =============================================================================

supabase-start: ## Start local Supabase
	@echo "$(BLUE)Starting local Supabase...$(RESET)"
	@supabase start || echo "$(YELLOW)Supabase may already be running$(RESET)"

supabase-stop: ## Stop local Supabase
	@echo "$(BLUE)Stopping local Supabase...$(RESET)"
	supabase stop

supabase-status: ## Check local Supabase status
	supabase status

supabase-studio: ## Open Supabase Studio in browser
	@echo "$(GREEN)Opening Supabase Studio...$(RESET)"
	open http://localhost:54323

supabase-link-dev: ## Link to dev Supabase project
	@echo "$(BLUE)Link to your dev Supabase project:$(RESET)"
	@echo "Get your project ref from: https://supabase.com/dashboard"
	@read -p "Enter project ref: " ref && supabase link --project-ref $$ref

supabase-link-prod: ## Link to prod Supabase project
	@echo "$(BLUE)Link to your prod Supabase project:$(RESET)"
	@echo "Get your project ref from: https://supabase.com/dashboard"
	@read -p "Enter project ref: " ref && supabase link --project-ref $$ref

# =============================================================================
# Database
# =============================================================================

db-reset: ## Reset local database (runs all migrations)
	@echo "$(BLUE)Resetting local database...$(RESET)"
	supabase db reset

db-migrate: ## Run pending migrations locally
	supabase migration up

db-new: ## Create new migration (usage: make db-new name=create_users)
	@if [ -z "$(name)" ]; then \
		echo "$(RED)Error: Specify migration name with 'make db-new name=your_migration_name'$(RESET)"; \
		exit 1; \
	fi
	supabase migration new $(name)

db-push: ## Push migrations to remote Supabase (dev)
	@echo "$(BLUE)Pushing migrations to remote...$(RESET)"
	supabase db push

db-pull: ## Pull remote schema changes
	supabase db pull

db-diff: ## Show diff between local and remote
	supabase db diff

db-seed: ## Seed local database with test data
	@if [ -f supabase/seed.sql ]; then \
		psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql; \
		echo "$(GREEN)✓ Database seeded$(RESET)"; \
	else \
		echo "$(YELLOW)No seed file found at supabase/seed.sql$(RESET)"; \
	fi

# =============================================================================
# Build & Deploy
# =============================================================================

build: ## Build Next.js for production
	@echo "$(BLUE)Building Next.js app...$(RESET)"
	npm run build:next

build-legacy: ## Build legacy API + Vite
	@echo "$(BLUE)Building legacy API server...$(RESET)"
	npm run api:build
	@echo "$(BLUE)Building legacy Vite app...$(RESET)"
	npm run build

preview: build ## Preview production build locally
	npm run start:next

deploy: ## Deploy to Vercel (production)
	@echo "$(BLUE)Deploying to Vercel (production)...$(RESET)"
	vercel --prod

deploy-preview: ## Deploy preview to Vercel
	@echo "$(BLUE)Deploying preview to Vercel...$(RESET)"
	vercel

# =============================================================================
# Code Quality
# =============================================================================

lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

typecheck: ## Run TypeScript type checking
	npm run typecheck

knip: ## Check for dead code and unused dependencies
	npm run knip

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

check: lint typecheck ## Run all code quality checks
	@echo ""
	@echo "$(GREEN)✓ All checks passed!$(RESET)"

fix: lint-fix format ## Fix all auto-fixable issues

# =============================================================================
# Testing
# =============================================================================

test: ## Run unit tests in watch mode
	npm run test

test-run: ## Run unit tests once
	npx vitest run --passWithNoTests

test-e2e: ## Run end-to-end tests
	npm run test:e2e

test-e2e-ui: ## Run E2E tests with UI
	npm run test:e2e:ui

test-e2e-debug: ## Run E2E tests in debug mode
	npm run test:e2e:debug

test-coverage: ## Run tests with coverage report
	npx vitest run --coverage --passWithNoTests

test-all: test-run test-e2e ## Run all tests (unit + e2e)

# =============================================================================
# MCP Server
# =============================================================================

mcp-dev: ## Run MCP server with local Supabase
	@echo "$(GREEN)Starting MCP server (local Supabase)...$(RESET)"
	cd mcp-server && \
		SUPABASE_URL=http://127.0.0.1:54321 \
		SUPABASE_SERVICE_ROLE_KEY=$$(supabase status --output json 2>/dev/null | grep -o '"service_role_key":"[^"]*"' | cut -d'"' -f4) \
		npm run dev

mcp-build: ## Build MCP server
	cd mcp-server && npm run build

mcp-legacy: ## Run MCP server with legacy API
	@echo "$(GREEN)Starting MCP server (legacy API)...$(RESET)"
	cd mcp-server && API_URL=http://localhost:3001/api npm run dev

# =============================================================================
# Utilities
# =============================================================================

clean: ## Clean build artifacts and cache
	rm -rf .next dist coverage playwright-report test-results
	rm -rf api-server/dist
	@echo "$(GREEN)✓ Cleaned build artifacts$(RESET)"

logs: ## Show data locations
	@echo "$(BLUE)Data Locations:$(RESET)"
	@echo "  Local Supabase DB: postgresql://postgres:postgres@localhost:54322/postgres"
	@echo "  Supabase Studio:   http://localhost:54323"
	@echo "  Legacy SQLite:     ~/.social-scheduler/posts.db"

ip: ## Show local network IP for mobile access
	@echo "$(GREEN)Your local IP: $(LOCAL_IP)$(RESET)"
	@echo ""
	@echo "Mobile access URLs (after running 'make dev'):"
	@echo "  App: http://$(LOCAL_IP):$${PORT:-$(NEXT_PORT)}"
	@echo ""
	@echo "$(YELLOW)Note: Check terminal for actual port if default is busy$(RESET)"

# =============================================================================
# Full Workflows
# =============================================================================

all: install check build ## Install, run checks, and build
	@echo ""
	@echo "$(GREEN)✓ Ready! Run 'make dev' to start development.$(RESET)"

ci: check test-run ## Run CI checks locally
	@echo ""
	@echo "$(GREEN)✓ CI checks passed!$(RESET)"

# Quick aliases
.PHONY: start stop studio
start: dev ## Alias for 'make dev'
stop: supabase-stop ## Alias for 'make supabase-stop'
studio: supabase-studio ## Alias for 'make supabase-studio'
