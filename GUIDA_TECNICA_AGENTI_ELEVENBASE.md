# 🚀 GUIDA TECNICA COMPLETA PER AGENTI - PROGETTO ELEVENBASE

## 📋 OVERVIEW PROGETTO

- Stack: React + TypeScript + Vite + ShadCN/UI + TailwindCSS
- Backend: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- Deploy: Netlify (build locale + deploy diretto)
- Git: Branch-based workflow
- Env: File .env locale + variabili Netlify

---

## 🔧 SETUP AMBIENTE

### 1. STRUTTURA FILES CRITICI
/workspace/
├── .env                    # ❗ LOCALE - non in git
├── netlify.toml           # Config Netlify con env vars
├── src/                   # Codice React/TS
├── supabase/functions/    # Edge Functions (deploy manuale)
├── dist/                  # Build output
└── package.json          # Dependencies

### 2. FILE .env ESSENZIALE
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
VITE_APP_ENV=development

⚠️ IMPORTANTE: Se .env non esiste, CREALO SEMPRE prima di fare build!

---

## 🌿 WORKFLOW GIT

### 1. BRANCH STRATEGY
main                    # ✅ Produzione stabile
feature/nome-feature    # ✅ Nuove funzionalità
cursor/nome-branch      # ✅ Branch automatici Cursor
fix/nome-fix           # ✅ Bug fixes

### 2. COMANDI GIT ESSENZIALI
# Verificare stato
git status
git log --oneline -5

# Creare nuovo branch
git checkout -b feature/nome-feature

# Cambiare branch
git checkout main
git checkout feature/nome-feature

# Commit
git add .
git commit -m "🎯 TIPO: Descrizione chiara

- Dettaglio 1
- Dettaglio 2"

# Merge su main (quando pronto)
git checkout main
git merge feature/nome-feature

# Verificare conflitti
git status  # Controllare sempre dopo merge

### 3. MESSAGGI COMMIT STANDARD
🎯 FEAT: Nuova funzionalità
🔧 FIX: Bug fix
🎨 UI: Miglioramenti interfaccia
🚀 DEPLOY: Deploy/build
📝 DOCS: Documentazione
🔄 REFACTOR: Refactoring codice
⚡ PERF: Performance
🧪 TEST: Testing

---

## 🏗️ BUILD E DEPLOY

### 1. BUILD LOCALE (SEMPRE)
# ⚠️ VERIFICA .env PRIMA DI BUILD
ls -la .env  # Deve esistere!

# Build
npm run build

# Verifica build
ls -la dist/  # Deve contenere files

### 2. DEPLOY PREVIEW
# Export credenziali
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"

# Deploy preview
npx --yes netlify-cli@17 deploy --dir dist --message "🎯 PREVIEW: Descrizione"

# ✅ Output: Website draft URL per testing

### 3. DEPLOY PRODUZIONE
# Export credenziali (stesso di preview)
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"

# Deploy produzione
npx --yes netlify-cli@17 deploy --dir dist --prod --message "🚀 PROD: Descrizione"

# ✅ Output: https://elevenbase.pro

---

## 🗄️ SUPABASE - RESPONSABILITÀ UTENTE

### ⚠️ IMPORTANTE: NON TOCCARE SUPABASE
- Database: Solo l'utente può modificare tabelle/RLS
- Auth: Solo l'utente gestisce utenti/permessi
- Edge Functions: Solo l'utente può deployare

### COSA PUOI FARE
✅ Leggere codice Edge Functions da supabase/functions/
✅ Fornire codice completo per deploy manuale
✅ Debuggare errori tramite logs Supabase (utente li condivide)

### COSA NON FARE
❌ Non installare Supabase CLI
❌ Non tentare deploy Edge Functions
❌ Non modificare database/auth

### EDGE FUNCTIONS DISPONIBILI
supabase/functions/
├── public-registration/     # ✅ Già deployata
├── public-match-registration/
├── create-user/
├── update-user/
├── delete-user/
├── activate-user/
├── attendance-scores/
├── training-automation/
├── resend-confirmation/
└── fix-database/

---

## 🔍 DEBUGGING COMMON ISSUES

### 1. ERRORE: Missing Supabase environment variables
SOLUZIONE: Creare .env
cat > .env << EOF
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
VITE_APP_ENV=development
EOF

### 2. ERRORE: 404 Edge Function
❌ cuthalxqxkonmfzqjdvw.supabase.co/functions/v1/function-name 404

✅ SOLUZIONE: 
1. Leggere codice da supabase/functions/function-name/
2. Fornire codice completo all'utente
3. Utente deploya manualmente su Supabase Dashboard

### 3. ERRORE: Bundle/Build diversi
# Verificare hash files
curl -s https://elevenbase.pro | grep -o 'assets/index-[^"]*\.js'
curl -s https://preview-url | grep -o 'assets/index-[^"]*\.js'

# Se diversi: problema cache o build
# SOLUZIONE: Build pulito + force refresh browser
rm -rf dist/ node_modules/.vite
npm run build

