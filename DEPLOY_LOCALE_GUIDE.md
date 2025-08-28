# 🚀 Deploy Locale → Netlify

## ⚡ COMANDI RAPIDI

### **Preview Deploy** (raccomandato per test)
```bash
npm run deploy:preview
# oppure
./deploy-quick.sh preview
```

### **Production Deploy**
```bash
npm run deploy:prod
# oppure  
./deploy-quick.sh prod
```

### **Deploy veloce** (produzione)
```bash
npm run deploy:fast
```

## 🔧 CONFIGURAZIONE RICHIESTA

Prima del primo uso, configura le variabili ambiente:

```bash
export NETLIFY_AUTH_TOKEN="nfp_bfnX4Xp6h6M1PWNsJeie6PFbEBJz13Kk34ae"
export NETLIFY_SITE_ID="ff2374c2-19b7-4a4e-86fa-fcd44ff751bd"
```

## 🎯 WORKFLOW RACCOMANDATO

1. **Sviluppo**: Modifica il codice
2. **Test locale**: `npm run dev`
3. **Preview**: `npm run deploy:preview` 
4. **Verifica**: Controlla il link di preview
5. **Produzione**: `npm run deploy:prod`

## 📊 VANTAGGI

✅ **Build locale**: 6-7 secondi  
✅ **Zero minuti Netlify**: Build fatta localmente  
✅ **Deploy diretto**: Da locale a Netlify  
✅ **Preview sicuro**: Test prima della produzione  
✅ **Controllo totale**: Deploy quando vuoi  

## 🔗 LINK UTILI

- **Sito live**: https://elevenbase.pro
- **Dashboard**: https://app.netlify.com/projects/gleaming-kleicha-dec5b4
- **Repository**: https://github.com/elvenbase/elevenbase

## 🛠️ TROUBLESHOOTING

### Token scaduto:
```bash
unset NETLIFY_AUTH_TOKEN
# Vai su https://app.netlify.com/user/applications
# Crea nuovo token e riesporta
```

### Site ID sbagliato:
```bash
npx netlify sites:list
# Usa l'ID corretto dalla lista
```

### Deploy fallito:
```bash
npm run clean:build  # Ricostruisci
./deploy-quick.sh preview  # Riprova con preview
```