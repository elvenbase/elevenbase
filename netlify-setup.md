# 🌐 Netlify Configuration - CA de Rissi Hub

## 🔑 **Credenziali Configurate**

### **Auth Token**
```bash
NETLIFY_AUTH_TOKEN=nfp_x5V2DU5J6pd9tWo2xEKuGnmD5Q83qPVie507
```

### **Site IDs**
```bash
# Staging (usa production site per ora)
NETLIFY_SITE_ID_STAGING=ff2374c2-19b7-4a4e-86fa-fcd44ff751bd

# Production
NETLIFY_SITE_ID_PRODUCTION=ff2374c2-19b7-4a4e-86fa-fcd44ff751bd
```

## 📋 **GitHub Secrets da Configurare**

Vai su GitHub → Settings → Secrets and variables → Actions e aggiungi:

```bash
# Netlify
NETLIFY_AUTH_TOKEN=nfp_x5V2DU5J6pd9tWo2xEKuGnmD5Q83qPVie507
NETLIFY_SITE_ID_STAGING=ff2374c2-19b7-4a4e-86fa-fcd44ff751bd
NETLIFY_SITE_ID_PRODUCTION=ff2374c2-19b7-4a4e-86fa-fcd44ff751bd

# Supabase (già configurati)
SUPABASE_ACCESS_TOKEN=sbp_fa64cfe857dac90f0fc1ffd9b005eb8b47f9e244
SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1jenFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
```

## 🚀 **Deployment Strategy**

### **Staging (Branch: develop)**
- **Site**: Usa il sito di produzione con preview
- **URL**: Preview URL generato automaticamente
- **Build**: `npm run build:dev`

### **Production (Branch: main)**
- **Site**: Sito di produzione principale
- **URL**: URL principale del sito
- **Build**: `npm run build:prod`

## 🔧 **Configurazione Netlify**

### **Build Settings**
```bash
Build command: npm run build
Publish directory: dist
Node version: 18
```

### **Environment Variables**
```bash
# Staging
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1jenFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
VITE_APP_ENV=staging

# Production
VITE_SUPABASE_URL=https://cuthalxqxkonmfzqjdvw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dGhhbHhxeGtvbm1jenFqZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc4MTIsImV4cCI6MjA3MDA5MzgxMn0.-W7haFEUs1IaQRXY_M-aL-lpAtXPhcVsQFbQhQbMpSI
VITE_APP_ENV=production
```

## 📱 **URLs del Sito**

### **Produzione**
- **Site URL**: https://ff2374c2-19b7-4a4e-86fa-fcd44ff751bd.netlify.app
- **Custom Domain**: (se configurato)

### **Staging/Preview**
- **Preview URL**: Generato automaticamente per ogni PR/branch
- **Deploy Preview**: https://deploy-preview-XXX--ff2374c2-19b7-4a4e-86fa-fcd44ff751bd.netlify.app

## 🔄 **Workflow di Deployment**

### **Automatico (GitHub Actions)**
1. **Push su develop** → Deploy staging (preview)
2. **Push su main** → Deploy production
3. **Pull Request** → Deploy preview automatico

### **Manuale**
```bash
# Deploy staging
./scripts/deploy.sh staging

# Deploy production
./scripts/deploy.sh production
```

## 🎯 **Vantaggi di Questa Configurazione**

✅ **Un solo sito Netlify** per entrambi gli ambienti
✅ **Preview automatici** per staging/PR
✅ **Deployment automatico** su main
✅ **Environment variables** separate per staging/production
✅ **Build ottimizzati** per ogni ambiente

## 🚨 **Note Importanti**

⚠️ **Staging e Production usano lo stesso sito Netlify**
- Staging = Deploy preview
- Production = Deploy principale
- Ogni branch/PR genera un preview URL unico

## 🎉 **Setup Completato**

Il tuo ambiente Netlify è ora **completamente configurato** per:
- ✅ Deployment automatico
- ✅ Preview per staging
- ✅ Production deployment
- ✅ Environment variables separate
- ✅ Build ottimizzati

---

**Status**: ✅ Netlify Configurato
**Site ID**: ff2374c2-19b7-4a4e-86fa-fcd44ff751bd
**Auth Token**: nfp_x5V2DU5J6pd9tWo2xEKuGnmD5Q83qPVie507