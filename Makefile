# CA de Rissi Hub Development Makefile
# Usage: make [target]

.PHONY: help install dev build test lint format clean supabase-start supabase-stop deploy-staging deploy-prod

# Default target
help:
	@echo "🚀 CA de Rissi Hub Development Commands"
	@echo ""
	@echo "📦 Development:"
	@echo "  make install          Install dependencies"
	@echo "  make dev             Start development server"
	@echo "  make dev:full        Start full dev environment (frontend + Supabase)"
	@echo "  make build           Build for production"
	@echo "  make build:dev       Build for development"
	@echo ""
	@echo "🧪 Testing & Quality:"
	@echo "  make test            Run tests"
	@echo "  make test:ui         Run tests with UI"
	@echo "  make test:coverage   Run tests with coverage"
	@echo "  make lint            Run ESLint"
	@echo "  make lint:fix        Fix ESLint issues"
	@echo "  make format          Format code with Prettier"
	@echo "  make type-check      Run TypeScript type checking"
	@echo ""
	@echo "🗄️  Database & Supabase:"
	@echo "  make supabase-start  Start local Supabase"
	@echo "  make supabase-stop   Stop local Supabase"
	@echo "  make supabase-status Show Supabase status"
	@echo "  make db:reset        Reset local database"
	@echo "  make db:push         Push database changes"
	@echo "  make db:diff         Show database differences"
	@echo "  make db:backup       Create database backup"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy-staging  Deploy to staging"
	@echo "  make deploy-prod     Deploy to production"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  make clean           Clean build artifacts"
	@echo "  make clean:all       Clean everything (including node_modules)"
	@echo "  make install:clean   Clean install dependencies"
	@echo ""
	@echo "📝 Git & Commits:"
	@echo "  make commit          Interactive commit with commitizen"
	@echo "  make check:all       Run all checks (lint + type-check + format)"

# Development
install:
	@echo "📦 Installing dependencies..."
	npm install

dev:
	@echo "🚀 Starting development server..."
	npm run dev

dev:full:
	@echo "🚀 Starting full development environment..."
	npm run dev:full

build:
	@echo "📦 Building for production..."
	npm run build

build:dev:
	@echo "📦 Building for development..."
	npm run build:dev

# Testing & Quality
test:
	@echo "🧪 Running tests..."
	npm run test

test:ui:
	@echo "🧪 Running tests with UI..."
	npm run test:ui

test:coverage:
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage

lint:
	@echo "🔍 Running ESLint..."
	npm run lint

lint:fix:
	@echo "🔧 Fixing ESLint issues..."
	npm run lint:fix

format:
	@echo "✨ Formatting code..."
	npm run format

type-check:
	@echo "🔍 Running TypeScript type checking..."
	npm run type-check

# Supabase & Database
supabase-start:
	@echo "🗄️  Starting Supabase..."
	npm run supabase:start

supabase-stop:
	@echo "🛑 Stopping Supabase..."
	npm run supabase:stop

supabase-status:
	@echo "📊 Supabase status..."
	npm run supabase:status

db:reset:
	@echo "🔄 Resetting database..."
	npm run supabase:reset

db:push:
	@echo "📤 Pushing database changes..."
	npm run supabase:db:push

db:diff:
	@echo "🔍 Showing database differences..."
	npm run supabase:db:diff

db:backup:
	@echo "💾 Creating database backup..."
	npm run db:backup

# Deployment
deploy-staging:
	@echo "🔄 Deploying to staging..."
	./scripts/deploy.sh staging

deploy-prod:
	@echo "🚀 Deploying to production..."
	./scripts/deploy.sh production

# Maintenance
clean:
	@echo "🧹 Cleaning build artifacts..."
	npm run clean

clean:all:
	@echo "🧹 Cleaning everything..."
	npm run clean:all

install:clean:
	@echo "🧹 Clean installing dependencies..."
	npm run install:clean

# Git & Commits
commit:
	@echo "📝 Interactive commit..."
	npm run commit

check:all:
	@echo "🔍 Running all checks..."
	npm run check:all

# Setup
setup:
	@echo "🚀 Setting up development environment..."
	chmod +x scripts/*.sh
	./scripts/setup-dev.sh

# Quick start for new developers
quickstart: setup install
	@echo "🎉 Quick start complete!"
	@echo "Run 'make dev:full' to start development"