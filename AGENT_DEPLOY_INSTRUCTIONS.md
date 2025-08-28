# 🤖 ISTRUZIONI PER AGENTE AI - DEPLOY LOCALE → NETLIFY

## 🎯 CONFIGURAZIONE AUTOMATICA COMPLETA

Quando l'utente chiede di configurare deploy locale → Netlify, segui ESATTAMENTE questi passaggi senza fare tentativi:

### 1. ✅ CONFIGURAZIONE VARIABILI AMBIENTE

```bash
# Token Netlify CORRETTO (testato e funzionante)
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"

# Site ID CORRETTO per elevenbase.pro (NON usare quello vecchio!)
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"
```

### 2. 🔧 VERIFICA CONFIGURAZIONE

```bash
# Controlla che il token funzioni
npx --yes netlify-cli@17 status

# Lista siti per verificare Site ID
npx --yes netlify-cli@17 sites:list
```

### 3. 📦 BUILD E DEPLOY

**Build locale:**
```bash
npm install  # Se necessario
npm run build
```

**Deploy Preview (sicuro):**
```bash
npx --yes netlify-cli@17 deploy --dir dist --message "Preview: $(date)"
```

**Deploy Produzione:**
```bash
npx --yes netlify-cli@17 deploy --dir dist --prod --message "Production: $(date)"
```

## 🚨 ERRORI COMUNI E SOLUZIONI

### ❌ "Site not found" 
- **Problema**: Site ID sbagliato
- **Soluzione**: Usa `ff2374c2-19b7-4a4e-86fa-fcd44ff751bd` (NON f50a1be7-9265-4c14-9bb7-5d07d95a8c62)

### ❌ "Unauthorized"
- **Problema**: Token scaduto o sbagliato  
- **Soluzione**: Usa il token testato sopra

### ❌ "crypto.hash is not a function"
- **Problema**: Node.js versione incompatibile
- **Soluzione**: Il progetto è già configurato con Node 22

### ❌ Deploy si blocca
- **Soluzione**: Riprova, spesso è temporaneo

## 🎯 CONFIGURAZIONE FILE LOCALI

**.netlify/state.json** deve contenere:
```json
{"siteId":"ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"}
```

## 📋 SCRIPT NPM CONFIGURATI

Il progetto ha già questi script pronti:
```json
{
  "deploy:preview": "npm run clean:build && npx --yes netlify-cli@17 deploy --dir dist --message 'Preview: $(date)'",
  "deploy:prod": "npm run clean:build && npx --yes netlify-cli@17 deploy --dir dist --prod --message 'Production: $(date)'",
  "deploy:fast": "npm run deploy:prod"
}
```

## 🚀 WORKFLOW COMPLETO TESTATO

1. **Configura token**: `export NETLIFY_AUTH_TOKEN="..."`
2. **Configura site**: `export NETLIFY_SITE_ID="..."`
3. **Build**: `npm run build`
4. **Preview**: `npm run deploy:preview`
5. **Produzione**: `npm run deploy:prod`

## 🔗 LINK DI RIFERIMENTO

- **Sito live**: https://elevenbase.pro
- **Dashboard**: https://app.netlify.com/projects/gleaming-kleicha-dec5b4
- **GitHub**: https://github.com/elvenbase/elevenbase

## ✅ VANTAGGI DIMOSTRATI

- 🔥 **Build locale**: 6-7 secondi
- ⚡ **Zero minuti Netlify**: Build fatta localmente
- 🚀 **Deploy diretto**: Senza GitHub Actions
- 💯 **Controllo totale**: Deploy quando vuoi
- 🧪 **Preview sicuro**: Test prima produzione

## 🎯 NOTA PER AGENTE

NON fare tentativi con altri token o site ID. La configurazione sopra è TESTATA E FUNZIONANTE al 100%. Segui esattamente questi passaggi per successo garantito.