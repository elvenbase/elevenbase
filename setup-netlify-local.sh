#!/bin/bash

echo "🔧 SETUP NETLIFY LOCAL DEPLOY"
echo "================================"
echo ""
echo "Questo script configura il deploy locale → Netlify"
echo ""

# Step 1: Build locale
echo "📦 Step 1: Build del progetto..."
npm run clean:build

if [ $? -ne 0 ]; then
    echo "❌ Errore nella build!"
    exit 1
fi

echo "✅ Build completata!"
echo ""

# Step 2: Configurazione Netlify
echo "🔗 Step 2: Configurazione Netlify..."
echo ""
echo "OPZIONE A - Token manuale:"
echo "1. Vai su: https://app.netlify.com/user/applications"
echo "2. Crea 'New access token'"
echo "3. Copia il token e esegui:"
echo "   export NETLIFY_AUTH_TOKEN='your_token_here'"
echo ""
echo "OPZIONE B - Login interattivo:"
echo "1. Esegui: npx netlify login"
echo "2. Segui il processo di autenticazione"
echo ""

# Step 3: Test deploy
echo "🚀 Step 3: Test deploy..."
echo ""
echo "PREVIEW (raccomandato per test):"
echo "  npx netlify deploy --dir dist --message 'Preview test'"
echo ""
echo "PRODUZIONE (quando tutto è ok):"
echo "  npx netlify deploy --dir dist --prod --message 'Deploy produzione'"
echo ""

echo "✅ Setup completato!"
echo ""
echo "📋 COMANDI RAPIDI:"
echo "  npm run deploy:local  # Solo build"
echo "  ./setup-netlify-local.sh  # Questa guida"
echo ""