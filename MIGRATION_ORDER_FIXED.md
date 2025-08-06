# 🗄️ Ordine Corretto per Applicare le Migrations

## ⚠️ Problemi Identificati e Soluzioni

Durante l'applicazione automatica con `supabase db push`, abbiamo identificato alcuni problemi:

### 1. **Dipendenze mancanti**
- `training_convocati` riferisce `training_sessions` che non esisteva ancora
- **Soluzione**: Rinominato `20250101000000_create_training_convocati.sql` → `20250801500000_create_training_convocati.sql`

### 2. **Cron job con credenziali hardcoded**
- Migration `20250731222640_a5bc04ba-72fa-4c69-b341-9d1e3dc98e18.sql` contiene URL e chiavi del vecchio progetto
- **Soluzione**: Spostato in `supabase/migrations_backup/`

### 3. **Funzioni mancanti**
- Alcune migrations richiedono estensioni non abilitate di default

## 🎯 Piano di Azione

### Opzione A: Dashboard Manuale (Raccomandato)
1. **Vai nel Dashboard Supabase**: https://supabase.com/dashboard/project/cuthalxqxkonmfzqjdvw
2. **SQL Editor**: Applica le migrations principali manualmente
3. **Ordine consigliato**:
   ```sql
   -- 1. Schema di base
   20241201000000_create_jersey_templates.sql
   
   -- 2. Tabelle principali (in ordine cronologico)
   20250731164041_e7d6f5b3-b26a-4d72-9a23-12aab17e53ac.sql
   20250731165836_f3846070-296a-4457-869c-09434f97d471.sql
   20250731170730_e27f7ad3-264d-4e08-8365-061370e77b20.sql
   20250731194045_dd4761b3-9396-4511-ab7c-6c4998190bcb.sql
   20250731195903_9a0971b2-2e6c-40bd-84e8-5ee866814133.sql
   20250731210723_3cf1f7e7-0987-404d-a91e-827ae6eef6cd.sql
   20250731211356_b592af3c-c618-474a-8c38-0d67056e9b1d.sql
   20250731220919_e44e8461-2422-40df-8ed7-272490daa3d8.sql
   20250731221103_6cb77f9f-9a37-4229-84d3-54e2161bad7d.sql
   20250731221231_7d3eb40c-e53c-4410-9376-3c941020c2ff.sql
   
   -- 3. Salta temporaneamente:
   -- 20250731222640_a5bc04ba-72fa-4c69-b341-9d1e3dc98e18.sql (cron job)
   
   -- 4. Continua con le altre...
   ```

### Opzione B: CLI con Fix
1. **Fix migrations problematiche**
2. **Riprova `supabase db push`**

## 🚀 Configurazione Veloce Minima

Se vuoi solo testare la connessione app-database, puoi applicare solo le migrations essenziali:

```sql
-- Nel SQL Editor di Supabase, esegui in ordine:

-- 1. Players table
-- [contenuto di 20250731165836_f3846070-296a-4457-869c-09434f97d471.sql]

-- 2. Training sessions  
-- [contenuto delle migrations base]

-- 3. Jersey templates
-- [contenuto di 20241201000000_create_jersey_templates.sql]
```

## 📝 Note
- ✅ Le prime migrations di base sono state applicate correttamente
- ⚠️ Rimuovere credenziali hardcoded dalla migration di cron
- 🔧 Abilitare estensioni necessarie nel Dashboard