# Guida Cursor: Build locale e deploy su Netlify (senza minuti di build)

Questa guida permette a un agente Cursor di collegarsi a Netlify e pubblicare una build locale della cartella `dist/`, evitando i minuti di build di Netlify. Tutte le credenziali e le variabili necessarie sono già presenti nella repo.

## Prerequisiti
- Node.js installato (la repo è testata anche con Node 20+)
- Netlify CLI (usiamo `npx` così non serve installazione globale)
- Cartella di lavoro: root del progetto (es. `/workspace/elevenbase`)

## Dove sono le credenziali
- Token e Site ID Netlify: `netlify-setup.md`
- Variabili Vite per Supabase: `supabase/project-config.md` (fallback in `netlify-setup.md`)

## Build di produzione locale
Esegue `npm ci`, crea `.env.production` con le variabili Vite e compila in `dist/`.

```bash
set -euo pipefail
cd /workspace/elevenbase

# Aggiorna main
git fetch --all --prune
if git show-ref --verify --quiet refs/remotes/origin/main; then
  git checkout -B main origin/main
else
  git checkout main || git checkout -b main
fi

# Crea .env.production (prende le env dalla documentazione presente in repo)
if [ ! -f .env.production ]; then
  SUPABASE_URL=$(grep -E "^\s*VITE_SUPABASE_URL=" -m1 supabase/project-config.md | sed -E 's/^\s*VITE_SUPABASE_URL=//') || true
  [ -n "${SUPABASE_URL:-}" ] || SUPABASE_URL=$(grep -E "^\s*VITE_SUPABASE_URL=" -m1 netlify-setup.md | sed -E 's/^\s*VITE_SUPABASE_URL=//') || true

  SUPABASE_ANON_KEY=$(grep -E "^\s*VITE_SUPABASE_ANON_KEY=" -m1 supabase/project-config.md | sed -E 's/^\s*VITE_SUPABASE_ANON_KEY=//') || true
  [ -n "${SUPABASE_ANON_KEY:-}" ] || SUPABASE_ANON_KEY=$(grep -E "^\s*VITE_SUPABASE_ANON_KEY=" -m1 netlify-setup.md | sed -E 's/^\s*VITE_SUPABASE_ANON_KEY=//') || true

  if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
    echo "ERROR: missing VITE_SUPABASE_* envs" >&2; exit 1
  fi

  printf "VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n" \
    "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > .env.production
fi

# Install e build
npm ci --no-audit --no-fund
npm run build
# Artefatti disponibili in: dist/
```

## Deploy diretto su Netlify (senza minuti di build)
Pubblica la cartella `dist/` in produzione usando le credenziali presenti in `netlify-setup.md`.

```bash
set -euo pipefail
cd /workspace/elevenbase
[ -d dist ] || { echo "Build mancante: esegui prima npm run build" >&2; exit 1; }

NETLIFY_AUTH_TOKEN=$(grep -E "^\s*NETLIFY_AUTH_TOKEN=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_AUTH_TOKEN=//')
NETLIFY_SITE_ID_PRODUCTION=$(grep -E "^\s*NETLIFY_SITE_ID_PRODUCTION=" -m1 netlify-setup.md | sed -E 's/^\s*NETLIFY_SITE_ID_PRODUCTION=//')
[ -n "${NETLIFY_AUTH_TOKEN:-}" ] || { echo "Token Netlify mancante" >&2; exit 1; }
[ -n "${NETLIFY_SITE_ID_PRODUCTION:-}" ] || { echo "Site ID Netlify mancante" >&2; exit 1; }

npx --yes netlify-cli@17 deploy \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --site "$NETLIFY_SITE_ID_PRODUCTION" \
  --dir dist \
  --prod \
  --message "Local build via Cursor $(date -Iseconds)"
```

### Deploy preview (non-prod)
Per pubblicare come anteprima e non alterare il prod (utile per PR/test):

```bash
npx --yes netlify-cli@17 deploy \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --site "$NETLIFY_SITE_ID_PRODUCTION" \
  --dir dist \
  --message "Preview via Cursor $(date -Iseconds)"
```

## Collegare il repo al sito una volta sola (opzionale)
Per evitare di passare `--site` ogni volta, si può linkare la directory al sito.

```bash
npx --yes netlify-cli@17 link --id "$NETLIFY_SITE_ID_PRODUCTION"
# poi basta: npx netlify-cli deploy --dir dist --prod
```

## Config di riferimento
- `netlify.toml`: build command `npm run build`, publish `dist`, `NODE_VERSION = 20`
- `.netlify/netlify.toml`: headers, redirects e publish path
- `vite.config.ts`: build con Vite (React)

## Note operative
- Non stampare i valori delle credenziali nei log; estraili e usali direttamente.
- Le variabili `.env.*` sono già ignorate da Git (`.gitignore`).
- In caso di branch protection su `main`, preferire deploy manuale (come sopra) oppure PR.

## One-liner per agente Cursor
Esegue build e deploy prod in modo non interattivo, usando i file di repo.

```bash
bash -lc '
set -euo pipefail
cd /workspace/elevenbase

git fetch --all --prune
if git show-ref --verify --quiet refs/remotes/origin/main; then git checkout -B main origin/main; else git checkout main || git checkout -b main; fi

if [ ! -f .env.production ]; then 
  SUPABASE_URL=$(grep -E "^\s*VITE_SUPABASE_URL=" -m1 supabase/project-config.md | sed -E "s/^\s*VITE_SUPABASE_URL=//") || true
  [ -n "${SUPABASE_URL:-}" ] || SUPABASE_URL=$(grep -E "^\s*VITE_SUPABASE_URL=" -m1 netlify-setup.md | sed -E "s/^\s*VITE_SUPABASE_URL=//") || true
  SUPABASE_ANON_KEY=$(grep -E "^\s*VITE_SUPABASE_ANON_KEY=" -m1 supabase/project-config.md | sed -E "s/^\s*VITE_SUPABASE_ANON_KEY=//") || true
  [ -n "${SUPABASE_ANON_KEY:-}" ] || SUPABASE_ANON_KEY=$(grep -E "^\s*VITE_SUPABASE_ANON_KEY=" -m1 netlify-setup.md | sed -E "s/^\s*VITE_SUPABASE_ANON_KEY=//") || true
  printf "VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n" "$SUPABASE_URL" "$SUPABASE_ANON_KEY" > .env.production
fi

npm ci --no-audit --no-fund
npm run build

NETLIFY_AUTH_TOKEN=$(grep -E "^\s*NETLIFY_AUTH_TOKEN=" -m1 netlify-setup.md | sed -E "s/^\s*NETLIFY_AUTH_TOKEN=//")
NETLIFY_SITE_ID_PRODUCTION=$(grep -E "^\s*NETLIFY_SITE_ID_PRODUCTION=" -m1 netlify-setup.md | sed -E "s/^\s*NETLIFY_SITE_ID_PRODUCTION=//")
[ -n "${NETLIFY_AUTH_TOKEN:-}" ] && [ -n "${NETLIFY_SITE_ID_PRODUCTION:-}" ]

npx --yes netlify-cli@17 deploy --auth "$NETLIFY_AUTH_TOKEN" --site "$NETLIFY_SITE_ID_PRODUCTION" --dir dist --prod --message "Local build via Cursor $(date -Iseconds)" | cat
'
```