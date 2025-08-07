# Configurazione URL Supabase per Email Confirmation

## 🔧 **Configurazione necessaria nel Dashboard Supabase:**

### **1. Vai al Dashboard Supabase:**
- Apri: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
- Vai su **Authentication** → **Settings**

### **2. Configura Site URL:**
- **Site URL**: `https://gleaming-kleicha-dec5b4.netlify.app`
- **Redirect URLs**: aggiungi questi URL (uno per riga):
  ```
  https://gleaming-kleicha-dec5b4.netlify.app
  https://gleaming-kleicha-dec5b4.netlify.app/auth
  https://gleaming-kleicha-dec5b4.netlify.app/confirm
  https://gleaming-kleicha-dec5b4.netlify.app/dashboard
  ```

### **3. Configura Email Template:**
- Vai su **Authentication** → **Email Templates**
- Seleziona **Confirm signup**
- **Sostituisci** tutto il contenuto HTML con quello del file `email_template.html`
- **Salva** le modifiche

### **4. Verifica Configurazione:**
- **Site URL** deve essere: `https://gleaming-kleicha-dec5b4.netlify.app`
- **Redirect URLs** devono includere tutti gli URL sopra
- **Email Template** deve usare `{{ .ConfirmationURL }}`

## 🚀 **Dopo la configurazione:**
- I link di conferma email punteranno al tuo sito Netlify
- Non ci saranno più errori 404
- La conferma email funzionerà correttamente

## 📝 **Note importanti:**
- Gli URL devono essere esatti (incluso https://)
- Non usare localhost per la produzione
- Salva sempre le modifiche dopo ogni configurazione 