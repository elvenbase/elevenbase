#!/bin/bash
# Script per deploy in produzione su Netlify
# Uso: ./deploy-production.sh "Descrizione del deploy"

set -euo pipefail

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo -e "${RED}Errore: Questo script deve essere eseguito dalla root del progetto elevenbase${NC}"
    exit 1
fi

# Messaggio di deploy (usa il parametro o un default)
DEPLOY_MESSAGE="${1:-Production deploy $(date +%Y-%m-%d_%H:%M:%S)}"

echo -e "${BLUE}=== Deploy PRODUZIONE su Netlify ===${NC}"
echo -e "${RED}⚠️  ATTENZIONE: Questo deploy andrà direttamente in produzione!${NC}"
echo -e "Messaggio: $DEPLOY_MESSAGE"
echo ""

# Conferma
read -p "Sei sicuro di voler deployare in produzione? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Deploy annullato.${NC}"
    exit 0
fi

# 1. Verifica di essere su main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Errore: Devi essere sul branch 'main' per deployare in produzione.${NC}"
    echo -e "Branch corrente: $CURRENT_BRANCH"
    echo -e "Usa: git checkout main"
    exit 1
fi

# 2. Pull delle ultime modifiche
echo -e "${YELLOW}1. Aggiornamento del repository...${NC}"
git pull --rebase origin main || {
    echo -e "${RED}Errore durante il pull. Risolvi i conflitti e riprova.${NC}"
    exit 1
}

# 3. Verifica che non ci siano modifiche non committate
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Errore: Ci sono modifiche non committate.${NC}"
    echo -e "Committa o stasha le modifiche prima di deployare in produzione."
    git status --short
    exit 1
fi

# 4. Verifica che il file .env.production esista
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Creazione .env.production...${NC}"
    SUPABASE_URL=$(grep -E "^\s*VITE_SUPABASE_URL=" -m1 supabase/project-config.md | sed -E 's/^\s*VITE_SUPABASE_URL=//')
    SUPABASE_ANON_KEY=$(grep -E "^\s*VITE_SUPABASE_ANON_KEY=" -m1 supabase/project-config.md | sed -E 's/^\s*VITE_SUPABASE_ANON_KEY=//')
    
    if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
        echo -e "${RED}Errore: impossibile trovare le variabili Supabase${NC}"
        exit 1
    fi
    
    cat > .env.production <<EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_APP_ENV=production
EOF
fi

# 5. Build locale
echo -e "${YELLOW}2. Build di produzione...${NC}"
npm run build || {
    echo -e "${RED}Errore durante il build${NC}"
    exit 1
}

# 6. Verifica che la cartella dist esista
if [ ! -d "dist" ]; then
    echo -e "${RED}Errore: cartella dist non trovata dopo il build${NC}"
    exit 1
fi

# 7. Estrai credenziali Netlify
echo -e "${YELLOW}3. Lettura credenziali Netlify...${NC}"
NETLIFY_AUTH_TOKEN=$(grep -E "^\s*NETLIFY_AUTH_TOKEN=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_AUTH_TOKEN=//')
NETLIFY_SITE_ID_PRODUCTION=$(grep -E "^\s*NETLIFY_SITE_ID_PRODUCTION=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_SITE_ID_PRODUCTION=//')

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ] || [ -z "${NETLIFY_SITE_ID_PRODUCTION:-}" ]; then
    echo -e "${RED}Errore: credenziali Netlify non trovate in netlify-setup.md${NC}"
    exit 1
fi

# 8. Deploy in produzione
echo -e "${YELLOW}4. Deploy in PRODUZIONE su Netlify...${NC}"
npx netlify-cli@latest deploy \
    --auth "$NETLIFY_AUTH_TOKEN" \
    --site "$NETLIFY_SITE_ID_PRODUCTION" \
    --dir dist \
    --prod \
    --message "$DEPLOY_MESSAGE" | tee deploy-output.tmp

# Estrai URL dal risultato
PROD_URL=$(grep -E "Website URL:" deploy-output.tmp | sed -E 's/.*Website URL:\s*//')
rm -f deploy-output.tmp

if [ -n "$PROD_URL" ]; then
    echo ""
    echo -e "${GREEN}✅ Deploy in produzione completato con successo!${NC}"
    echo -e "${GREEN}URL Produzione: $PROD_URL${NC}"
    echo -e "${GREEN}Sito custom: https://elevenbase.pro${NC}"
    echo ""
    
    # Log del deploy
    echo "[$(date)] Production deploy: $DEPLOY_MESSAGE" >> deploy-history.log
    echo "  Commit: $(git rev-parse --short HEAD)" >> deploy-history.log
    echo "  URL: $PROD_URL" >> deploy-history.log
    echo "" >> deploy-history.log
    
    echo -e "${YELLOW}Deploy registrato in deploy-history.log${NC}"
else
    echo -e "${YELLOW}Deploy completato. Controlla l'output sopra per l'URL di produzione.${NC}"
fi