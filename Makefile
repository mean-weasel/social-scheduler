# Social Scheduler - Makefile
# Run `make help` to see available commands

.PHONY: help install dev serve build test test-e2e lint typecheck knip format check fix clean all

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Show this help message
	@echo "$(BLUE)Social Scheduler$(RESET) - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Setup
# =============================================================================

install: ## Install dependencies
	npm ci

nuke: ## Remove node_modules and reinstall (clean install)
	rm -rf node_modules package-lock.json
	npm install

# =============================================================================
# Development & Serving
# =============================================================================

dev: ## Start development server (localhost:5173)
	npm run dev

serve: build ## Build and serve on home network (accessible from other devices)
	@echo ""
	@echo "$(GREEN)Starting server on home network...$(RESET)"
	@echo "$(YELLOW)Access from other devices at: http://$$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}'):4173$(RESET)"
	@echo ""
	npm run preview -- --host

dev-network: ## Start dev server accessible on home network
	@echo ""
	@echo "$(GREEN)Starting dev server on home network...$(RESET)"
	@echo "$(YELLOW)Access from other devices at: http://$$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}'):5173$(RESET)"
	@echo ""
	npm run dev -- --host

# =============================================================================
# Build
# =============================================================================

build: ## Build for production
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
	npm run test:run

test-e2e: ## Run end-to-end tests
	npm run test:e2e

test-e2e-ui: ## Run E2E tests with UI
	npm run test:e2e:ui

test-coverage: ## Run tests with coverage report
	npm run test:coverage

test-all: test-run test-e2e ## Run all tests (unit + e2e)

# =============================================================================
# Utilities
# =============================================================================

clean: ## Clean build artifacts and cache
	npm run clean
	rm -rf dist coverage playwright-report test-results
	@echo "$(GREEN)✓ Cleaned build artifacts$(RESET)"

# =============================================================================
# Full Workflows
# =============================================================================

all: install check build ## Install, run checks, and build
	@echo ""
	@echo "$(GREEN)✓ Ready! Run 'make serve' to start on home network$(RESET)"

ci: check test-run test-e2e ## Run full CI pipeline locally
	@echo ""
	@echo "$(GREEN)✓ CI pipeline passed!$(RESET)"
