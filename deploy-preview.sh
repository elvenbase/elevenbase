#!/bin/bash
# Script per deploy preview (draft) su Netlify
# Uso: ./deploy-preview.sh "Descrizione del deploy"

set -euo pipefail

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo -e "${RED}Errore: Questo script deve essere eseguito dalla root del progetto elevenbase${NC}"
    exit 1
fi

# Messaggio di deploy (usa il parametro o un default)
DEPLOY_MESSAGE="${1:-Preview deploy $(date +%Y-%m-%d_%H:%M:%S)}"

echo -e "${YELLOW}=== Deploy Preview su Netlify ===${NC}"
echo -e "Messaggio: $DEPLOY_MESSAGE"
echo ""

# 1. Pull delle ultime modifiche
echo -e "${YELLOW}1. Aggiornamento del repository...${NC}"
git pull --rebase origin main || {
    echo -e "${RED}Errore durante il pull. Risolvi i conflitti e riprova.${NC}"
    exit 1
}

# 2. Verifica che il file .env.production esista
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
VITE_APP_ENV=preview
EOF
fi

# 3. Build locale
echo -e "${YELLOW}2. Build del progetto...${NC}"
npm run build || {
    echo -e "${RED}Errore durante il build${NC}"
    exit 1
}

# 4. Verifica che la cartella dist esista
if [ ! -d "dist" ]; then
    echo -e "${RED}Errore: cartella dist non trovata dopo il build${NC}"
    exit 1
fi

# 5. Estrai credenziali Netlify
echo -e "${YELLOW}3. Lettura credenziali Netlify...${NC}"
NETLIFY_AUTH_TOKEN=$(grep -E "^\s*NETLIFY_AUTH_TOKEN=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_AUTH_TOKEN=//')
NETLIFY_SITE_ID_PRODUCTION=$(grep -E "^\s*NETLIFY_SITE_ID_PRODUCTION=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_SITE_ID_PRODUCTION=//')

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ] || [ -z "${NETLIFY_SITE_ID_PRODUCTION:-}" ]; then
    echo -e "${RED}Errore: credenziali Netlify non trovate in netlify-setup.md${NC}"
    exit 1
fi

# 6. Deploy preview (draft)
echo -e "${YELLOW}4. Deploy preview su Netlify...${NC}"
npx netlify-cli@latest deploy \
    --auth "$NETLIFY_AUTH_TOKEN" \
    --site "$NETLIFY_SITE_ID_PRODUCTION" \
    --dir dist \
    --message "$DEPLOY_MESSAGE" | tee deploy-output.tmp

# Estrai URL dal risultato
PREVIEW_URL=$(grep -E "Website draft URL:" deploy-output.tmp | sed -E 's/.*Website draft URL:\s*//')
rm -f deploy-output.tmp

if [ -n "$PREVIEW_URL" ]; then
    echo ""
    echo -e "${GREEN}✅ Deploy preview completato con successo!${NC}"
    echo -e "${GREEN}URL Preview: $PREVIEW_URL${NC}"
    echo ""
    echo -e "${YELLOW}Condividi questo URL per la verifica prima del deploy in produzione.${NC}"
else
    echo -e "${YELLOW}Deploy completato. Controlla l'output sopra per l'URL di preview.${NC}"
fi