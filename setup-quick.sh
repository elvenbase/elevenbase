#!/bin/bash

# 🚀 ELEVENBASE - Setup Rapido Ambiente
# Seguendo la guida tecnica per agenti

echo "🔧 ELEVENBASE - Setup Ambiente in corso..."

# 1. Verifica .env
if [ ! -f ".env" ]; then
    echo "📝 Creando file .env..."
    cat > .env << EOF
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
VITE_APP_ENV=development
EOF
    echo "✅ File .env creato"
else
    echo "✅ File .env già presente"
fi

# 2. Installa dipendenze se necessario
if [ ! -d "node_modules" ]; then
    echo "📦 Installando dipendenze..."
    npm install
    echo "✅ Dipendenze installate"
else
    echo "✅ Dipendenze già installate"
fi

# 3. Configura variabili Netlify
echo "🌐 Configurando variabili Netlify..."
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"
echo "✅ Variabili Netlify configurate"

# 4. Test build
echo "🏗️ Testando build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build completato con successo!"
    echo "📁 Files generati in ./dist/"
else
    echo "❌ Errore durante il build"
    exit 1
fi

echo ""
echo "🎉 SETUP COMPLETATO!"
echo ""
echo "📋 COMANDI DISPONIBILI:"
echo "  npm run dev          - Sviluppo locale"
echo "  npm run build        - Build produzione"
echo "  npm run deploy:preview - Deploy preview"
echo "  npm run deploy:prod   - Deploy produzione"
echo ""
echo "🌐 URLS:"
echo "  Produzione: https://elevenbase.pro"
echo "  Supabase: https://cuthalxqxkonmfzqjdvw.supabase.co"
echo ""