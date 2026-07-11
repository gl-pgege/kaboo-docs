# kaboo-workflows-demo

> A runnable, end-to-end reference for the **kaboo stack** — a market-research
> assistant that wires together all three libraries:
> [kaboo-workflows](https://github.com/gl-pgege/kaboo-workflows) (Python
> multi-agent orchestration), [kaboo-runtime](https://github.com/gl-pgege/kaboo-runtime)
> (CopilotKit runtime persistence), and
> [kaboo-react](https://github.com/gl-pgege/kaboo-react) (agent-activity UI).

## What it is

A market-research assistant demonstrating the whole kaboo stack end-to-end:

- a **YAML-defined multi-agent pipeline** (kaboo-workflows) served as AG-UI SSE,
- a **CopilotKit runtime with Postgres-backed persistence** (kaboo-runtime) that
  records the full event log and replays it on reload,
- a **Vite/React CopilotKit UI** with hierarchical agent-activity views and
  drill-down (kaboo-react).

Ask it to research a market and watch a coordinator delegate to a research team,
an analyst, and a writer — with live, nested activity cards, human-in-the-loop
approvals, and full replay across page reloads.

## Architecture & ports

```
Browser ── Vite dev (:3000) ──/api/copilotkit──> backend NestJS (:4000)
   │                        └─/api/manifest────> pipeline (:8080) /manifest
   │                                              (CopilotKit runtime + kaboo-runtime)
   │                                                     │
   │                                             HttpAgent -> pipeline (:8080) /invocations
   │                                                     │            (kaboo-workflows AG-UI SSE)
   │                                                     ▼
   │                                             Postgres (:5432, market_research)
   └── React UI uses kaboo-react (KabooProvider, DrillDetailView, GlassTabs, KabooMessageView)
```

| Service | Tech | Provides | Port |
|---|---|---|---|
| frontend | Vite + React 19 + kaboo-react | CopilotKit chat UI + hierarchical activity/drill views | 3000 |
| backend | NestJS + @copilotkit/runtime v2 + kaboo-runtime | CopilotKit runtime, HttpAgent → pipeline, Postgres persistence/replay | 4000 |
| pipeline-service | Python + kaboo-workflows | YAML agents → AG-UI SSE (`/invocations`, `/ping`, `/manifest`) | 8080 |
| postgres | postgres:16-alpine | thread/event persistence (db `market_research`) | 5432 |

The frontend Vite dev server proxies `/api/copilotkit` → `:4000` and
`/api/manifest` → `:8080` (stripping the `/api` prefix), so the browser only ever
talks to `:3000`.

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/) (Python 3.12+) for the pipeline service.
- Node 20+ with **Yarn 4 (Berry)** — run `corepack enable` once; this is an nx +
  Yarn workspace (`backend`, `frontend`).
- Docker (for Postgres).
- An [OpenRouter](https://openrouter.ai/) API key.

## Configure `.env`

Copy the example and fill in your key:

```bash
cp .env.example .env
```

The root `.env` holds:

```
OPENROUTER_API_KEY=sk-or-...
DATABASE_URL=postgresql://demo:demo@localhost:5432/market_research
```

> `.env` is gitignored — never commit a real key.

## Run it (validated startup)

Run each service in its own terminal. This is the debuggable path that sets the
exact env each service needs.

```bash
# 0. Postgres via docker compose
#    (container kaboo-workflows-demo-postgres-1, postgres:16-alpine,
#     db market_research, user/pass demo/demo, healthcheck pg_isready)
docker compose up -d postgres

# 1. Pipeline (kaboo-workflows) on :8080
cd pipeline-service
export $(grep -v '^#' ../.env | xargs)     # OPENROUTER_API_KEY + DATABASE_URL
uv run kaboo-serve config.yaml --host 0.0.0.0 --port 8080
#   Entry orchestration: research_pipeline (delegate, entry=coordinator)
#     -> research_team{researcher, fact_checker}, analyst, writer
#   Also starts the MCP research server + mcp-postgres client.

# 2. Backend (CopilotKit runtime + kaboo-runtime) on :4000
cd backend
PORT=4000 \
PIPELINE_SERVICE_URL=http://localhost:8080/invocations \
DATABASE_URL=postgresql://demo:demo@localhost:5432/market_research \
yarn start               # nest start
#   Look for: "kaboo-runtime persistence: PostgresThreadStore"

# 3. Frontend (Vite + kaboo-react) on :3000
cd frontend
yarn dev                 # vite (port 3000, proxies /api/* per vite.config.ts)
```

Then open <http://localhost:3000>.

Notes:

- The root `yarn dev` (`nx run-many --target=serve --parallel=3`) starts
  everything at once, but the per-service commands above let you control each
  service's env and read its logs.
- If `DATABASE_URL` is omitted, the backend falls back to `InMemoryThreadStore`
  (no cross-reload replay). `PostgresThreadStore` is what makes refresh-mid-run
  and refresh-post-run replay work.

## What to try

- Ask **"Research the cloud GPU market and compare top providers"** — watch the
  coordinator delegate to the research team (researcher + fact_checker), analyst,
  and writer, with hierarchical activity cards streaming live.
- **Human-in-the-loop:** the researcher gates the `query_data` tool and can
  `ask_user`; approve or decline inline (the `config.test*.yaml` scenarios add
  parallel tool-call approvals).
- **Drill down:** click a sub-agent card to open its transcript (kaboo-react's
  `DrillDetailView` / `GlassTabs`).
- **Replay:** refresh the page mid-run and post-run — the Postgres-backed runtime
  replays the full event log (messages + tools + state + activity).

## How it maps to each library

- **kaboo-workflows** — `pipeline-service/config.yaml` defines the models, MCP
  servers/clients, agents, and orchestrations; `kaboo-serve` serves it as AG-UI
  SSE. Alternate scenarios live in `pipeline-service/config.*.yaml` (graph, swarm,
  nested, interrupt, graph_swarm) and `config.test1..test9_*.yaml` (nested HITL,
  swarm HITL, graph parallel, history, rejection, error, mixed, parallel,
  parallel-toplevel). Point `kaboo-serve` at any of them.
- **kaboo-runtime** — `backend/src/main.ts` builds
  `new CopilotRuntime({ agents: { research_pipeline: new HttpAgent({ url: pipelineUrl }) }, runner: createKabooRunner(store) })`
  where `store = DATABASE_URL ? new PostgresThreadStore({ dsn }) : new InMemoryThreadStore()`,
  mounted at `/api/copilotkit` via `createCopilotExpressHandler`.
- **kaboo-react** — `frontend/src/App.tsx` wraps the app in
  `KabooProvider runtimeUrl="/api/copilotkit"`, renders `CopilotChat` with
  `messageView={KabooMessageView}`, plus `DrillDetailView`, `GlassTabs`, and
  `useDrill`. The entry agent name comes from the pipeline's `/manifest`
  (`useManifest("/api/manifest")`).

See [How it wires to the libraries](#how-it-wires-to-the-libraries-development) for
the exact dependency links and the published-version switch checklist.

## Request / AG-UI event flow

```mermaid
sequenceDiagram
  participant U as Browser (kaboo-react)
  participant F as Vite dev :3000
  participant B as Backend :4000 (CopilotKit runtime + kaboo-runtime)
  participant P as Pipeline :8080 (kaboo-workflows)
  participant DB as Postgres :5432
  U->>F: GET /api/manifest
  F->>P: GET /manifest (proxy strips /api)
  P-->>U: { entry: "research_pipeline" }
  U->>F: POST /api/copilotkit (user message, threadId)
  F->>B: proxy -> CopilotRuntime
  B->>DB: load thread event log (PostgresThreadStore)
  B->>P: POST /invocations (RunAgentInput, kaboo_history injected)
  P-->>B: AG-UI SSE (RUN_STARTED, TEXT/TOOL events, ACTIVITY_SNAPSHOT, RUN_FINISHED)
  B->>DB: persist event log
  B-->>U: streamed AG-UI events -> kaboo-react renders chat + activity
  Note over U,B: On reload, kaboo-runtime replays the stored log from DB
```

## How it wires to the libraries

The demo consumes the libraries as published packages:

| Consumer | Package | Dependency |
|---|---|---|
| `backend/package.json` | `@pgege/kaboo-runtime` (npm) | `"@pgege/kaboo-runtime": "^0.1.0"` |
| `frontend/package.json` | `@pgege/kaboo-react` (npm) | `"@pgege/kaboo-react": "^0.1.0"` |
| `pipeline-service/pyproject.toml` | `kaboo-workflows` (PyPI) | `[tool.uv.sources] kaboo-workflows = { path = "../../kaboo-workflows", editable = true }` |

> The npm packages are scoped under `@pgege`. Until the libraries are published to
> the registries, install them locally instead — e.g. `yarn link` the built
> `@pgege/kaboo-*` packages, or point each dependency at a local build
> (`file:<path-to-repo>`). The pipeline still resolves `kaboo-workflows` from a
> local editable path; swap it for the PyPI release once published.

### The `backend/tsconfig.json` paths workaround

```json
"paths": {
  "@ag-ui/client": ["./node_modules/@ag-ui/client/dist/index.d.ts"],
  "@copilotkit/runtime/v2": ["./node_modules/@copilotkit/runtime/dist/v2/index.d.cts"],
  "rxjs": ["./node_modules/rxjs/dist/types/index.d.ts"]
}
```

**Why:** when `@pgege/kaboo-runtime` is linked locally (`file:` / `yarn link`), it
brings its own copies of `@ag-ui/client` / `@copilotkit/runtime` / `rxjs`. Without
pinning, TypeScript sees duplicate type declarations for the same package and
`nest build` / typecheck fails on incompatible-but-identical types. These `paths`
entries force a single canonical `.d.ts` per package. Installing from the registry
dedupes these, so the workaround can be removed once you consume the published
versions (verify `nest build` + typecheck first). The frontend does the runtime
analogue in `vite.config.ts` with
`resolve.dedupe: ["react", "react-dom", "@copilotkit/react-core"]`.

## Troubleshooting

- **Port already in use:** `lsof -ti:8080 | xargs kill` (same for 3000/4000). The
  pipeline's `GET /` returns 404 by design; `GET /invocations` returns 405
  (POST-only) — both mean the route is up.
- **Postgres not healthy:** `docker compose ps` / `docker compose logs postgres`;
  the container is `kaboo-workflows-demo-postgres-1`.
- **Backend logs `InMemoryThreadStore` instead of `PostgresThreadStore`:**
  `DATABASE_URL` wasn't exported for the backend process.
- **Frontend can't reach the manifest:** confirm the pipeline is on :8080 and the
  Vite proxy rewrite is intact.
- **MCP `mcp-postgres` client fails:** it runs `npx -y mcp-postgres@latest` and
  needs `DATABASE_URL` exported for the pipeline process.

## The kaboo stack

| Repo | Role | Docs |
|---|---|---|
| [kaboo-workflows](https://github.com/gl-pgege/kaboo-workflows) | Python YAML multi-agent orchestration → AG-UI SSE | <https://gl-pgege.github.io/kaboo-workflows/> |
| [kaboo-runtime](https://github.com/gl-pgege/kaboo-runtime) | CopilotKit runtime persistence (AgentRunner + ThreadStore) | <https://gl-pgege.github.io/kaboo-runtime/> |
| [kaboo-react](https://github.com/gl-pgege/kaboo-react) | React components/hooks for agent-activity UI | <https://gl-pgege.github.io/kaboo-react/> |
| **kaboo-workflows-demo** | this repo — the assembled end-to-end reference | — |

Umbrella landing: <https://gl-pgege.github.io/kaboo-docs/>.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (humans) and [AGENTS.md](./AGENTS.md)
(AI contributors).
