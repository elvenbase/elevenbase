# Aggiornamento URL di Autenticazione Supabase

## 🔧 **Configurazione necessaria nel Dashboard Supabase:**

### **1. Vai al Dashboard Supabase:**
- Apri: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
- Vai su **Authentication** → **Settings**

### **2. Aggiorna Site URL:**
- **Site URL**: `https://gleaming-kleicha-dec5b4.netlify.app`
- **Redirect URLs**: aggiungi questi URL:
  - `https://gleaming-kleicha-dec5b4.netlify.app`
  - `https://gleaming-kleicha-dec5b4.netlify.app/confirm`
  - `https://gleaming-kleicha-dec5b4.netlify.app/auth`

### **3. Configurazione Email Template (IMPORTANTE):**
- Vai su **Authentication** → **Email Templates**
- Seleziona **Confirm signup**
- Nel template, assicurati che il link punti a: `{{ .ConfirmationURL }}`
- Il link dovrebbe essere: `https://gleaming-kleicha-dec5b4.netlify.app/confirm?token={{ .Token }}&type=signup`

### **3. Salva le modifiche**

## 🚀 **Dopo l'aggiornamento:**
- I link di conferma email punteranno al sito di produzione
- La registrazione funzionerà correttamente
- Gli utenti potranno confermare l'email e accedere

## 📝 **Note:**
- Il file `supabase/config.toml` è già aggiornato localmente
- Le modifiche nel dashboard sono necessarie per l'ambiente di produzione 