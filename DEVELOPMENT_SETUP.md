# 🚀 CA de Rissi Hub - Development Environment Setup

Questo documento descrive come configurare e utilizzare l'ambiente di sviluppo completo per il progetto CA de Rissi Hub.

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js 18+** e **npm**
- **Git**
- **Docker** (per Supabase locale)
- **Supabase CLI** (verrà installato automaticamente)

## 🚀 Setup Rapido

### 1. Clona il repository
```bash
git clone <repository-url>
cd ca-de-rissi-hub
```

### 2. Setup automatico
```bash
# Rendi eseguibili gli script
chmod +x scripts/*.sh

# Esegui il setup automatico
./scripts/setup-dev.sh
```

### 3. Avvia l'ambiente completo
```bash
npm run dev:full
```

## 🛠️ Comandi Principali

### Sviluppo
```bash
npm run dev              # Solo frontend
npm run dev:full         # Frontend + Supabase + Functions
npm run dev:supabase     # Solo Supabase
```

### Build
```bash
npm run build            # Build produzione
npm run build:dev        # Build sviluppo
npm run preview          # Preview build
```

### Testing
```bash
npm run test             # Test unitari
npm run test:ui          # Test con UI
npm run test:coverage    # Test con coverage
```

### Qualità del Codice
```bash
npm run lint             # ESLint
npm run lint:fix         # Fix automatico ESLint
npm run format           # Prettier
npm run type-check       # TypeScript check
npm run check:all        # Tutti i controlli
```

### Database e Supabase
```bash
npm run supabase:start   # Avvia Supabase locale
npm run supabase:stop    # Ferma Supabase
npm run supabase:status  # Status Supabase
npm run supabase:reset   # Reset database locale
npm run supabase:db:push # Push modifiche database
npm run supabase:db:diff # Mostra differenze database
```

### Git e Commits
```bash
npm run commit           # Commit interattivo
```

## 🗄️ Gestione Database

### Script di Gestione
```bash
# Gestione completa del database
./scripts/db-manage.sh [comando]

# Comandi disponibili:
./scripts/db-manage.sh start           # Avvia Supabase
./scripts/db-manage.sh stop            # Ferma Supabase
./scripts/db-manage.sh status          # Mostra status
./scripts/db-manage.sh reset           # Reset database
./scripts/db-manage.sh seed            # Popola con dati di esempio
./scripts/db-manage.sh backup          # Crea backup
./scripts/db-manage.sh restore <file>  # Ripristina da backup
./scripts/db-manage.sh diff            # Mostra differenze
./scripts/db-manage.sh push            # Push modifiche
./scripts/db-manage.sh pull            # Pull modifiche
./scripts/db-manage.sh migrate         # Applica migrazioni
./scripts/db-manage.sh new-migration <nome>  # Nuova migrazione
./scripts/db-manage.sh functions       # Serve Edge Functions
./scripts/db-manage.sh studio          # Apri Supabase Studio
./scripts/db-manage.sh logs            # Mostra log
```

### Workflow Database
1. **Sviluppo Locale**: Modifica schema in `supabase/migrations/`
2. **Test Locale**: `npm run supabase:reset` per testare
3. **Commit**: `npm run commit` per commit standardizzato
4. **Push**: `npm run supabase:db:push` per applicare modifiche

## 🚀 Deployment

### Script di Deployment
```bash
# Deployment staging
./scripts/deploy.sh staging

# Deployment produzione
./scripts/deploy.sh production

# Deployment forzato (ignora modifiche non committate)
./scripts/deploy.sh production --force
```

### Workflow Deployment
1. **Staging**: Test automatico con build dev
2. **Produzione**: Conferma manuale + build produzione
3. **Backup**: Backup automatico prima del deployment
4. **Verifica**: Checklist post-deployment

## 📁 Struttura Progetto

