# Contributing to kaboo-workflows-demo

Thanks for contributing! This guide is for human contributors. AI agents should
also read [AGENTS.md](./AGENTS.md). This demo is part of the kaboo stack — see the
[cross-stack contributing guide](https://gl-pgege.github.io/kaboo-docs/contributing/).

## Workspace layout

This is an [nx](https://nx.dev/) + **Yarn 4 (Berry)** workspace plus a separate
Python service:

- `backend/` — NestJS CopilotKit runtime (Yarn workspace).
- `frontend/` — Vite + React UI (Yarn workspace).
- `pipeline-service/` — Python kaboo-workflows service (its own `uv` project).

## Run the services

Run `corepack enable` once, then follow the
[validated startup in the README](./README.md#run-it-validated-startup): Postgres
via `docker compose up -d postgres`, then the pipeline, backend, and frontend.

Dev commands:

```bash
yarn dev        # nx run-many serve (all workspaces at once)
yarn lint       # nx run-many lint
yarn db:setup   # provision the backend database
```

Or run each service individually with the env shown in the README (this is the
debuggable path).

## Add or switch a workflow config

The pipeline is driven by a YAML file. Alternate scenarios live at
`pipeline-service/config*.yaml`. Point `kaboo-serve` at one:

```bash
cd pipeline-service
uv run kaboo-serve config.swarm.yaml --host 0.0.0.0 --port 8080
```

## Bump a library version

The demo consumes the libraries locally via `file:` / `uv` path sources. To move
to published versions, follow the
[switch checklist](./README.md#switching-to-published-versions) in the README.

## Guardrails

- **Never commit secrets.** `.env` holds a live OpenRouter key and is gitignored;
  keep it that way and always redact keys in docs. Use `.env.example` as the
  template.
- Keep the README's startup commands and port map in sync with the source
  (`vite.config.ts`, `backend/src/main.ts`, `docker-compose.yaml`).

## Definition of done

All three services boot and the four endpoint smoke checks pass:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/             # 200 (frontend)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/             # 200 (backend)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/invocations  # 405 (route up, POST-only)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/manifest # 200 (proxy -> pipeline /manifest)
```
