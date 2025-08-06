# 🗄️ Setup Supabase per ElevenBase

Guida completa per configurare un nuovo database Supabase per ElevenBase.

## Step 1: Crea Progetto Supabase

1. **Vai su [supabase.com](https://supabase.com)** e accedi/registrati
2. **Crea nuovo progetto:**
   - Nome: `ElevenBase`
   - Password database: (usa una password sicura e salvala)
   - Regione: `Europe (eu-central-1)` (per performance)

## Step 2: Ottieni le Credenziali

Una volta creato il progetto:

1. **Vai in Settings > API**
2. **Copia le seguenti informazioni:**
   - `Project URL` (es: https://xxxxxxxxxxxxx.supabase.co)
   - `anon public` key (chiave pubblica)

## Step 3: Configura Variabili Ambiente

### Su Netlify:
1. **Vai nel tuo sito Netlify > Site settings > Environment variables**
2. **Aggiungi le seguenti variabili:**
   ```
   VITE_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Per sviluppo locale:
Crea file `.env.local` nella root del progetto:
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Applica le Migrations

Nel dashboard Supabase:

1. **Vai in SQL Editor**
2. **Esegui le migrations in ordine cronologico** (vedi lista sotto)
3. **Oppure usa Supabase CLI** (se installato):
   ```bash
   supabase db push
   ```

### Lista Migrations (da eseguire in ordine):

```sql
-- 1. Schema di base
20241201000000_create_jersey_templates.sql
20250101000000_create_training_convocati.sql

-- 2. Tabelle principali
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
20250731222640_a5bc04ba-72fa-4c69-b341-9d1e3dc98e18.sql
20250731223123_1dba6fb6-4df6-455b-b1e4-e93b0da367f8.sql
20250731223136_3fc04217-50a6-4853-a680-d96e1a614410.sql
20250731224657_8f3231dc-63e8-4d6b-8993-da7da6828b5b.sql
20250731233600_0b22166b-8904-4fe8-8f67-dbba3cf5b24b.sql
20250731234514_da0b397f-fa89-4ecb-841a-1ef5743b53bf.sql
20250731235013_8ba93af4-d20a-4802-9a46-c6794dfa35db.sql
20250731235621_1dad101f-9640-4da9-aa53-91aeba1ecdd7.sql
20250731235826_51ad2ff1-7f78-4907-a371-f067767ade36.sql
20250731235935_7e9e456f-3afe-464c-a2bc-3ceed94a3437.sql

-- 3. Funzionalità aggiuntive
20250801000156_2c4f2621-a2de-4940-973f-98b5eff928b1.sql
20250801000211_a93942ef-bf94-455c-9068-038246e804f8.sql
20250801000417_d26e42d2-0f57-4918-9d66-a04dac9e173f.sql
20250801000731_8d9f1796-1260-4f26-95a8-ea6fc63ecb05.sql
20250801001000_create_quick_trial_evaluations.sql
20250801002000_create_player_evaluations.sql
20250801165228_1f4dbc6e-6b5c-4686-8b2a-7f2a87690f22.sql

-- 4. Jersey e template
20250803134717_create_jersey_templates.sql

-- 5. Miglioramenti e campi aggiuntivi
20250804064609_a629006e-a40f-46b3-82c0-c00f2640df57.sql
20250804225631_33707c4f-17fa-45f6-b2bd-faed00139537.sql
20250805090643_add_avatar_background_color.sql
20250805100000_add_captain_field.sql
20250805112000_add_coach_confirmation.sql
20250805120000_add_esperienza_to_trialists.sql
20250805120000_add_trials_gaming_fields.sql
20250805121000_align_trialists_players_fields.sql
20250805122000_complete_players_alignment.sql
```

## Step 5: Configura RLS (Row Level Security)

Nel SQL Editor, esegui:
```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE trialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
-- ... per tutte le altre tabelle

-- Crea policy di base (esempio)
CREATE POLICY "Users can view all data" ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- ... aggiungi altre policy secondo necessità
```

## Step 6: Testa la Connessione

1. **Redeploy su Netlify** con le nuove env variables
2. **Verifica che l'app si connetta** al nuovo database
3. **Controlla i log** in caso di errori

## Troubleshooting

- **Errore "Missing environment variables"**: Controlla che le env variables siano configurate correttamente
- **Errore di connessione**: Verifica URL e chiave Supabase
- **Errori di migration**: Esegui le migrations una alla volta per identificare problemi

## Note di Sicurezza

- ⚠️ **Non committare mai** le credenziali nel codice
- 🔒 **Configura RLS** per proteggere i dati
- 🔑 **Usa env variables** per tutte le configurazioni sensibili