#!/bin/bash

# ElevenBase - Workflow di Sviluppo Locale
# Script per automatizzare le operazioni comuni di sviluppo

set -e  # Exit on any error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per loggare messaggi
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Funzione per controllare se siamo nella directory giusta
check_project_dir() {
    if [[ ! -f "package.json" ]]; then
        error "Non sei nella directory del progetto! Vai in /Users/andreacamolese/Repo/elevenbase"
        exit 1
    fi
}

# Funzione per build e test
build_and_test() {
    log "Avvio build di produzione..."
    npm run build

    if [[ $? -eq 0 ]]; then
        success "Build completato con successo!"
        log "File buildati in ./dist"
    else
        error "Build fallito!"
        exit 1
    fi
}

# Funzione per commit con messaggio
commit_with_message() {
    if [[ -z "$1" ]]; then
        error "Devi specificare un messaggio di commit!"
        echo "Uso: $0 commit \"messaggio del commit\""
        exit 1
    fi

    log "Aggiungo tutti i file al staging..."
    git add .

    log "Creo commit con messaggio: $1"
    git commit -m "$1"

    if [[ $? -eq 0 ]]; then
        success "Commit creato con successo!"
    else
        error "Errore nella creazione del commit!"
        exit 1
    fi
}

# Funzione per push
push_changes() {
    log "Push delle modifiche su origin/main..."
    git push origin main

    if [[ $? -eq 0 ]]; then
        success "Push completato con successo!"
    else
        error "Errore nel push!"
        exit 1
    fi
}

# Funzione per workflow completo
full_workflow() {
    if [[ -z "$1" ]]; then
        error "Devi specificare un messaggio di commit!"
        echo "Uso: $0 workflow \"messaggio del commit\""
        exit 1
    fi

    log "=== AVVIO WORKFLOW COMPLETO ==="
    check_project_dir

    # Controllo linter
    log "Controllo linting..."
    npm run lint || warning "Ci sono errori di linting, ma procedo..."

    # Build
    build_and_test

    # Commit
    commit_with_message "$1"

    # Push
    push_changes

    success "=== WORKFLOW COMPLETATO CON SUCCESSO ==="
    log "Le tue modifiche sono state buildate, committate e pushate!"
}

# Funzione per deploy locale
local_deploy() {
    log "=== DEPLOY LOCALE ==="
    check_project_dir

    # Build
    build_and_test

    # Avvio server preview
    log "Avvio server preview su http://localhost:4173"
    npm run preview
}

# Funzione per status del progetto
project_status() {
    log "=== STATO DEL PROGETTO ==="
    check_project_dir

    echo "Directory: $(pwd)"
    echo "Branch: $(git branch --show-current)"
    echo "Status git:"
    git status --short

    echo ""
    echo "Server di sviluppo: http://localhost:8080"
    echo "Server preview: http://localhost:4173"

    if [[ -d "dist" ]]; then
        echo "Directory dist: Presente"
    else
        echo "Directory dist: Non presente (fai npm run build)"
    fi
}

# Funzione help
show_help() {
    echo "ElevenBase - Workflow di Sviluppo Locale"
    echo ""
    echo "Uso: $0 [comando] [opzioni]"
    echo ""
    echo "Comandi disponibili:"
    echo "  build          - Build del progetto"
    echo "  commit MSG     - Commit con messaggio"
    echo "  push           - Push su origin/main"
    echo "  workflow MSG   - Workflow completo (lint + build + commit + push)"
    echo "  deploy         - Deploy locale (build + preview)"
    echo "  status         - Stato del progetto"
    echo "  help           - Mostra questo aiuto"
    echo ""
    echo "Esempi:"
    echo "  $0 build"
    echo "  $0 commit \"Fix bug nella formazione\""
    echo "  $0 workflow \"Aggiunta nuova feature\""
    echo "  $0 deploy"
    echo "  $0 status"
}

# Main script logic
case "${1:-help}" in
    "build")
        check_project_dir
        build_and_test
        ;;
    "commit")
        check_project_dir
        commit_with_message "$2"
        ;;
    "push")
        check_project_dir
        push_changes
        ;;
    "workflow")
        full_workflow "$2"
        ;;
    "deploy")
        local_deploy
        ;;
    "status")
        project_status
        ;;
    "help"|*)
        show_help
        ;;
esac
