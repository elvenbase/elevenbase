# 📋 PIANO DI ALLINEAMENTO TRIALS → SQUAD

## 🔍 ANALISI ATTUALE

**PLAYERS TABLE** (struttura completa):
- ✅ `id`, `first_name`, `last_name`, `jersey_number`, `position`, `status`, `phone`, `avatar_url`
- ✅ `ea_sport_id`, `gaming_platform`, `platform_id` (campi gaming)
- ✅ `created_at`, `updated_at`

**TRIALISTS TABLE** (struttura attuale):
- ✅ `id`, `first_name`, `last_name`, `phone`, `position`, `avatar_url`
- ✅ `email`, `birth_date` (specifici per trials)
- ✅ `status` (trial_status), `trial_start_date`, `notes`, `created_by`
- ❌ **MANCANO**: `jersey_number`, `ea_sport_id`, `gaming_platform`, `platform_id`

---

## 📝 STEP 1: MIGRAZIONE DATABASE

**🗃️ A) Aggiungere campi mancanti a TRIALISTS:**

```sql
-- 1.1 Aggiungi campi gaming e jersey_number
ALTER TABLE public.trialists 
ADD COLUMN jersey_number INTEGER,
ADD COLUMN ea_sport_id VARCHAR(255),
ADD COLUMN gaming_platform VARCHAR(255),
ADD COLUMN platform_id VARCHAR(255);

-- 1.2 Aggiungi constraint per jersey_number (opzionale per trialists)
ALTER TABLE public.trialists 
ADD CONSTRAINT trialists_jersey_number_unique 
UNIQUE(jersey_number) DEFERRABLE INITIALLY DEFERRED;

-- 1.3 Crea indici per performance
CREATE INDEX idx_trialists_jersey_number ON public.trialists(jersey_number);
CREATE INDEX idx_trialists_gaming_platform ON public.trialists(gaming_platform);
```

**🗃️ B) Funzione per promozione trialist → player:**

```sql
-- 1.4 Funzione per promuovere trialist a player
CREATE OR REPLACE FUNCTION public.promote_trialist_to_player(_trialist_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_player_id UUID;
  trialist_record RECORD;
BEGIN
  -- Recupera dati trialist
  SELECT * INTO trialist_record FROM trialists WHERE id = _trialist_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trialist non trovato';
  END IF;
  
  -- Verifica jersey_number non sia già in uso
  IF trialist_record.jersey_number IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM players WHERE jersey_number = trialist_record.jersey_number) THEN
      RAISE EXCEPTION 'Numero maglia già in uso';
    END IF;
  END IF;
  
  -- Inserisci nuovo player
  INSERT INTO players (
    first_name, last_name, jersey_number, position, 
    status, phone, avatar_url, ea_sport_id, 
    gaming_platform, platform_id
  ) VALUES (
    trialist_record.first_name, trialist_record.last_name, 
    trialist_record.jersey_number, trialist_record.position,
    'active', trialist_record.phone, trialist_record.avatar_url,
    trialist_record.ea_sport_id, trialist_record.gaming_platform, 
    trialist_record.platform_id
  ) RETURNING id INTO new_player_id;
  
  -- Aggiorna status trialist a 'promosso'
  UPDATE trialists 
  SET status = 'promosso', updated_at = NOW() 
  WHERE id = _trialist_id;
  
  RETURN new_player_id;
END;
$$;
```

---

## ⚛️ STEP 2: AGGIORNAMENTO TYPES TYPESCRIPT

**📁 `src/integrations/supabase/types.ts`**
```typescript
// Aggiornare interfaccia trialists
trialists: {
  Row: {
    // ... campi esistenti ...
    jersey_number: number | null
    ea_sport_id: string | null
    gaming_platform: string | null
    platform_id: string | null
  }
  Insert: {
    // ... campi esistenti ...
    jersey_number?: number | null
    ea_sport_id?: string | null
    gaming_platform?: string | null
    platform_id?: string | null
  }
  Update: {
    // ... campi esistenti ...
    jersey_number?: number | null
    ea_sport_id?: string | null
    gaming_platform?: string | null
    platform_id?: string | null
  }
}
```

---

## 🎨 STEP 3: AGGIORNAMENTO COMPONENTI REACT

**📁 A) `src/components/forms/TrialistForm.tsx`**
- ✅ Aggiungere campi: `jersey_number`, `ea_sport_id`, `gaming_platform`, `platform_id`
- ✅ Sezione "Dati Gaming" identica a PlayerForm
- ✅ Validazione jersey_number per unicità
- ✅ Gestione condizionale platform_id (PS5/Xbox)

**📁 B) `src/components/forms/EditTrialistForm.tsx`**  
- ✅ Stessi campi di TrialistForm
- ✅ Pre-popolazione dati esistenti
- ✅ Bottone "Promuovi a Giocatore" (se status = 'promosso')

