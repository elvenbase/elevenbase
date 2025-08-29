# 📚 MANUALE UTENTE ELEVENBASE
### Sistema di Gestione Squadra Calcistica Completo

---

## 📖 INDICE

1. [Introduzione](#introduzione)
2. [Accesso e Registrazione](#accesso-e-registrazione)
3. [Dashboard Principale](#dashboard-principale)
4. [Gestione Rosa](#gestione-rosa)
5. [Allenamenti](#allenamenti)
6. [Partite](#partite)
7. [Formazioni](#formazioni)
8. [Provini](#provini)
9. [Amministrazione](#amministrazione)
10. [Funzioni Avanzate](#funzioni-avanzate)
11. [FAQ e Risoluzione Problemi](#faq-e-risoluzione-problemi)

---

## 🚀 INTRODUZIONE

**Elevenbase** è una piattaforma completa per la gestione di squadre calcistiche che permette di:

- ✅ Gestire la rosa giocatori con statistiche dettagliate
- ✅ Organizzare allenamenti e tracciare presenze
- ✅ Pianificare partite e gestire formazioni
- ✅ Monitorare provini e valutazioni
- ✅ Generare statistiche e report avanzati
- ✅ Condividere link pubblici per registrazioni
- ✅ Gestire multiple squadre (per amministratori)

### 🎯 RUOLI UTENTE

- **👤 Giocatore**: Visualizza i propri dati, partecipa ad allenamenti e partite
- **👨‍💼 Admin**: Gestisce la squadra, giocatori, allenamenti e partite
- **👑 Founder**: Tutte le funzioni admin + impostazioni squadra
- **🌐 Super Admin**: Gestisce multiple squadre e configurazioni globali

---

## 🔐 ACCESSO E REGISTRAZIONE

### PRIMO ACCESSO

1. **Registrazione Founder** (Creazione squadra)
   - Vai su `/register-founder`
   - Inserisci dati della squadra e personali
   - Conferma email ricevuta
   - Accedi con le credenziali create

2. **Registrazione tramite Invito**
   - Clicca sul link ricevuto via email/WhatsApp
   - Compila il form di registrazione
   - Attendi approvazione dell'amministratore

3. **Accesso Esistente**
   - Vai su `/auth` o homepage
   - Inserisci email e password
   - Se hai multiple squadre, seleziona quella desiderata

### RECUPERO PASSWORD

1. Clicca "Password dimenticata?" nella schermata di login
2. Inserisci la tua email
3. Controlla la posta e clicca il link ricevuto
4. Imposta la nuova password

---

## 📊 DASHBOARD PRINCIPALE

La **Dashboard** è il centro di controllo di Elevenbase con panoramica completa:

### 📈 STATISTICHE PRINCIPALI

- **Giocatori Totali**: Numero giocatori attivi nella rosa
- **Prossimo Allenamento**: Data e ora del prossimo allenamento
- **Prossima Partita**: Dettagli della prossima partita in calendario
- **Media Presenze**: Percentuale media di partecipazione

### 📊 GRAFICI E ANALYTICS

1. **Trend Squadra**: Andamento presenze nel tempo
2. **Distribuzione Presenze**: Chi partecipa di più/meno
3. **Classifica Giocatori**: Ranking per attendance score
4. **Attività Recente**: Ultimi eventi e modifiche

### 🎯 AZIONI RAPIDE

- **➕ Nuovo Giocatore**: Aggiungi rapidamente un giocatore
- **🏃 Nuovo Allenamento**: Crea un allenamento
- **⚽ Nuova Partita**: Programma una partita
- **👤 Nuovo Trialist**: Aggiungi un provinante

---

## 👥 GESTIONE ROSA

La sezione **Squad** (`/squad`) è il cuore della gestione giocatori.

### 📋 VISUALIZZAZIONE GIOCATORI

#### Vista Tabella (Desktop)
- **Colonne**: Nome, Numero, Ruolo, Telefono, Presenze, Ritardi, Tasso Partecipazione
- **Ordinamento**: Clicca su qualsiasi colonna per ordinare
- **Filtri**: Per ruolo, stato, periodo

#### Vista Card (Mobile)
- **Card compatte** con informazioni essenziali
- **Espandibili** per dettagli completi
- **Azioni rapide** su ogni card

### ➕ AGGIUNGERE GIOCATORI

1. **Manuale**
   - Clicca "➕ Nuovo Giocatore"
   - Compila il form con:
     - Nome e cognome
     - Numero maglia
     - Ruolo (Portiere, Difensore, Centrocampista, Attaccante)
     - Telefono e email
     - Data di nascita
     - Note aggiuntive
   - Salva

2. **Import di Massa**
   - Clicca "📊 Import Massivo"
   - Scarica il template Excel/CSV
   - Compila il file con i dati
   - Carica il file completato
   - Verifica e conferma l'importazione

### ✏️ MODIFICARE GIOCATORI

1. Clicca l'icona "✏️" sul giocatore
2. Modifica i campi desiderati
3. Puoi cambiare:
   - Dati anagrafici
   - Ruolo e numero maglia
   - Stato (Attivo, Inattivo, Infortunato, Sospeso)
   - Avatar personalizzato
   - EA Sports ID per gaming
4. Salva le modifiche

### 📊 STATISTICHE GIOCATORE

Cliccando sull'avatar o nome del giocatore accedi a:

- **📈 Statistiche Presenze**: Grafici dettagliati di partecipazione
- **📅 Cronologia**: Tutti gli allenamenti e partite
- **🎯 Attendance Score**: Punteggio calcolato automaticamente
- **📱 Contatto WhatsApp**: Link diretto per messaggiare

### 🗑️ RIMUOVERE GIOCATORI

1. Clicca l'icona "🗑️" sul giocatore
2. Conferma l'eliminazione
3. ⚠️ **ATTENZIONE**: L'operazione è irreversibile

---

## 🏃 ALLENAMENTI

La sezione **Training** (`/training`) gestisce tutti gli allenamenti.

### 📅 CREARE ALLENAMENTO

1. Clicca "➕ Nuovo Allenamento"
2. Compila il form:
   - **Titolo**: Nome dell'allenamento
   - **Data**: Quando si svolge
   - **Orario**: Inizio e fine
   - **Luogo**: Dove si svolge
   - **Descrizione**: Dettagli opzionali
   - **Max Partecipanti**: Limite opzionale
3. Salva

### 📋 GESTIONE PRESENZE

#### Durante l'Allenamento
1. Apri l'allenamento dalla lista
2. Segna le presenze in tempo reale:
   - ✅ **Presente**: Giocatore partecipa
   - 🟡 **Ritardo**: Giocatore arriva in ritardo
   - ❌ **Assente**: Giocatore non partecipa
   - 🏥 **Infortunato**: Assenza per infortunio

#### Chiusura Allenamento
1. Clicca "🔒 Chiudi Allenamento"
2. Verifica le presenze finali
3. Conferma la chiusura
4. ⚠️ Una volta chiuso, le presenze sono definitive

### 📊 STATISTICHE ALLENAMENTI

- **📈 Trend Partecipazione**: Andamento nel tempo
- **🎯 Media Squadra**: Percentuale media di partecipazione
- **👑 Top Performers**: Chi partecipa di più
- **📅 Cronologia**: Tutti gli allenamenti passati

### 🔄 AZIONI SPECIALI

- **📋 Duplica**: Crea un nuovo allenamento copiando i dati
- **🔄 Riattiva**: Riapri un allenamento archiviato
- **🗑️ Elimina**: Rimuovi definitivamente

---

## ⚽ PARTITE

La sezione **Matches** (`/matches`) organizza tutte le partite.

### 🆕 CREARE PARTITA

1. Clicca "➕ Nuova Partita"
2. Compila i dettagli:
   - **Avversario**: Nome squadra avversaria
   - **Data e Ora**: Quando si gioca
   - **Casa/Trasferta**: Dove si gioca
   - **Competizione**: Campionato, Coppa, Amichevole
   - **Campo**: Luogo specifico
   - **Note**: Informazioni aggiuntive

### 🎯 GESTIONE FORMAZIONE

#### Pre-Partita
1. Vai su "👁️ Dettagli" della partita
2. Sezione "Formazione":
   - Seleziona i convocati
   - Imposta la formazione tattica
   - Assegna ruoli specifici
   - Salva la formazione

#### Durante la Partita
1. Accedi alla modalità "🔴 Live"
2. Funzioni disponibili:
   - ⚽ **Gol**: Registra i gol
   - 🔄 **Sostituzioni**: Gestisci i cambi
   - 🟨🟥 **Ammonizioni**: Cartellini
   - ⏱️ **Eventi**: Cronologia della partita

### 📊 RISULTATI E STATISTICHE

- **🏆 Risultato Finale**: Punteggio e esito
- **📈 Statistiche Giocatori**: Performance individuali
- **📅 Cronologia**: Tutte le partite giocate
- **🎯 Record**: Vittorie, sconfitte, pareggi

### 🔗 REGISTRAZIONE PUBBLICA

Per partite che richiedono registrazione esterna:

1. Vai su "⚙️ Impostazioni" della partita
2. Attiva "Registrazione Pubblica"
3. Condividi il link generato `/m/:token`
4. I giocatori possono registrarsi autonomamente

---

## 📐 FORMAZIONI

La sezione **Formations** (`/formations`) gestisce gli schemi tattici.

### 🎨 BUILDER FORMAZIONI

#### Creare Formazione
1. Clicca "➕ Nuova Formazione"
2. Scegli lo schema base (4-4-2, 3-5-2, etc.)
3. Usa il **drag & drop** per posizionare i giocatori
4. Personalizza:
   - Colori maglie
   - Numeri giocatori
   - Posizioni specifiche
   - Nome formazione

#### Modificare Formazione
1. Seleziona la formazione esistente
2. Trascina i giocatori per riposizionarli
3. Cambia giocatori cliccando sui nomi
4. Salva le modifiche

### 📤 ESPORTAZIONE

- **🖼️ PNG**: Immagine della formazione
- **📱 Share**: Condivisione diretta sui social
- **📋 Copia**: Copia link per condividere

### 🎨 PERSONALIZZAZIONE

- **🎨 Colori Campo**: Personalizza sfondo
- **👕 Maglie**: Colori e design personalizzati
- **📏 Dimensioni**: Adatta per diverse visualizzazioni

---

## 🌟 PROVINI

La sezione **Trials** (`/trials`) gestisce i provinanti.

### 👤 AGGIUNGERE TRIALIST

1. Clicca "➕ Nuovo Trialist"
2. Inserisci i dati:
   - Nome e cognome
   - Età e ruolo preferito
   - Contatti
   - Note sulla provenienza
3. Salva

### 📊 SISTEMA DI VALUTAZIONE

#### Valutazione Trialist
1. Vai su "⭐ Valutazione Provinanti"
2. Per ogni trialist valuta:
   - **🏃 Tecnica**: Abilità tecniche (1-10)
   - **💪 Fisico**: Condizione atletica (1-10)
   - **🧠 Tattica**: Comprensione del gioco (1-10)
   - **❤️ Mentalità**: Atteggiamento e motivazione (1-10)
   - **📝 Note**: Commenti dettagliati

#### Stati Trialist
- **🟡 In Prova**: Ancora in valutazione
- **✅ Promosso**: Accettato nella squadra
- **❌ Rifiutato**: Non idoneo
- **📋 Archiviato**: Completato il processo

### 📈 REPORT PROVINI

- **📊 Statistiche**: Numero trialist per stato
- **🎯 Tasso Successo**: Percentuale promossi
- **📅 Cronologia**: Tutti i provini svolti

---

## ⚙️ AMMINISTRAZIONE

Le funzioni amministrative sono accessibili dal menu "Admin" (solo per admin/founder).

### 👥 GESTIONE UTENTI

#### Invitare Nuovi Utenti (`/admin/users`)
1. Clicca "➕ Invita Utente"
2. Inserisci email e ruolo
3. Personalizza il messaggio di invito
4. Invia l'invito
5. L'utente riceverà un link per registrarsi

#### Gestire Utenti Esistenti
- **✏️ Modifica Ruolo**: Cambia i permessi utente
- **🔒 Sospendi**: Disabilita temporaneamente
- **🗑️ Elimina**: Rimuovi definitivamente
- **📧 Reinvia Invito**: Per inviti non confermati

### 🏆 IMPOSTAZIONI SQUADRA (`/team/settings`)

#### Informazioni Base
- Nome squadra e abbreviazione
- Logo e colori sociali
- Contatti e social media
- Sede e campo di allenamento

#### Configurazioni Avanzate
- **📊 Punteggi Presenza**: Personalizza il sistema di scoring
- **🎨 Temi**: Personalizza l'interfaccia
- **📱 Notifiche**: Configura avvisi automatici
- **🔐 Privacy**: Impostazioni di visibilità

### 🎨 PERSONALIZZAZIONI

#### Avatar e Sfondi (`/admin/avatar-backgrounds`)
- Carica sfondi personalizzati per avatar
- Gestisci la libreria di immagini
- Imposta sfondi predefiniti

#### Template Maglie (`/admin/jerseys`)
- Crea template per maglie personalizzate
- Configura colori e design
- Gestisci set casa/trasferta

#### Impostazioni PNG (`/admin/png-settings`)
- Configura export delle formazioni
- Personalizza watermark e branding
- Imposta qualità e dimensioni

---

## 🚀 FUNZIONI AVANZATE

### 🔗 LINK PUBBLICI

#### Sessioni Pubbliche
1. Crea un allenamento normale
2. Attiva "Condivisione Pubblica"
3. Condividi il link `/session/:token`
4. I giocatori possono registrare la presenza autonomamente

#### Registrazione Partite
1. Abilita registrazione pubblica per la partita
2. Condividi il link `/m/:token`
3. I giocatori confermano partecipazione

### 📊 ANALYTICS AVANZATE

#### Attendance Score
Sistema automatico che calcola un punteggio per ogni giocatore basato su:
- **Presenze**: +3 punti per presenza
- **Ritardi**: +1 punto per ritardo
- **Assenze**: 0 punti
- **Infortuni**: Non penalizzano

#### Report Personalizzati
- **📈 Trend Mensili**: Confronto periodi
- **🎯 Performance Individuali**: Analisi dettagliate
- **📊 Statistiche Comparative**: Confronti tra giocatori

### 🔄 AUTOMAZIONI

#### Notifiche Automatiche
- **📧 Email**: Promemoria allenamenti/partite
- **📱 WhatsApp**: Link diretti per contattare giocatori
- **🔔 Push**: Notifiche in-app

#### Backup e Sync
- **☁️ Cloud Sync**: Sincronizzazione automatica
- **📥 Export**: Backup dati in Excel/CSV
- **🔄 Restore**: Ripristino configurazioni

---

## 🆘 FAQ E RISOLUZIONE PROBLEMI

### ❓ DOMANDE FREQUENTI

#### **Q: Come faccio a cambiare il mio ruolo?**
A: Solo gli amministratori possono modificare i ruoli. Contatta il founder della tua squadra.

#### **Q: Posso essere in più squadre contemporaneamente?**
A: Sì, il sistema supporta multi-team. Seleziona la squadra al login.

#### **Q: Come recupero i dati cancellati per errore?**
A: Le eliminazioni sono irreversibili. Contatta il supporto se hai backup recenti.

#### **Q: Posso personalizzare i colori della squadra?**
A: Sì, vai su Team Settings > Personalizzazione per modificare colori e logo.

#### **Q: Come funziona l'Attendance Score?**
A: È calcolato automaticamente: Presenze (+3), Ritardi (+1), Assenze (0), Infortuni (neutri).

### 🔧 PROBLEMI COMUNI

#### **Login non funziona**
1. Verifica email e password
2. Controlla di aver confermato l'email
3. Prova il reset password
4. Contatta l'amministratore

#### **Non vedo la mia squadra**
1. Verifica di essere stato invitato
2. Controlla lo stato dell'account (potrebbe essere pending)
3. Assicurati di aver selezionato la squadra corretta

#### **Le presenze non si salvano**
1. Verifica la connessione internet
2. Ricarica la pagina
3. Controlla di avere i permessi necessari
4. Prova a chiudere e riaprire l'allenamento

#### **Formazioni non si caricano**
1. Verifica che ci siano giocatori nella rosa
2. Controlla di aver salvato la formazione
3. Aggiorna la pagina
4. Prova a ricreare la formazione

### 📞 SUPPORTO

Per problemi non risolti:

1. **📧 Email**: Contatta il supporto tecnico
2. **💬 Chat**: Usa la chat integrata (se disponibile)
3. **📖 Documentazione**: Consulta la guida online
4. **🌐 Community**: Forum utenti per consigli

---

## 🎯 CONCLUSIONE

**Elevenbase** è progettato per semplificare la gestione della tua squadra calcistica. Con questo manuale hai tutte le informazioni necessarie per utilizzare al meglio la piattaforma.

### 🚀 PROSSIMI PASSI

1. **Configura la squadra** con logo e colori
2. **Aggiungi i giocatori** alla rosa
3. **Pianifica il primo allenamento**
4. **Invita i giocatori** a registrarsi
5. **Inizia a tracciare** presenze e performance

### 💡 SUGGERIMENTI FINALI

- **📱 Usa la versione mobile** per gestire presenze in tempo reale
- **🔗 Condividi i link pubblici** per semplificare le registrazioni  
- **📊 Monitora le statistiche** per ottimizzare le performance
- **🎨 Personalizza l'interfaccia** per riflettere l'identità della squadra

---

**Buon lavoro con Elevenbase! ⚽🚀**

*Versione Manuale: 1.0 | Data: Agosto 2025*