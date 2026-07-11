# AGENTS.md

Guidance for AI agents working in **kaboo-workflows-demo**. Humans: see
[CONTRIBUTING.md](./CONTRIBUTING.md). Stack-wide model:
[Contributing to the kaboo stack](https://gl-pgege.github.io/kaboo-docs/contributing/).

## What this is

An nx + Yarn 4 workspace (`backend`, `frontend`) plus a `pipeline-service` uv
project, assembling all three kaboo libraries into one runnable market-research
demo. Docs-only changes here should keep the README's ports, env, and startup
commands faithful to the source.

## Start each service (exact commands + env)

```bash
# 0. Postgres
docker compose up -d postgres

# 1. Pipeline (kaboo-workflows) :8080 — needs OPENROUTER_API_KEY + DATABASE_URL
cd pipeline-service
export $(grep -v '^#' ../.env | xargs)
uv run kaboo-serve config.yaml --host 0.0.0.0 --port 8080

# 2. Backend (CopilotKit runtime + kaboo-runtime) :4000
cd backend
PORT=4000 \
PIPELINE_SERVICE_URL=http://localhost:8080/invocations \
DATABASE_URL=postgresql://demo:demo@localhost:5432/market_research \
yarn start

# 3. Frontend (Vite + kaboo-react) :3000
cd frontend
yarn dev
```

Ports: frontend `:3000`, backend `:4000`, pipeline `:8080`, Postgres `:5432`.
The Vite proxy sends `/api/copilotkit` → `:4000` and `/api/manifest` → `:8080`
(stripping `/api`).

## Conventions

- Backend store selection is by `DATABASE_URL`: set → `PostgresThreadStore`
  (replay works); unset → `InMemoryThreadStore`.
- The `backend/tsconfig.json` `paths` block pins single `.d.ts` files for
  `@ag-ui/client` / `@copilotkit/runtime/v2` / `rxjs` because kaboo-runtime is a
  `file:` link bringing duplicate types. Don't remove it until the demo moves to
  published library versions and `nest build` still passes.

## Guardrails

- **Never commit real secrets.** `.env` contains a live OpenRouter key; it is
  gitignored. Always redact keys in docs; edit `.env.example` (placeholder only).
- Never change library or demo source to "fix" docs — this plan is docs-only.
- Keep URLs pointed at `gl-pgege/*` repos and the `gl-pgege.github.io` Pages
  sites.

## Definition of done

All 3 services boot and the 4 smoke checks return the expected codes:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/             # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/             # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/invocations  # 405
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/manifest # 200
```

A real prompt streams AG-UI activity and survives a page refresh (Postgres
replay).

## Related

- [kaboo-workflows](https://github.com/gl-pgege/kaboo-workflows)
- [kaboo-runtime](https://github.com/gl-pgege/kaboo-runtime)
- [kaboo-react](https://github.com/gl-pgege/kaboo-react)
- [kaboo-docs (umbrella landing)](https://github.com/gl-pgege/kaboo-docs)
