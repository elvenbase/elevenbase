#!/bin/bash

# 🚀 DEPLOY RAPIDO LOCALE → NETLIFY
# ================================

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DEPLOY RAPIDO LOCALE → NETLIFY${NC}"
echo "================================"

# Controllo variabili ambiente
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo -e "${RED}❌ NETLIFY_AUTH_TOKEN non configurato!${NC}"
    echo "Esegui: export NETLIFY_AUTH_TOKEN=\"nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae\""
    exit 1
fi

if [ -z "$NETLIFY_SITE_ID" ]; then
    echo -e "${YELLOW}⚠️  NETLIFY_SITE_ID non configurato, uso quello del progetto${NC}"
    export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"
fi

# Tipo di deploy (default: preview)
DEPLOY_TYPE=${1:-preview}

case $DEPLOY_TYPE in
    "preview"|"p")
        echo -e "${YELLOW}🧪 Deploy PREVIEW in corso...${NC}"
        npm run deploy:preview
        ;;
    "production"|"prod"|"live")
        echo -e "${GREEN}🚀 Deploy PRODUZIONE in corso...${NC}"
        echo -e "${RED}⚠️  Attenzione: Questo aggiornerà https://elevenbase.pro${NC}"
        read -p "Continuare? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            npm run deploy:prod
        else
            echo "Deploy annullato."
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Tipo deploy non valido: $DEPLOY_TYPE${NC}"
        echo ""
        echo "Uso:"
        echo "  ./deploy-quick.sh preview    # Deploy di preview (default)"
        echo "  ./deploy-quick.sh prod       # Deploy di produzione"
        echo ""
        echo "Oppure:"
        echo "  npm run deploy:preview       # Preview"
        echo "  npm run deploy:prod          # Produzione"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Deploy completato!${NC}"
echo ""
echo -e "${BLUE}🔗 Link utili:${NC}"
echo "• Dashboard: https://app.netlify.com/projects/gleaming-kleicha-dec5b4"
echo "• Sito live: https://elevenbase.pro"