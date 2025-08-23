# 🚀 Deploy Ibrido - Build Locale + Netlify

Questo documento spiega il nuovo sistema di deploy ibrido che ti permette di fare il build in locale e deployare su Netlify **senza consumare minuti di build**.

## 🎯 Come Funziona

### Flusso di Deploy:
1. **📦 Build Locale** - Fai il build in locale (nessun minuto Netlify)
2. **📤 Push su GitHub** - Il workflow scarica gli artifact del build
3. **🚀 Deploy su Netlify** - Deploya i file già buildati
4. **🌐 Sito Online** - Le modifiche sono live

## 📋 Metodi di Deploy

### **Metodo 1: Deploy Automatico (Push su Main)**
```bash
# 1. Build locale
npm run build

# 2. Push modifiche
./scripts/dev-workflow.sh workflow "Aggiunta nuove feature"

# 3. Il deploy avviene automaticamente
```

### **Metodo 2: Deploy Manuale con Opzioni**
1. Vai su **GitHub → Actions → CI/CD Pipeline**
2. Clicca **"Run workflow"**
3. Scegli:
   - **Environment**: `production`
   - **Skip deployment**: `false` (per deployare)
4. Clicca **"Run workflow"**

### **Metodo 3: Skip Deploy (Solo Build)**
```bash
# Per fare solo build senza deploy:
# Nel workflow_dispatch, setta "Skip deployment" = true
```

## ⚙️ Configurazione del Workflow

### GitHub Actions Workflow Attivo:
```yaml
# Trigger su push al branch main
on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      skip_deploy:
        type: boolean
        default: false
```

### Job di Deploy:
- ✅ **Scarica artifact** del build locale
- ✅ **Deploya su Netlify** usando i file già buildati
- ✅ **Nessun rebuild** su Netlify (zero minuti)

## 🔧 Comandi Utili

### Workflow Locale:
```bash
# Build completo con deploy
./scripts/dev-workflow.sh workflow "Messaggio commit"

# Solo build senza deploy
npm run build

# Status del progetto
./scripts/dev-workflow.sh status
```

### GitHub Actions:
- **Automatico**: Push su `main` → Deploy automatico
- **Manuale**: Actions → Run workflow → Deploy on-demand
- **Skip**: Actions → Run workflow → Skip deployment = true

## 📊 Vantaggi del Deploy Ibrido

### ✅ **Pro:**
- 🚫 **Zero minuti Netlify** per il build
- ⚡ **Build più veloce** in locale
- 🎛️ **Controllo completo** sul processo di build
- 🔄 **Deploy automatico** o manuale
- 📝 **Debug locale** prima del deploy

### ⚠️ **Considerazioni:**
- 📤 **Upload su GitHub** dei file buildati
- ⏱️ **Tempo aggiuntivo** per GitHub Actions
- 🔐 **Secret Netlify** necessari nel repository

## 🔑 Secret Necessari (GitHub)

Per il corretto funzionamento, assicurati che questi secret siano configurati:

```bash
# Repository Settings → Secrets and variables → Actions
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID_PRODUCTION=your_site_id
SUPABASE_ACCESS_TOKEN=your_supabase_token
```

## 🌐 Come Vedere il Sito

Una volta completato il deploy:
1. **GitHub Actions** mostrerà il link del deploy
2. **Netlify** invierà una notifica email
3. **Dashboard Netlify** → Deployments → Ultimo deploy

## 🛠️ Troubleshooting

### **Deploy Fallito:**
1. Controlla i **secret** in GitHub
2. Verifica che il **build locale** sia completato
3. Controlla i **log di GitHub Actions**

### **File Mancanti:**
- Assicurati che la cartella `dist/` sia presente
- Verifica che il build sia completato con successo

### **Secret Mancanti:**
```bash
# In GitHub → Settings → Secrets and variables → Actions
# Aggiungi:
# - NETLIFY_AUTH_TOKEN
# - NETLIFY_SITE_ID_PRODUCTION
```

## 📈 Monitoraggio

### GitHub Actions:
- **Actions Tab** → CI/CD Pipeline
- **Build Status** badge
- **Deploy Logs** dettagliati

### Netlify:
- **Site Dashboard** → Deployments
- **Deploy Notifications** via email
- **Build Logs** in Netlify

## 🎉 Prossimi Passi

1. **Test del Deploy**: Fai una modifica e testa il flusso completo
2. **Configura Secret**: Assicurati che tutti i secret siano impostati
3. **Personalizza**: Adatta il workflow alle tue esigenze
4. **Monitora**: Tieni d'occhio i deploy e i costi

---

**Il tuo setup ibrido è ora attivo!** 🚀

Fai il build in locale, pusha le modifiche e vedrai automaticamente il sito aggiornarsi su Netlify!
