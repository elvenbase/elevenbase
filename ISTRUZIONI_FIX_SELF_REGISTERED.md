# 🔧 **Risoluzione Problema: Colonna self_registered mancante**

## ❌ **Problema identificato:**
```
Could not find the 'self_registered' column of 'match_trialist_invites' in the schema cache
```

## 🎯 **Causa del problema:**
La tabella `match_trialist_invites` non ha la colonna `self_registered` che è richiesta dalla funzione `public-match-registration` per gestire le auto-registrazioni dei trialist.

## 🚀 **Soluzione:**

### **Passo 1: Accedi al Dashboard Supabase**
- Vai su: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
- Clicca su **SQL Editor** nella barra laterale sinistra

### **Passo 2: Esegui lo script di fix**
- Copia tutto il contenuto del file `fix_match_trialist_invites_table.sql`
- Incollalo nell'editor SQL
- Clicca su **Run** (▶️)

### **Passo 3: Verifica l'esecuzione**
- Lo script dovrebbe completarsi senza errori
- Dovresti vedere i risultati delle query di verifica che mostrano:
  - La struttura della tabella con la colonna `self_registered`
  - Le politiche RLS create

## 📋 **Cosa fa lo script:**

1. **Crea la tabella** `match_trialist_invites` se non esiste
2. **Aggiunge la colonna** `self_registered` (BOOLEAN, default false)
3. **Abilita RLS** (Row Level Security)
4. **Crea politiche di sicurezza** per coaches, admins e trialist
5. **Aggiunge indici** per performance
6. **Crea trigger** per aggiornare automaticamente `updated_at`

## ✅ **Dopo l'esecuzione:**
- La funzione `public-match-registration` funzionerà correttamente
- I trialist potranno registrarsi autonomamente tramite il link pubblico
- La colonna `self_registered` traccerà le auto-registrazioni

## 🔍 **Verifica:**
Dopo l'esecuzione, puoi verificare che tutto sia stato creato correttamente eseguendo:

```sql
-- Verifica la struttura della tabella
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'match_trialist_invites';

-- Verifica le politiche RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'match_trialist_invites';
```

## 🆘 **Se hai problemi:**
- Controlla che non ci siano errori di sintassi SQL
- Verifica che l'utente abbia i permessi per creare tabelle e politiche
- Controlla i log di Supabase per eventuali errori

## 📝 **Note:**
- Questo fix è sicuro e non modifica dati esistenti
- La colonna `self_registered` avrà valore `false` per i record esistenti
- Le nuove registrazioni avranno `self_registered = true` se fatte tramite link pubblico

## ❌ **Problema identificato (training):**
```
Could not find the 'self_registered' column of 'training_trialist_invites' in the schema cache
```

## 🚀 **Soluzione (training):**
Esegui lo script `fix_training_trialist_invites_table.sql` nel SQL Editor di Supabase.

### Cosa fa lo script
1. Crea la tabella `training_trialist_invites` se non esiste (schema minimo)
2. Aggiunge la colonna `self_registered` (BOOLEAN, default false) se manca
3. Abilita RLS e crea policy minime per consentire l’uso via funzione pubblica
4. Manda `NOTIFY pgrst, 'reload schema'` per aggiornare la cache

### Verifica
- Riesegui la registrazione pubblica per un allenamento: l’errore non deve più apparire

> Nota: se usi policy personalizzate, adatta le policy nello script secondo i ruoli del tuo progetto.