```
ca-de-rissi-hub/
├── src/                    # Codice sorgente
│   ├── components/         # Componenti React
│   ├── pages/             # Pagine dell'app
│   ├── hooks/             # Custom hooks
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility e configurazioni
│   ├── integrations/      # Integrazioni esterne
│   └── test/              # Setup test
├── supabase/              # Configurazione Supabase
│   ├── migrations/        # Migrazioni database
│   ├── functions/         # Edge Functions
│   └── config.toml        # Configurazione
├── scripts/               # Script di utilità
│   ├── setup-dev.sh       # Setup ambiente
│   ├── deploy.sh          # Script deployment
│   └── db-manage.sh       # Gestione database
├── .vscode/               # Configurazione VS Code
├── package.json           # Dipendenze e script
├── Makefile               # Comandi rapidi
└── README.md              # Documentazione
```

## 🔧 Configurazione VS Code

### Estensioni Consigliate
- **Prettier** - Formattazione codice
- **ESLint** - Linting JavaScript/TypeScript
- **Tailwind CSS IntelliSense** - Autocompletamento CSS
- **Supabase** - Integrazione Supabase
- **GitLens** - Git avanzato
- **Test Explorer** - Gestione test

### Task Predefiniti
- `Ctrl+Shift+P` → "Tasks: Run Task"
- **Start Development**: Avvia ambiente completo
- **Start Supabase**: Solo database locale
- **Run Tests**: Esegue test con UI
- **Lint and Format**: Controlli qualità

## 🧪 Testing

### Configurazione Test
- **Vitest** per test unitari
- **jsdom** per ambiente DOM
- **Testing Library** per test React
- **Coverage** integrato

### Esecuzione Test
```bash
npm run test              # Test in modalità watch
npm run test:ui           # Interfaccia grafica
npm run test:coverage     # Report coverage
```

## 📝 Git Workflow

### Commit Standardizzati
```bash
npm run commit
```

Tipi di commit disponibili:
- `feat`: Nuove funzionalità
- `fix`: Bug fixes
- `docs`: Documentazione
- `style`: Formattazione
- `refactor`: Refactoring
- `test`: Test
- `chore`: Manutenzione
- `supabase`: Modifiche database
- `db`: Operazioni database
- `ui`: Interfaccia utente

### Pre-commit Hooks
- **ESLint**: Controllo qualità codice
- **Prettier**: Formattazione automatica
- **TypeScript**: Controllo tipi
- **Lint-staged**: Solo sui file modificati

## 🌍 Variabili d'Ambiente

### File .env
Copia `.env.example` in `.env` e configura:

```bash
# Supabase
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Development
VITE_APP_ENV=development
VITE_API_URL=http://localhost:54321

# Supabase CLI
SUPABASE_ACCESS_TOKEN=your_token
SUPABASE_DB_PASSWORD=your_password

# OpenAI (per Supabase AI)
OPENAI_API_KEY=your_key
```

## 🚨 Troubleshooting

### Problemi Comuni

#### Supabase non si avvia
```bash
# Verifica Docker
docker info

# Reset completo
npm run supabase:stop
npm run supabase:reset
npm run supabase:start
```

#### Dipendenze corrotte
```bash
npm run clean:all
npm run install:clean
```

#### Errori TypeScript
```bash
npm run type-check
npm run lint:fix
```

#### Database out of sync
```bash
npm run supabase:db:diff
npm run supabase:db:push
```

## 📚 Risorse Utili

- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## 🤝 Contribuire

1. Crea un branch per la feature
2. Sviluppa e testa localmente
3. Esegui tutti i controlli: `npm run check:all`
4. Commit standardizzato: `npm run commit`
5. Push e crea Pull Request

## 📞 Supporto

Per problemi o domande:
- Controlla la documentazione
- Verifica i log: `npm run supabase:logs`
- Controlla lo status: `npm run supabase:status`
- Consulta il team di sviluppo

---

**Happy Coding! 🎉**