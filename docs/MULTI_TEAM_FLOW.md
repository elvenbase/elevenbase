# FLUSSO CORRETTO MULTI-TEAM

## Scenario 1: NUOVO UTENTE CREA TEAM
1. User compila form "Crea Team"
2. Sistema fa signup → Supabase invia email di conferma
3. User riceve email e clicca link
4. User viene reindirizzato a `/confirm?token=XXX&type=signup&team_data=encoded_data`
5. Sistema:
   - Conferma l'email
   - Decodifica i dati del team
   - Crea il team
   - Associa user al team come owner
6. Redirect a dashboard del team

## Scenario 2: NUOVO UTENTE ENTRA IN TEAM
1. User riceve codice invito
2. User compila form con codice
3. Sistema fa signup → Supabase invia email
4. User conferma email
5. User viene reindirizzato a `/confirm?token=XXX&type=signup&invite_code=XXX`
6. Sistema:
   - Conferma l'email
   - Valida il codice invito
   - Aggiunge user al team
7. Redirect a dashboard del team

## Scenario 3: UTENTE ESISTENTE CREA TEAM
1. User fa login
2. Va su "Crea nuovo team"
3. Crea il team immediatamente (è già verificato)

## PROBLEMA ATTUALE
Stiamo cercando di fare tutto in un colpo solo, ma Supabase richiede conferma email prima di operazioni importanti.