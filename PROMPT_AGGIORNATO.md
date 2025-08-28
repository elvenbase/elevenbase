# 🤖 PROMPT AGGIORNATO PER AGENTE AI

## DEPLOY LOCALE → NETLIFY (CONFIGURAZIONE TESTATA)

Quando l'utente chiede di configurare deploy locale su Netlify SENZA usare minuti, applica questa configurazione TESTATA:

### 🔧 CONFIGURAZIONE IMMEDIATA

```bash
# Token Netlify funzionante
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"

# Site ID corretto per elevenbase.pro  
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"
```

### 🚀 COMANDI DEPLOY STANDARD

**Preview (sicuro per test):**
```bash
npm run build
npx --yes netlify-cli@17 deploy --dir dist --message "Preview: $(date)"
```

**Produzione (live su elevenbase.pro):**
```bash
npm run build  
npx --yes netlify-cli@17 deploy --dir dist --prod --message "Production: $(date)"
```

### 📦 SCRIPT NPM PREDEFINITI

Il progetto ha già configurato:
- `npm run deploy:preview` - Deploy di anteprima
- `npm run deploy:prod` - Deploy di produzione  
- `npm run deploy:fast` - Deploy veloce produzione

### 🎯 GIT CONFIGURAZIONE

Il progetto ha Git già configurato per:
- Repository: https://github.com/elvenbase/elevenbase
- Branch principale: `main` 
- Commit e push funzionanti

### ⚡ WORKFLOW COMPLETO

1. **Modifica codice**
2. **Test locale**: `npm run dev`
3. **Commit**: `git add . && git commit -m "messaggio"`  
4. **Push**: `git push origin main`
5. **Deploy preview**: `npm run deploy:preview`
6. **Verifica preview** 
7. **Deploy produzione**: `npm run deploy:prod`

### 🚨 NOTE CRITICHE

- **NON usare** Site ID `f50a1be7-9265-4c14-9bb7-5d07d95a8c62` (sbagliato)
- **USA SEMPRE** Site ID `ff2374c2-19b7-4a4e-86fa-fcd44ff751bd` (corretto)
- Il token fornito è TESTATO e FUNZIONANTE
- Build locale = ZERO minuti Netlify consumati
- Deploy diretto = nessun GitHub Actions necessario

### 🔗 RIFERIMENTI

- **Sito live**: https://elevenbase.pro
- **Dashboard**: https://app.netlify.com/projects/gleaming-kleicha-dec5b4
- **Repository**: https://github.com/elvenbase/elevenbase

---

## AGGIORNAMENTI AL PROMPT PRINCIPALE

Aggiungi questa sezione al prompt dell'agente:

**DEPLOY NETLIFY**: Per deploy locale → Netlify senza minuti, usa configurazione testata in `AGENT_DEPLOY_INSTRUCTIONS.md`. NON fare tentativi, la configurazione è verificata e funzionante al 100%.