#!/bin/bash

# CA de Rissi Hub Database Management Script
# Usage: ./scripts/db-manage.sh [command] [options]

set -e

COMMAND=${1:-help}

echo "🗄️  CA de Rissi Hub Database Management"

# Function to show help
show_help() {
    echo "Usage: ./scripts/db-manage.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  status      - Show Supabase status"
    echo "  start       - Start local Supabase"
    echo "  stop        - Stop local Supabase"
    echo "  reset       - Reset local database"
    echo "  seed        - Seed database with sample data"
    echo "  backup      - Create database backup"
    echo "  restore     - Restore database from backup"
    echo "  diff        - Show database differences"
    echo "  push        - Push local changes to remote"
    echo "  pull        - Pull remote changes to local"
    echo "  migrate     - Apply pending migrations"
    echo "  new-migration - Create new migration"
    echo "  functions   - Serve Edge Functions locally"
    echo "  studio      - Open Supabase Studio"
    echo "  logs        - Show Supabase logs"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/db-manage.sh start"
    echo "  ./scripts/db-manage.sh reset"
    echo "  ./scripts/db-manage.sh new-migration add_user_table"
    echo "  ./scripts/db-manage.sh backup"
}

# Function to check Supabase CLI
check_supabase() {
    if ! command -v supabase &> /dev/null; then
        echo "❌ Supabase CLI not found. Please install it first:"
        echo "   npm install -g supabase"
        exit 1
    fi
}

# Function to check Docker
check_docker() {
    if ! docker info &> /dev/null; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to start Supabase
start_supabase() {
    echo "🚀 Starting Supabase local development..."
    check_supabase
    check_docker
    npm run supabase:start
    echo "✅ Supabase started successfully!"
    echo "   Studio: http://localhost:54323"
    echo "   API: http://localhost:54321"
    echo "   Database: postgresql://postgres:postgres@localhost:54322/postgres"
}

# Function to stop Supabase
stop_supabase() {
    echo "🛑 Stopping Supabase..."
    check_supabase
    npm run supabase:stop
    echo "✅ Supabase stopped successfully!"
}

# Function to show status
show_status() {
    echo "📊 Supabase Status:"
    check_supabase
    npm run supabase:status
}

# Function to reset database
reset_database() {
    echo "🔄 Resetting local database..."
    check_supabase
    check_docker
    
    read -p "This will delete all local data. Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Database reset cancelled"
        exit 1
    fi
    
    npm run supabase:reset
    echo "✅ Database reset successfully!"
}

# Function to seed database
seed_database() {
    echo "🌱 Seeding database with sample data..."
    check_supabase
    npm run db:seed
    echo "✅ Database seeded successfully!"
}

# Function to create backup
create_backup() {
    echo "💾 Creating database backup..."
    check_supabase
    npm run db:backup
    echo "✅ Backup created successfully!"
}

# Function to restore backup
restore_backup() {
    BACKUP_FILE=${2:-}
    if [ -z "$BACKUP_FILE" ]; then
        echo "❌ Please specify backup file: ./scripts/db-manage.sh restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    echo "🔄 Restoring database from backup: $BACKUP_FILE"
    check_supabase
    check_docker
    
    read -p "This will overwrite current data. Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Database restore cancelled"
        exit 1
    fi
    
    # Stop Supabase first
    npm run supabase:stop
    
    # Start and restore
    npm run supabase:start
    sleep 5
    
    # Restore from backup
    supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres
    psql postgresql://postgres:postgres@localhost:54322/postgres < "$BACKUP_FILE"
    
    echo "✅ Database restored successfully!"
}

# Function to show database diff
show_diff() {
    echo "🔍 Showing database differences..."
    check_supabase
    npm run supabase:db:diff
}

# Function to push changes
push_changes() {
    echo "📤 Pushing local changes to remote..."
    check_supabase
    npm run supabase:db:push
    echo "✅ Changes pushed successfully!"
}

# Function to pull changes
pull_changes() {
    echo "📥 Pulling remote changes to local..."
    check_supabase
    supabase db pull
    echo "✅ Changes pulled successfully!"
}

# Function to apply migrations
apply_migrations() {
    echo "🔄 Applying pending migrations..."
    check_supabase
    npm run supabase:db:migrate
    echo "✅ Migrations applied successfully!"
}

# Function to create new migration
create_migration() {
    MIGRATION_NAME=${2:-}
    if [ -z "$MIGRATION_NAME" ]; then
        echo "❌ Please specify migration name: ./scripts/db-manage.sh new-migration <name>"
        exit 1
    fi
    
    echo "📝 Creating new migration: $MIGRATION_NAME"
    check_supabase
    npm run supabase:db:new-migration "$MIGRATION_NAME"
    echo "✅ Migration created successfully!"
}

# Function to serve functions
serve_functions() {
    echo "⚡ Serving Edge Functions locally..."
    check_supabase
    npm run supabase:functions:serve
}

# Function to open studio
open_studio() {
    echo "🎨 Opening Supabase Studio..."
    check_supabase
    check_docker
    
    # Check if Supabase is running
    if ! supabase status | grep -q "Running"; then
        echo "⚠️  Supabase is not running. Starting it first..."
        start_supabase
    fi
    
    echo "🌐 Opening Studio at http://localhost:54323"
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:54323
    elif command -v open &> /dev/null; then
        open http://localhost:54323
    else
        echo "Please open http://localhost:54323 in your browser"
    fi
}

# Function to show logs
show_logs() {
    echo "📋 Showing Supabase logs..."
    check_supabase
    supabase logs
}

# Main command logic
case $COMMAND in
    "start")
        start_supabase
        ;;
    "stop")
        stop_supabase
        ;;
    "status")
        show_status
        ;;
    "reset")
        reset_database
        ;;
    "seed")
        seed_database
        ;;
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup "$@"
        ;;
    "diff")
        show_diff
        ;;
    "push")
        push_changes
        ;;
    "pull")
        pull_changes
        ;;
    "migrate")
        apply_migrations
        ;;
    "new-migration")
        create_migration "$@"
        ;;
    "functions")
        serve_functions
        ;;
    "studio")
        open_studio
        ;;
    "logs")
        show_logs
        ;;
    "help"|*)
        show_help
        ;;
esac