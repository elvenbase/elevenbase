#!/bin/bash

echo "🚀 Setting up development environment for CA de Rissi Hub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
else
    echo "✅ Supabase CLI already installed"
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Setup Husky for Git hooks
echo "🔧 Setting up Git hooks with Husky..."
npm run prepare

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual values!"
else
    echo "✅ .env file already exists"
fi

# Setup Supabase local development
echo "🗄️  Setting up Supabase local development..."
if [ ! -d ".supabase" ]; then
    echo "📋 Initializing Supabase project..."
    supabase init
fi

# Check if Docker is running (required for Supabase)
if ! docker info &> /dev/null; then
    echo "⚠️  Docker is not running. Please start Docker to use Supabase locally."
    echo "   You can still develop the frontend without local Supabase."
else
    echo "✅ Docker is running"
fi

# Create useful aliases
echo "🔧 Creating useful aliases..."
cat >> ~/.bashrc << 'EOF'

# CA de Rissi Hub Development Aliases
alias dev="npm run dev"
alias dev:full="npm run dev:full"
alias build="npm run build"
alias build:dev="npm run build:dev"
alias build:prod="npm run build:prod"
alias test="npm run test"
alias test:ui="npm run test:ui"
alias lint="npm run lint"
alias lint:fix="npm run lint:fix"
alias format="npm run format"
alias supabase:start="npm run supabase:start"
alias supabase:stop="npm run supabase:stop"
alias supabase:status="npm run supabase:status"
alias db:reset="npm run supabase:reset"
alias db:push="npm run supabase:db:push"
alias db:diff="npm run supabase:db:diff"
alias commit="npm run commit"

EOF

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your actual values"
echo "2. Run 'npm run dev:full' to start development"
echo "3. Run 'npm run supabase:start' to start local Supabase"
echo "4. Run 'npm run test' to run tests"
echo "5. Run 'npm run commit' for standardized commits"
echo ""
echo "🔗 Useful commands:"
echo "  - npm run dev:full     # Start full dev environment"
echo "  - npm run supabase:start # Start local Supabase"
echo "  - npm run test:ui      # Run tests with UI"
echo "  - npm run commit       # Interactive commit"
echo "  - npm run db:push      # Push database changes"
echo ""
echo "🎉 Happy coding!"