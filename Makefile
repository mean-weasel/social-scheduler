# Social Scheduler - Makefile
# Run `make help` to see available commands

.PHONY: help install dev run build test lint format clean deploy

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
	npm install

nuke: ## Remove node_modules and reinstall (clean install)
	rm -rf node_modules package-lock.json
	npm install

# =============================================================================
# Development
# =============================================================================

dev: ## Start development server (Vite only)
	npm run dev

proxy: ## Start CORS proxy for GitHub OAuth
	npm run dev:proxy

run: ## Start both dev server and CORS proxy
	npm run dev:all

# =============================================================================
# Build & Production
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

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

check: lint typecheck format-check ## Run all code quality checks

fix: lint-fix format ## Fix all auto-fixable issues

# =============================================================================
# Testing
# =============================================================================

test: ## Run tests in watch mode
	npm run test

test-run: ## Run tests once
	npm run test:run

test-coverage: ## Run tests with coverage report
	npm run test:coverage

# =============================================================================
# Utilities
# =============================================================================

clean: ## Clean build artifacts and cache
	npm run clean
	rm -rf dist coverage

publish: ## Run the post publishing script
	npm run publish-posts

# =============================================================================
# Deployment
# =============================================================================

deploy: build ## Build and deploy to GitHub Pages
	@echo "$(YELLOW)Deploying to GitHub Pages...$(RESET)"
	npx gh-pages -d dist
	@echo "$(GREEN)Deployed!$(RESET)"