**📁 C) `src/components/TrialsKanban.tsx`**
- ✅ Mostrare jersey_number nelle card trialist
- ✅ Badge gaming platform se presente
- ✅ Azione "Promuovi" per trialists promossi

**📁 D) `src/components/TrialistsTable.tsx`** (se esiste)
- ✅ Colonne aggiuntive per nuovi campi
- ✅ Ordinamento per jersey_number
- ✅ Filtri per gaming_platform

---

## 🔗 STEP 4: HOOKS E API

**📁 `src/hooks/useSupabaseData.ts`**
```typescript
// A) Aggiornare interfacce esistenti
interface TrialistFormData {
  // ... campi esistenti ...
  jersey_number?: number;
  ea_sport_id?: string;
  gaming_platform?: string;
  platform_id?: string;
}

// B) Nuova mutation per promozione
export const usePromoteTrialist = () => {
  return useMutation({
    mutationFn: async (trialistId: string) => {
      const { data, error } = await supabase.rpc(
        'promote_trialist_to_player', 
        { _trialist_id: trialistId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Trialist promosso a giocatore!');
      queryClient.invalidateQueries({ queryKey: ['trialists'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    }
  });
};

// C) Aggiornare validazioni
const validateTrialistData = (data: TrialistFormData) => {
  // Validazione jersey_number se presente
  if (data.jersey_number && (data.jersey_number < 1 || data.jersey_number > 99)) {
    throw new Error('Numero maglia deve essere tra 1 e 99');
  }
  
  // Validazione gaming platform consistency
  if (data.gaming_platform && ['PS5', 'Xbox'].includes(data.gaming_platform)) {
    if (!data.platform_id) {
      throw new Error(`ID ${data.gaming_platform} richiesto`);
    }
  }
};
```

---

## 🎯 STEP 5: NUOVE FUNZIONALITÀ

**📁 A) Componente `PromoteTrialistDialog.tsx`**
```typescript
// Dialogo conferma promozione con:
// - Riepilogo dati trialist
// - Controllo jersey_number conflicts  
// - Opzione modifica dati prima promozione
// - Conferma finale
```

**📁 B) Aggiornamento `TrialistCard.tsx`**
```typescript
// - Badge numero maglia se presente
// - Icone gaming platform  
// - Bottone "Promuovi" condizionale
// - Collegamento WhatsApp migliorato
```

---

## 📋 STEP 6: VALIDAZIONI E CONTROLLI

**🔒 A) Validazioni Form:**
- Jersey number: unique, range 1-99, optional
- Gaming platform: enum validation
- Platform ID: required se PS5/Xbox
- Phone: format validation migliorata

**🔒 B) Controlli Business Logic:**
- Impossibile promuovere se jersey_number già in uso
- Solo trialists con status 'promosso' possono essere promossi
- Controllo permessi per promozione (coach/admin)

**🔒 C) Policies RLS:**
```sql
-- Policy per funzione promote_trialist_to_player
CREATE POLICY "Only coaches and admins can promote trialists" 
ON public.players FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('coach', 'admin', 'superadmin')
  )
);
```

---

## 🧪 STEP 7: TESTING E MIGRAZIONE DATI

**🔧 A) Script di test:**
```sql
-- Test promozione trialist
SELECT promote_trialist_to_player('test-trialist-id');

-- Verifica dati coerenti
SELECT t.*, p.* FROM trialists t 
LEFT JOIN players p ON p.first_name = t.first_name 
WHERE t.status = 'promosso';
```

**📊 B) Migrazione dati esistenti:**
```sql
-- Aggiorna trialists esistenti con dati di default
UPDATE trialists SET 
  jersey_number = NULL,
  ea_sport_id = NULL, 
  gaming_platform = NULL,
  platform_id = NULL
WHERE jersey_number IS NULL;
```

---

## 📋 ORDINE DI IMPLEMENTAZIONE

1. **🗃️ Database** → Migrazione campi + funzione promozione
2. **📝 Types** → Aggiornamento TypeScript interfaces  
3. **🔗 Hooks** → Nuove mutations e validazioni
4. **🎨 Forms** → TrialistForm + EditTrialistForm 
5. **📱 UI** → TrialsKanban + cards + dialoghi
6. **🧪 Test** → Validazione funzionalità + edge cases
7. **🚀 Deploy** → Migrazione produzione

---

## ⚠️ ATTENZIONI CRITICHE

- **NON toccare** tabella `players` o logiche `/squad` 
- **Mantenere** campi specifici trials (`email`, `birth_date`, `trial_start_date`, `notes`)
- **Gestire** jersey_number conflicts nella promozione
- **Validare** dipendenze esistenti prima modifiche
- **Testing** completo su ambiente staging

---

**🎯 RISULTATO FINALE:**
- ✅ Trialists con tutti i campi di Players
- ✅ Form completo per inserimento/modifica
- ✅ Funzione promozione trialist → player
- ✅ UI aggiornata con nuovi campi
- ✅ Gestione stato avanzamento + valutazioni
- ✅ Zero impatti su logiche Squad esistenti