### 4. ERRORE: Git conflicts
git status  # Verificare conflitti
git diff    # Vedere differenze

# Risolvere manualmente o
git checkout --theirs file.tsx  # Prendi versione remota
git checkout --ours file.tsx    # Prendi versione locale

---

## 📁 FILE STRUCTURE CRITICA

### ROUTING PRINCIPALE
// src/App.tsx - Routes principali
<Route path="/" element={<Welcome />} />              // Home pubblica
<Route path="/dashboard" element={<Dashboard />} />   // Dashboard autenticata
<Route path="/session/:token" element={<PublicSession />} /> // Sessioni pubbliche

### AUTENTICAZIONE
// src/contexts/AuthContext.tsx - Gestione auth
// src/components/ProtectedRoute.tsx - Route protette

### COMPONENTS CRITICI
src/components/
├── Navigation.tsx           # Menu principale
├── ProtectedRoute.tsx      # Route authentication
├── PublicLinkSharing.tsx   # Link pubblici sessioni
└── forms/                  # Form vari

### PAGES PRINCIPALI
src/pages/
├── Welcome.tsx             # Home page
├── Dashboard.tsx           # Dashboard principale
├── PublicSession.tsx       # Sessioni pubbliche (usa Edge Functions)
├── AuthMultiTeam.tsx       # Login multi-team
└── SessionManagement.tsx   # Gestione allenamenti

---

## 🚨 ERRORI COMUNI DA EVITARE

### 1. Build senza .env
❌ npm run build  # Senza .env = errore
✅ ls .env && npm run build  # Verifica prima

### 2. Deploy senza build
❌ netlify deploy --dir dist  # Senza build recente
✅ npm run build && netlify deploy --dir dist

### 3. Branch sbagliato
❌ git commit  # Su branch sbagliato
✅ git status && git checkout correct-branch && git commit

### 4. Cache problemi
# Se il sito non si aggiorna dopo deploy
✅ Ctrl+F5 (force refresh)
✅ Modalità incognito
✅ Verificare URL deploy corretto

---

## 🎯 WORKFLOW COMPLETO TIPO

### SCENARIO: Aggiungere nuova feature

# 1. Verifica stato
git status
git log --oneline -3

# 2. Crea branch
git checkout -b feature/new-feature

# 3. Sviluppa + test locale
# ... modifiche codice ...

# 4. Verifica .env
ls .env || echo "CREARE .ENV!"

# 5. Build
npm run build

# 6. Deploy preview
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"
npx --yes netlify-cli@17 deploy --dir dist --message "🎯 PREVIEW: New feature test"

# 7. Test preview URL

# 8. Commit
git add .
git commit -m "🎯 FEAT: New feature implemented"

# 9. Merge su main (se approvato)
git checkout main
git merge feature/new-feature

# 10. Build produzione
npm run build

# 11. Deploy produzione
npx --yes netlify-cli@17 deploy --dir dist --prod --message "🚀 PROD: New feature live"

---

## 📞 QUANDO CHIEDERE AIUTO ALL'UTENTE

### SEMPRE CHIEDERE PER:
- ❗ Deploy Edge Functions Supabase
- ❗ Modifiche database/RLS
- ❗ Problemi autenticazione utenti
- ❗ Errori 404 Edge Functions (fornire codice)

### MAI CHIEDERE PER:
- ✅ Build locale
- ✅ Deploy Netlify
- ✅ Modifiche frontend
- ✅ Git operations
- ✅ Debugging frontend

---

## 🎉 CHECKLIST FINALE

Prima di ogni operazione:
- [ ] .env esiste e contiene variabili Supabase
- [ ] Branch corretto attivo
- [ ] Build completato senza errori
- [ ] Git status pulito (no conflitti)

Prima di deploy produzione:
- [ ] Preview testato e funzionante
- [ ] Commit pushato su main
- [ ] Backup mentale dello stato precedente

Se qualcosa va male:
- [ ] Verifica logs Netlify/Supabase
- [ ] Test in modalità incognito
- [ ] Rollback disponibile (git log per commit precedenti)

---

🎯 Segui questa guida e eviterai il 95% degli errori comuni! 🚀

## CREDENZIALI E CONFIGURAZIONI IMPORTANTI

### NETLIFY
- Auth Token: nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae
- Site ID: ff2374c2-19b7-4a4e-86fa-fcd44ff751bd
- Produzione: https://elevenbase.pro

### SUPABASE
- URL: https://cuthalxqxkonmfzqjdvw.supabase.co
- Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI

### COMANDI RAPIDI
# Creare .env
echo 'VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1menFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
VITE_APP_ENV=development' > .env

# Setup deploy veloce
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae" && export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"

# Build + Deploy Preview
npm run build && npx --yes netlify-cli@17 deploy --dir dist --message "🎯 PREVIEW: Test"

# Build + Deploy Produzione  
npm run build && npx --yes netlify-cli@17 deploy --dir dist --prod --message "🚀 PROD: Update"