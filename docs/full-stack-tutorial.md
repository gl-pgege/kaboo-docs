# Full-stack tutorial

Wire all three libraries into one runnable app: YAML agents served over AG-UI
(**kaboo-workflows**), persisted and replayed in a CopilotKit runtime
(**kaboo-runtime**), and rendered as live hierarchical activity in React
(**kaboo-react**), backed by Postgres.

This tutorial follows the
[kaboo-workflows-demo](https://github.com/gl-pgege/kaboo-docs/tree/main/examples/kaboo-workflows-demo)
example shipped in this repo — a market-research assistant with delegated
sub-agents, human-in-the-loop approvals, and full replay across reloads. Clone
this repo and work from `examples/kaboo-workflows-demo/` to follow along with
real, validated code.

## Architecture & ports

```mermaid
flowchart LR
    B["Browser"] -->|":3000"| F["Vite dev + kaboo-react"]
    F -->|"/api/copilotkit → :4000"| BE["NestJS + kaboo-runtime"]
    F -->|"/api/manifest → :8080"| P["pipeline (kaboo-workflows)"]
    BE -->|"HttpAgent → :8080 /invocations"| P
    BE <-->|"persist / replay"| DB[("Postgres :5432")]
```

| Service | Tech | Port |
|---------|------|------|
| frontend | Vite + React 19 + kaboo-react | 3000 |
| backend | NestJS + `@copilotkit/runtime` v2 + kaboo-runtime | 4000 |
| pipeline | Python + kaboo-workflows (`kaboo-serve`) | 8080 |
| postgres | `postgres:16-alpine` (db `market_research`) | 5432 |

The Vite dev server proxies `/api/copilotkit` → `:4000` and `/api/manifest` →
`:8080`, so the browser only ever talks to `:3000`.

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/) (Python 3.12+) for the pipeline.
- Node 20+ with **Yarn 4 (Berry)** — run `corepack enable` once.
- Docker (for Postgres).
- An [OpenRouter](https://openrouter.ai/) API key.

## 1. Configure `.env`

```bash
cp .env.example .env
```

```
OPENROUTER_API_KEY=sk-or-...
DATABASE_URL=postgresql://demo:demo@localhost:5432/market_research
```

## 2. Start Postgres

```bash
docker compose up -d postgres
```

`PostgresThreadStore` is what makes refresh-mid-run and refresh-post-run replay
work. Omit `DATABASE_URL` and the backend falls back to `InMemoryThreadStore`
(no cross-reload replay).

## 3. Pipeline — kaboo-workflows on :8080

```bash
cd pipeline-service
export $(grep -v '^#' ../.env | xargs)
uv run kaboo-serve config.yaml --host 0.0.0.0 --port 8080
```

`config.yaml` defines the `research_pipeline` orchestration (a `delegate` with
entry `coordinator` → `research_team{researcher, fact_checker}`, `analyst`,
`writer`) and serves it as AG-UI SSE at `/invocations`, plus `/ping` and
`/manifest`. This is the whole of kaboo-workflows: define agents in YAML, serve
them. See its
[getting started](https://gl-pgege.github.io/kaboo-workflows/getting-started/).

## 4. Backend — kaboo-runtime on :4000

```bash
cd backend
PORT=4000 \
PIPELINE_SERVICE_URL=http://localhost:8080/invocations \
DATABASE_URL=postgresql://demo:demo@localhost:5432/market_research \
yarn start
```

The NestJS backend mounts a `@copilotkit/runtime` v2 endpoint whose
`AgentRunner` is kaboo-runtime's `KabooAgentRunner`. It connects to the pipeline
with an `HttpAgent`, records every AG-UI event to the `PostgresThreadStore`, and
replays the log on reconnect. Look for the log line
`kaboo-runtime persistence: PostgresThreadStore`. See its
[concepts](https://gl-pgege.github.io/kaboo-runtime/concepts/).

## 5. Frontend — kaboo-react on :3000

```bash
cd frontend
yarn dev
```

The React app wraps CopilotKit in `KabooProvider` and renders the chat with
`KabooMessageView`, materializing `ACTIVITY_SNAPSHOT` events into a hierarchical
activity tree with drill-down and inline HITL. See its
[concepts](https://gl-pgege.github.io/kaboo-react/concepts/).

Then open <http://localhost:3000>.

## 6. Try it

- Ask **"Research the cloud GPU market and compare top providers"** and watch the
  coordinator delegate to the research team, analyst, and writer, with
  hierarchical activity cards streaming live.
- **Human-in-the-loop:** the researcher gates a tool and can `ask_user`; approve
  or decline inline.
- **Replay:** refresh the page mid-run or post-run — the full event log restores
  from Postgres.

## How each library fits

| Library | Role in the demo |
|---------|------------------|
| [kaboo-workflows](https://gl-pgege.github.io/kaboo-workflows/) | `config.yaml` defines models/agents/tools/MCP/orchestrations; `kaboo-serve` serves AG-UI SSE. |
| [kaboo-runtime](https://gl-pgege.github.io/kaboo-runtime/) | CopilotKit `AgentRunner` + `PostgresThreadStore` persist and replay the event log. |
| [kaboo-react](https://gl-pgege.github.io/kaboo-react/) | Renders the stream as a live activity tree with drill-down + HITL. |

New to the pieces? Start with [Start here](start-here.md) to pick a single-library
path first.
