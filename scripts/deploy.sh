#!/bin/bash

# CA de Rissi Hub Deployment Script
# Usage: ./scripts/deploy.sh [staging|production] [--force]

set -e

ENVIRONMENT=${1:-staging}
FORCE=${2:-false}

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup-dev.sh first"
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first"
    exit 1
fi

# Function to check if there are uncommitted changes
check_git_status() {
    if [ "$FORCE" != "--force" ]; then
        if [ -n "$(git status --porcelain)" ]; then
            echo "⚠️  You have uncommitted changes. Please commit or stash them first."
            echo "   Or use --force to deploy anyway (not recommended)"
            exit 1
        fi
    fi
}

# Function to backup database
backup_database() {
    echo "💾 Creating database backup..."
    npm run db:backup
    echo "✅ Backup created successfully"
}

# Function to deploy to staging
deploy_staging() {
    echo "🔄 Deploying to staging..."
    
    # Build for development
    echo "📦 Building application (development mode)..."
    npm run build:dev
    
    # Push database changes
    echo "🗄️  Pushing database changes..."
    npm run supabase:db:push
    
    echo "✅ Staging deployment complete!"
}

# Function to deploy to production
deploy_production() {
    echo "🚀 Deploying to production..."
    
    # Confirm production deployment
    if [ "$FORCE" != "--force" ]; then
        read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "❌ Production deployment cancelled"
            exit 1
        fi
    fi
    
    # Build for production
    echo "📦 Building application (production mode)..."
    npm run build:prod
    
    # Push database changes
    echo "🗄️  Pushing database changes..."
    npm run supabase:db:push
    
    echo "✅ Production deployment complete!"
}

# Main deployment logic
case $ENVIRONMENT in
    "staging")
        check_git_status
        backup_database
        deploy_staging
        ;;
    "production")
        check_git_status
        backup_database
        deploy_production
        ;;
    *)
        echo "❌ Invalid environment. Use 'staging' or 'production'"
        echo "Usage: ./scripts/deploy.sh [staging|production] [--force]"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✅ Application built and deployed"
echo "2. ✅ Database migrations applied"
echo "3. ✅ Database backup created"
echo ""
echo "🔍 Verify deployment:"
echo "  - Check application functionality"
echo "  - Verify database schema changes"
echo "  - Test critical user flows"
echo ""
echo "📚 Useful commands:"
echo "  - npm run supabase:status    # Check Supabase status"
echo "  - npm run supabase:db:diff   # Check for pending changes"
echo "  - npm run test               # Run tests"
echo ""