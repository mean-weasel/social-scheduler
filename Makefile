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
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Setup
# =============================================================================

install: ## Install all dependencies (web + API + Playwright)
	@echo "$(BLUE)Installing web app dependencies...$(RESET)"
	npm ci
	@echo "$(BLUE)Installing API server dependencies...$(RESET)"
	cd api-server && npm ci
	@echo "$(BLUE)Installing Playwright browsers...$(RESET)"
	npx playwright install chromium
	@echo ""
	@echo "$(GREEN)✓ All dependencies installed! Run 'make dev' to start.$(RESET)"

install-web: ## Install web dependencies only
	npm ci

install-api: ## Install API server dependencies only
	cd api-server && npm ci

nuke: ## Remove all node_modules and reinstall
	rm -rf node_modules package-lock.json
	rm -rf api-server/node_modules api-server/package-lock.json
	npm install
	cd api-server && npm install

# =============================================================================
# Development & Serving
# =============================================================================

dev: ## Start both API + web servers (recommended)
	@echo ""
	@echo "$(GREEN)Starting API server (port 3001) and Web app (port 5173)...$(RESET)"
	@echo "$(YELLOW)Web:  http://localhost:5173$(RESET)"
	@echo "$(YELLOW)API:  http://localhost:3001$(RESET)"
	@echo ""
	npm run dev:full

dev-api: ## Start API server only (port 3001)
	@echo "$(GREEN)Starting API server on http://localhost:3001...$(RESET)"
	npm run api

dev-web: ## Start web dev server only (port 5173)
	@echo "$(GREEN)Starting web server on http://localhost:5173...$(RESET)"
	npm run dev

serve: build ## Build and serve on home network (accessible from iPhone)
	@echo ""
	@echo "$(GREEN)Starting production servers on home network...$(RESET)"
	@echo "$(YELLOW)Web:  http://$(LOCAL_IP):4173$(RESET)"
	@echo "$(YELLOW)API:  http://$(LOCAL_IP):3001$(RESET)"
	@echo ""
	npm run api:start & npm run preview -- --host

dev-network: ## Start dev servers accessible on home network
	@echo ""
	@echo "$(GREEN)Starting dev servers on home network...$(RESET)"
	@echo "$(YELLOW)Web:  http://$(LOCAL_IP):5173$(RESET)"
	@echo "$(YELLOW)API:  http://$(LOCAL_IP):3001$(RESET)"
	@echo ""
	npm run api & npm run dev -- --host

# =============================================================================
# Build
# =============================================================================

build: build-api build-web ## Build both API and web for production
	@echo ""
	@echo "$(GREEN)✓ Build complete!$(RESET)"

build-api: ## Build API server only
	@echo "$(BLUE)Building API server...$(RESET)"
	npm run api:build

build-web: ## Build web app only
	@echo "$(BLUE)Building web app...$(RESET)"
	npm run build

preview: ## Preview production build locally
	npm run preview

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

check: lint typecheck knip ## Run all code quality checks (lint, typecheck, knip)
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

test-e2e: build-api ## Run end-to-end tests (builds API first)
	npm run test:e2e

test-e2e-ui: build-api ## Run E2E tests with UI
	npm run test:e2e:ui

test-e2e-debug: build-api ## Run E2E tests in debug mode
	npm run test:e2e:debug

test-coverage: ## Run tests with coverage report
	npx vitest run --coverage --passWithNoTests

test-all: test-run test-e2e ## Run all tests (unit + e2e)

# =============================================================================
# Utilities
# =============================================================================

clean: ## Clean build artifacts and cache
	npm run clean
	rm -rf dist coverage playwright-report test-results
	rm -rf api-server/dist
	@echo "$(GREEN)✓ Cleaned build artifacts$(RESET)"

logs: ## Show API server logs location
	@echo "Database: ~/.social-scheduler/posts.db"
	@echo "API logs: (in terminal running 'make dev')"

ip: ## Show local network IP for iPhone access
	@echo "$(GREEN)Your local IP: $(LOCAL_IP)$(RESET)"
	@echo ""
	@echo "iPhone access URLs (after running 'make serve'):"
	@echo "  Web: http://$(LOCAL_IP):4173"
	@echo "  API: http://$(LOCAL_IP):3001"

# =============================================================================
# Full Workflows
# =============================================================================

all: install check build ## Install, run checks, and build
	@echo ""
	@echo "$(GREEN)✓ Ready! Run 'make dev' to start development.$(RESET)"
	@echo "$(GREEN)         Run 'make serve' to start on home network.$(RESET)"

ci: check test-run test-e2e ## Run full CI pipeline locally
	@echo ""
	@echo "$(GREEN)✓ CI pipeline passed!$(RESET)"

# Quick aliases
.PHONY: start stop
start: dev ## Alias for 'make dev'
