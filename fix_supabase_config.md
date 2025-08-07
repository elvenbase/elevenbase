# FIX CONFIGURAZIONE SUPABASE - URL CORRETTI

## 🔧 **Configurazione URGENTE nel Dashboard Supabase:**

### **1. Vai al Dashboard Supabase:**
- Apri: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
- Vai su **Authentication** → **Settings**

### **2. Configura Site URL CORRETTO:**
- **Site URL**: `https://gleaming-kleicha-dec5b4.netlify.app`
- **Redirect URLs**: aggiungi questi URL (uno per riga):
  ```
  https://gleaming-kleicha-dec5b4.netlify.app
  https://gleaming-kleicha-dec5b4.netlify.app/auth
  https://gleaming-kleicha-dec5b4.netlify.app/confirm
  https://gleaming-kleicha-dec5b4.netlify.app/dashboard
  ```

### **3. Configura Email Template CORRETTO:**
- Vai su **Authentication** → **Email Templates**
- Seleziona **Confirm signup**
- **Sostituisci** tutto il contenuto HTML con quello del file `email_template.html` AGGIORNATO
- **Salva** le modifiche

### **4. VERIFICA IMPORTANTE:**
- **Site URL** deve essere: `https://gleaming-kleicha-dec5b4.netlify.app` (con https://)
- **Redirect URLs** devono includere tutti gli URL sopra
- **Email Template** deve usare il formato: `https://gleaming-kleicha-dec5b4.netlify.app/confirm?token={{ .Token }}&type=signup`

## 🚀 **Dopo la configurazione:**
- I link di conferma email punteranno DIRETTAMENTE al tuo sito
- Non ci saranno più redirect a Supabase
- La conferma email funzionerà immediatamente

## 📝 **Il problema era:**
- Supabase generava URL che puntavano al suo dominio
- Il redirect_to non era un URL completo
- Il template usava {{ .ConfirmationURL }} invece del formato personalizzato 