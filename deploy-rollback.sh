#!/bin/bash
# Script per rollback in caso di problemi
# Uso: ./deploy-rollback.sh

set -euo pipefail

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}=== Rollback Deployment ===${NC}"
echo -e "${YELLOW}Questo script ti aiuterà a fare rollback a una versione precedente${NC}"
echo ""

# 1. Mostra gli ultimi commit
echo -e "${BLUE}Ultimi 10 commit su main:${NC}"
git log --oneline -10 main
echo ""

# 2. Chiedi quale commit usare per il rollback
read -p "Inserisci l'hash del commit a cui vuoi fare rollback (o 'exit' per annullare): " COMMIT_HASH

if [ "$COMMIT_HASH" = "exit" ]; then
    echo -e "${YELLOW}Rollback annullato.${NC}"
    exit 0
fi

# 3. Verifica che il commit esista
if ! git rev-parse --quiet --verify "$COMMIT_HASH" > /dev/null; then
    echo -e "${RED}Errore: Commit $COMMIT_HASH non trovato${NC}"
    exit 1
fi

echo -e "${YELLOW}Rollback al commit: $(git log --oneline -1 $COMMIT_HASH)${NC}"
read -p "Confermi? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Rollback annullato.${NC}"
    exit 0
fi

# 4. Crea un nuovo commit di revert
echo -e "${YELLOW}Creazione commit di rollback...${NC}"
git revert --no-edit "$COMMIT_HASH"..HEAD || {
    echo -e "${RED}Errore durante il revert. Potrebbe essere necessario risolvere conflitti.${NC}"
    echo -e "${YELLOW}Dopo aver risolto i conflitti:${NC}"
    echo -e "  1. git add ."
    echo -e "  2. git revert --continue"
    echo -e "  3. Esegui di nuovo ./deploy-production.sh"
    exit 1
}

# 5. Push del revert
echo -e "${YELLOW}Push del rollback su GitHub...${NC}"
git push origin main

# 6. Rebuild e deploy
echo -e "${YELLOW}Rebuild del progetto con la versione precedente...${NC}"

# Verifica che il file .env.production esista
if [ ! -f ".env.production" ]; then
    SUPABASE_URL=$(grep -E "^\s*VITE_SUPABASE_URL=" -m1 supabase/project-config.md | sed -E 's/^\s*VITE_SUPABASE_URL=//')
    SUPABASE_ANON_KEY=$(grep -E "^\s*VITE_SUPABASE_ANON_KEY=" -m1 supabase/project-config.md | sed -E 's/^\s*VITE_SUPABASE_ANON_KEY=//')
    
    cat > .env.production <<EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_APP_ENV=production
EOF
fi

# Build
npm run build

# 7. Deploy
echo -e "${YELLOW}Deploy della versione di rollback...${NC}"
NETLIFY_AUTH_TOKEN=$(grep -E "^\s*NETLIFY_AUTH_TOKEN=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_AUTH_TOKEN=//')
NETLIFY_SITE_ID_PRODUCTION=$(grep -E "^\s*NETLIFY_SITE_ID_PRODUCTION=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_SITE_ID_PRODUCTION=//')

npx netlify-cli@latest deploy \
    --auth "$NETLIFY_AUTH_TOKEN" \
    --site "$NETLIFY_SITE_ID_PRODUCTION" \
    --dir dist \
    --prod \
    --message "ROLLBACK to commit $COMMIT_HASH"

echo ""
echo -e "${GREEN}✅ Rollback completato con successo!${NC}"
echo -e "${YELLOW}Il sito è stato ripristinato alla versione precedente.${NC}"
echo -e "${YELLOW}Verifica su: https://elevenbase.pro${NC}"