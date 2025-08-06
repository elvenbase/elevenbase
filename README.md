# ElevenBase

**ElevenBase** è una web app progettata per semplificare la gestione delle squadre di club in FC26 eSports. Con ElevenBase i manager possono organizzare allenamenti, provini, partite ufficiali e comunicazioni interne in un unico spazio digitale, intuitivo e accessibile.

## Installazione e Setup

Per eseguire il progetto in locale:

```bash
# Clona il repository
git clone https://github.com/elvenbase/elevenbase.git

# Entra nella directory del progetto
cd elevenbase

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

## Prerequisiti

- Node.js (versione 18 o superiore) - [installa con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm o yarn
- Database Supabase configurato

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Funzionalità

- **Gestione Giocatori**: Anagrafica completa, statistiche e valutazioni
- **Allenamenti**: Programmazione sessioni e gestione presenze
- **Provini**: Sistema di valutazione per nuovi giocatori
- **Formazioni**: Builder visuale per creare e gestire formazioni
- **Jersey Manager**: Personalizzazione maglie e colori squadra
- **Dashboard**: Panoramica completa delle attività del club

## Deploy

Il progetto può essere deployato su qualsiasi piattaforma che supporti applicazioni React, come Vercel, Netlify o altri provider cloud.

```bash
# Build per produzione
npm run build
```
