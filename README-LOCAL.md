# Workflow Locale per ElevenBase

Questo documento spiega come lavorare sul progetto **elevenbase** in locale, senza utilizzare Netlify, per evitare di consumare minuti di build.

## 🚀 Quick Start

### 1. Installazione Dipendenze
```bash
npm install
```

### 2. Sviluppo Locale
```bash
npm run dev
```
Il server di sviluppo sarà disponibile su `http://localhost:8080`

### 3. Build per Produzione
```bash
npm run build
```
I file buildati saranno nella directory `dist/`

## 📋 Comandi Disponibili

### Sviluppo
- `npm run dev` - Avvia il server di sviluppo (hot reload)
- `npm run build` - Build per produzione
- `npm run build:dev` - Build in modalità development
- `npm run lint` - Esegue il linter ESLint
- `npm run test` - Esegue i test con Vitest

### Deploy Locale
- `npm run clean` - Rimuove la directory dist
- `npm run clean:build` - Pulisce e rebuilda
- `npm run deploy:local` - Build completo per deploy locale
- `npm run preview` - Serve i file buildati localmente
- `npm run start:prod` - Build e serve in produzione locale

## 🔄 Workflow di Sviluppo

### Modifiche e Commit
1. **Sviluppo**: `npm run dev`
2. **Test build**: `npm run build`
3. **Controllo linter**: `npm run lint`
4. **Commit modifiche**:
   ```bash
   git add .
   git commit -m "Descrizione delle modifiche"
   git push origin main
   ```

### Deploy Locale Completo
```bash
# Build e preview in un comando
npm run start:prod
```

Questo comando:
1. Pulisce la directory dist
2. Builda il progetto
3. Avvia il server locale su `http://localhost:4173`

## 📁 Struttura Progetto

```
/Users/andreacamolese/Repo/elevenbase/
├── src/                    # Codice sorgente
├── dist/                   # File buildati (generato)
├── public/                 # Asset statici
├── supabase/               # Configurazione Supabase
└── package.json           # Dipendenze e script
```

## 🔧 Configurazioni

### Vite Config
- Server di sviluppo: `http://localhost:8080`
- Server preview: `http://localhost:4173`
- Build output: `./dist`

### Git
- Repository: `https://github.com/elvenbase/elevenbase.git`
- Branch principale: `main`

## ⚡ Vantaggi del Workflow Locale

1. **Nessun limite di minuti** - Non utilizzi i minuti di Netlify
2. **Build più veloce** - Build locale generalmente più rapido
3. **Debug semplificato** - Puoi debuggare direttamente in locale
4. **Controllo completo** - Hai il pieno controllo del processo di build
5. **Costo zero** - Non hai costi aggiuntivi per il build

## 🚨 Importante

- **Supabase**: Le migrations e configurazioni Supabase sono già incluse
- **Dipendenze**: Tutte le dipendenze sono già installate
- **Build**: Il progetto è configurato per buildare correttamente
- **Server**: Puoi testare l'applicazione localmente prima del deploy

## 🎯 Prossimi Passi

1. Apri `http://localhost:8080` per lo sviluppo
2. Apri `http://localhost:4173` per testare il build di produzione
3. Modifica i file in `src/`
4. Usa `npm run build` per verificare che tutto funzioni
5. Committa le tue modifiche con Git

## 📞 Supporto

Se hai problemi:
1. Verifica che tutte le dipendenze siano installate: `npm install`
2. Controlla che non ci siano errori di lint: `npm run lint`
3. Testa il build: `npm run build`
4. Se il problema persiste, controlla i log del terminale

---

**Nota**: Questo setup ti permette di lavorare completamente in locale senza dipendere da servizi cloud per il build e il deploy.

---

🔄 **Deploy Ibrido Testato**: Sistema configurato e pronto per l'uso!
