# CONFIGURAZIONE SUPABASE CORRETTA

## 🔧 **Configurazione nel Dashboard Supabase:**

### **1. Vai al Dashboard Supabase:**
- Apri: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
- Vai su **Authentication** → **Settings**

### **2. Configura Site URL CORRETTO:**
- **Site URL**: `https://gleaming-kleicha-dec5b4.netlify.app` (CON https://)
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
- **Sostituisci** tutto il contenuto HTML con quello del file `email_template.html`
- **IMPORTANTE**: Il template usa `{{ .ConfirmationURL }}` che è CORRETTO
- **Salva** le modifiche

### **4. VERIFICA IMPORTANTE:**
- **Site URL** deve essere: `https://gleaming-kleicha-dec5b4.netlify.app` (CON https://)
- **Redirect URLs** devono includere tutti gli URL sopra
- **Email Template** deve usare `{{ .ConfirmationURL }}` (NON URL personalizzati)

## 🚀 **Come funziona:**
1. **Supabase genera** il link di conferma con `{{ .ConfirmationURL }}`
2. **Il link punta** a Supabase con il redirect_to corretto
3. **Supabase reindirizza** al tuo sito Netlify dopo la conferma
4. **La tua app** gestisce la conferma nella pagina `/confirm`

## 📝 **Il problema era:**
- **Site URL** senza `https://` nella configurazione
- **Redirect URLs** mancanti o sbagliati
- **Template email** personalizzato invece di usare `{{ .ConfirmationURL }}`

## ✅ **Dopo la configurazione:**
- I link di conferma funzioneranno correttamente
- Supabase reindirizzerà al tuo sito dopo la conferma
- La tua app gestirà la conferma nella pagina `/confirm` 