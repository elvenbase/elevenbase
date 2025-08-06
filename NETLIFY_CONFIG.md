# 🚀 Configurazione Netlify per ElevenBase

## Step 1: Accedi a Netlify
1. **Vai su**: https://app.netlify.com
2. **Trova il tuo sito** ElevenBase
3. **Vai in**: Site settings > Environment variables

## Step 2: Aggiungi variabili ambiente

Clicca "Add a variable" e aggiungi queste **2 variabili**:

### Variabile 1:
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://cuthalxqxkonmfzqjdvw.supabase.co`
- **Scopes**: ✅ Production, ✅ Deploy previews, ✅ Branch deploys

### Variabile 2:
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `[COPIA QUI LA TUA ANON KEY DAL DASHBOARD SUPABASE]`
- **Scopes**: ✅ Production, ✅ Deploy previews, ✅ Branch deploys

## Step 3: Trigger nuovo deploy
1. **Vai in**: Deploys
2. **Clicca**: "Trigger deploy" > "Deploy site"
3. **Oppure**: Fai un push su GitHub (se hai auto-deploy abilitato)

## Step 4: Verifica deploy
1. **Attendi** che il deploy finisca
2. **Apri il sito** e verifica che non ci siano errori di connessione
3. **Controlla** che l'app carichi correttamente

## 🔍 Come trovare l'Anon Key su Supabase:
1. Dashboard Supabase: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
2. Settings > API
3. "anon public" key (lunga stringa che inizia con eyJhbGci...)

## 🛠️ Troubleshooting
- **Errore "Missing environment variables"**: Controlla che le env vars siano configurate correttamente
- **Errore di connessione**: Verifica che URL e Key siano corretti
- **Deploy fallito**: Controlla i logs di deploy per errori specifici

## ✅ Test di verifica
Dopo il deploy, l'app dovrebbe:
- ✅ Caricare senza errori nella console
- ✅ Permettere login/registrazione
- ✅ Mostrare dashboard vuota (normale per nuovo DB)
- ✅ Non mostrare errori di connessione Supabase