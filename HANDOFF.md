# kaboo stack — expert handoff

> This document is a **superset** of the prior kaboo handoff: every original section (0–13, including all tables and publish-status caveats) is preserved and expanded, and four new tracks (Declarative Generative UI, a data-answering refactor track, a categorized footguns section, and a contributor "when you find a gap" guide) are added on top. Facts were verified against the four local repos before writing; see [Appendix B: Corrections applied](#appendix-b-corrections-applied-during-verification).

## Table of contents

- [0. Your role](#0-your-role)
- [1. The ecosystem at a glance](#1-the-ecosystem-at-a-glance)
- [2. Five mental models](#2-five-mental-models)
- [3. CopilotKit / AG-UI primer](#3-copilotkit--ag-ui-primer)
- [4. kaboo-workflows (Python — orchestration + serving)](#4-kaboo-workflows-python--orchestration--serving)
- [5. @pgege/kaboo-runtime (Node/TS — persistence + orchestration)](#5-pgegekaboo-runtime-nodets--persistence--orchestration)
- [6. @pgege/kaboo-react (React/TS — UI)](#6-pgegekaboo-react-reactts--ui)
- [7. End-to-end composition](#7-end-to-end-composition)
- [8. Security posture (consolidated)](#8-security-posture-consolidated)
- [9. Configurability surface](#9-configurability-surface)
- [10. Publish status](#10-publish-status)
- [11. Playbook: build a new app on this stack](#11-playbook-build-a-new-app-on-this-stack)
- [12. Footguns (categorized)](#12-footguns-categorized)
- [13. Where to look](#13-where-to-look)
- [14. Declarative Generative UI](#14-declarative-generative-ui)
- [15. Refactor track — agents that answer questions from data they query](#15-refactor-track--agents-that-answer-questions-from-data-they-query)
- [16. Contributor guide — "when you find a gap"](#16-contributor-guide--when-you-find-a-gap)
- [Appendix A: Verified repo reference (URLs, paths, commands)](#appendix-a-verified-repo-reference-urls-paths-commands)
- [Appendix B: Corrections applied during verification](#appendix-b-corrections-applied-during-verification)

---

## 0. Your role

You are the expert for a three-library ecosystem for building modular, layered, secure, configurable AI applications on top of CopilotKit + AG-UI. The design commitment across all three libraries is **separation of concerns by layer**: configuration/orchestration, persistence/runtime, and UI are independent, each swappable, each with its own extension seam. Preserve that separation in everything you propose.

Concretely, the three seams you must never collapse:

| Layer | Library | Extension seam | Never do |
|---|---|---|---|
| Configuration / orchestration | kaboo-workflows | YAML (agents/models/MCP/orchestration) + `${VAR}` + multi-file merge | Don't hardcode runtime/persistence concerns into YAML resolvers |
| Persistence / runtime | @pgege/kaboo-runtime | `ThreadStore` (7-method contract) + `onStoreError` | Don't add an HTTP layer or leak persistence into UI |
| UI | @pgege/kaboo-react | `structuredRenderers` + `interruptRenderers` + CSS-var theming | Don't talk to the Python server directly; don't reduce raw AG-UI client-side |

When someone proposes a change, your first question is always **"which layer does this belong to?"** (see [§16](#16-contributor-guide--when-you-find-a-gap)).

---

## 1. The ecosystem at a glance

- **Orchestration**: `kaboo-workflows` (Python, PyPI live at **0.11.0**; **0.13.0** committed locally): YAML → multi-agent orchestration; serves AG-UI SSE.
- **Persistence/runtime**: `@pgege/kaboo-runtime` (Node/TS, npm live at **0.1.1**; **0.2.0** committed locally): a CopilotKit `AgentRunner` that persists/replays the AG-UI event log.
- **UI**: `@pgege/kaboo-react` (React/TS, npm live at **0.2.0**; **0.4.0** committed locally): renders the AG-UI activity stream as components.
- **Portal + demo**: `kaboo-docs` (MkDocs, GitHub Pages): umbrella docs + vendored `examples/kaboo-workflows-demo`.

The connective tissue is **AG-UI** — the open agent↔user event protocol (from a CopilotKit/LangChain partnership, CrewAI joining shortly after, now broadly adopted incl. Google ADK/A2UI, Microsoft, AWS Strands/AgentCore, Oracle, Mastra, Pydantic, Agno, LlamaIndex). Everything is one streamed event log; each library produces, persists, or renders that log. See <https://www.copilotkit.ai/generative-ui-spectrum>.

**Flow:**

```text
Browser (kaboo-react, Controlled Gen UI)
  → AG-UI events over CopilotKit
    → Node server (CopilotKit runtime + kaboo-runtime AgentRunner + ThreadStore)
       proxies runs, persists event log, replays on reconnect
      → HttpAgent → /invocations (AG-UI SSE)
        → Python server (kaboo-workflows: YAML → strands agents, emits AG-UI stream)
          → LLM providers / MCP servers / tools
```

| Repo | Language / package | Version | Publish status | Docs site |
|---|---|---|---|---|
| kaboo-workflows | Python — `kaboo-workflows` | 0.13.0 (manifest) | 0.11.0 live on PyPI; 0.12.0/0.13.0 tagged, push to publish | <https://gl-pgege.github.io/kaboo-workflows/> |
| kaboo-runtime | Node/TS — `@pgege/kaboo-runtime` | 0.2.0 (manifest) | 0.1.1 live on npm; 0.2.0 ready | <https://gl-pgege.github.io/kaboo-runtime/> |
| kaboo-react | React/TS — `@pgege/kaboo-react` | 0.4.0 (manifest) | 0.2.0 live on npm; 0.4.0 ready | <https://gl-pgege.github.io/kaboo-react/> |
| kaboo-docs | MkDocs umbrella + demo | — | GitHub Pages | <https://gl-pgege.github.io/kaboo-docs/> |

---

## 2. Five mental models

1. **The event log is the source of truth.** kaboo-runtime persists the full AG-UI event stream verbatim (no compaction). Messages, current state, and the activity tree are all *derived* from that log — never stored as competing authorities. (`kaboo-runtime/src/state.ts`, `kaboo-runtime/src/store.ts`, `docs/concepts.md`.)
2. **`load()` returns plain strands objects.** kaboo-workflows is a *configuration* layer, not a runtime wrapper. YAML resolves to vanilla `strands.Agent` / `Swarm` / `Graph`. Kaboo's value-add (activity snapshots, interrupt bridging, `kaboo_history`) lives in the *serving adapter*, not on the objects.
3. **Streaming is the transport, always (when served).** The AG-UI HTTP surface is SSE-only by design; the whole activity/interrupt/history model rides one stream. Non-streaming is only possible by using kaboo-workflows *programmatically* (call the strands agent directly), which forfeits that wiring.
4. **kaboo-react is a Controlled Generative UI consumer.** It renders your fixed components (activity panel, tool rows, HITL cards) from the streamed events. It does *not* reduce raw AG-UI client-side — the backend emits pre-materialized `ACTIVITY_SNAPSHOT`s and the client renders them as-is.
5. **Server owns history.** Per-agent multi-agent history (`kaboo_history`) is folded into a trailing `STATE_SNAPSHOT` by workflows, persisted by runtime, and re-injected into the next run — the browser doesn't carry it.

---

## 3. CopilotKit / AG-UI primer

- **AG-UI = the horizontal event protocol**; "the frontend is just the transport for the events the agent streams." Event types: `RUN_STARTED`/`FINISHED`/`ERROR`, `TEXT_MESSAGE_*`, `TOOL_CALL_START`/`RESULT`, `STATE_SNAPSHOT`, `ACTIVITY_SNAPSHOT`, `CUSTOM`.
- **CopilotKit** provides the React SDK (`<CopilotKit>`, `CopilotChat`, `useAgent`, `useRenderTool`, `useInterrupt`) and a Node runtime (`CopilotRuntime`) whose runner (an `AgentRunner`) owns thread lifecycle — this is exactly the seam kaboo-runtime plugs into.
- **Generative UI Spectrum** (Controlled → Declarative → MCP Apps → Fully Open): kaboo is **Controlled today**. The Declarative band (agent-assembled catalogs) is the natural next step and is detailed in [§14](#14-declarative-generative-ui). If you later want portability into ChatGPT/Claude, that's the **MCP Apps** band (an MCP server bundling tools+UI, embedded via iframe) — a different rendering model than kaboo-react's native components, and it moves the "brains" into the MCP server rather than kaboo-workflows/kaboo-runtime.
- **AG-UI vs A2UI vs MCP-UI** (they compose, they don't compete): **AG-UI** is the agent↔user interaction protocol (how events stream in both directions); **A2UI** is a declarative UI *wire format* (a typed catalog of components + instances) that rides *on top of* AG-UI for the Declarative band; **MCP-UI** is the UI *delivery channel* for MCP servers (the surfaces at the MCP Apps point on the spectrum).

---

## 4. kaboo-workflows (Python — orchestration + serving)

**Purpose:** Declarative, YAML-driven multi-agent orchestration built on `strands-agents`, served to any AG-UI/CopilotKit frontend via SSE. Package name `kaboo-workflows`, author *Paul Gege &lt;pgege@goodlabs.studio&gt;*, license Apache-2.0, `requires-python >= 3.12` (`pyproject.toml`).

### 4.1 Layered architecture

```text
YAML source(s)
  → parse       (strip x-*, interpolate ${VARS}, rewrite ./paths)
  → merge       (deep-merge collections, last-wins singletons)
  → AppConfig   (pydantic validate)
  → cross-ref validate
  → resolve_infra (models, MCP servers/clients, cold lifecycle)
  → mcp_lifecycle.start()  (servers ready BEFORE agents)
  → resolve agents + orchestrations
  → entry       (plain strands object)
  → [serving] adapters/agui.py wraps entry as AG-UI SSE
```

Responsibility split:

- `strands-agents` = runtime.
- `ag-ui-strands` = single-agent → AG-UI bridge.
- `kaboo-workflows` = YAML wiring + a `StrandsMultiAgent` run loop for swarm/graph + interrupt-outcome injection + transcript repair + activity snapshots + client-driven history.

### 4.2 Public API (top-level `kaboo_workflows`)

Verified against `src/kaboo_workflows/__init__.py` (`__all__`):

| Symbol | Kind | Notes |
|---|---|---|
| `load(config) -> ResolvedConfig` | fn | Starts MCP; tear down via `resolved.mcp_lifecycle.stop()` (`config/resolvers/config.py`) |
| `load_config(config) -> AppConfig` | fn | Validate only |
| `resolve_infra`, `load_session` | fn | Infra + session resolution |
| `AppConfig`, `ConfigInput`, `ResolvedConfig`, `ResolvedInfra` | types | Config models |
| `OrchestrationBuilder` | class | Orchestration resolver |
| `ConfigurationError` → `SchemaValidationError`, `UnresolvedReferenceError`, `CircularDependencyError`, `ImportResolutionError` | errors | `ConfigurationError` subclasses `ValueError` (`exceptions.py`) |
| `EventQueue`, `make_event_queue`, `EventPublisher`, `StreamEvent`, `EventType` | streaming/hook | `wire.py`, `hooks/`, `types.py` |
| `MaxToolCallsGuard`, `StopGuard`, `ToolNameSanitizer` | guards | `hooks/` |
| `node_as_tool`, `node_as_async_tool`, `serialize_multiagent_result` | tools | `tools/` |
| `MCPLifecycle`, `create_mcp_client`, `create_mcp_server` | MCP | `mcp/` |
| `AnsiRenderer`, `cli_errors` | misc | `renderers/`, `utils/` |

Serving adapter (imported from `kaboo_workflows.adapters`, defined at `adapters/agui.py:816`):

```python
create_agui_app(
    config_path,
    *,
    endpoint="/invocations",
    ping_path="/ping",
    cors_origins=None,
    cors_allow_credentials=True,
) -> FastAPI
```

### 4.3 Configuration surface

Top-level YAML keys: `version`, `vars`, `x-*` (anchors, stripped), `models`, `mcp_servers`, `mcp_clients`, `agents` (**≥1 required**), `orchestrations`, `session_manager`, `entry` (**required**), `history` (global default), `log_level`.

- **Interpolation:** `${VAR}` / `${VAR:-default}`; lookup order per-file `vars` → env → default → error; full-string refs preserve type; circular refs detected.
- **Multi-file merge:** collections deep-merged left-to-right (dup name in the same section errors); singletons last-wins; each file's `vars` applied before merge; keys sanitized to `[A-Za-z0-9_-]{1,64}`.
- **Orchestration modes:** `delegate` | `swarm` | `graph` (timeouts, max handoffs/iterations, edges/conditions).
- **Structured output:** an agent may declare `output_schema: "module.path:PydanticModel"` (`config/schema.py:217`, resolved in `config/resolvers/agents.py:135`); the resolved schema's name flows to the UI as `outputSchemaName` (see [§6.4](#64-theming--extension) and [§15](#15-refactor-track--agents-that-answer-questions-from-data-they-query)).
- **Minimal config:** `agents: {assistant: {system_prompt: "..."}}` / `entry: assistant`.

### 4.4 Security & safety

- **CORS default permissive:** `allow_origins=["*"]`, `allow_credentials=True` (`adapters/agui.py:900–901`), and `kaboo-serve` binds `0.0.0.0:8080` (`serve.py:28`, `# noqa: S104 # nosec B104`) → **production must pass explicit `--cors-origin`** and front with TLS/reverse proxy.
- **HITL never silently approves:** a pending interrupt that isn't addressed defaults to `{"status": "cancelled"}` (`adapters/agui.py:176,187–188`; `adapters/_multiagent.py:291,298–299`); a rejected/cancelled approval cancels the tool (`hooks/interrupt_hook.py:51`; `tools/ask_user.py:33`).
- **Transcript normalization:** closes abandoned tool calls on supersede, collapses duplicate HITL results, and *refuses malformed history* with `RUN_ERROR code=MALFORMED_HISTORY` (`adapters/agui.py:795`, transcript-repair region ~lines 213–379 / 771–799).
- **MCP lifecycle:** servers start → ready (30s) → clients pinned; teardown clients → servers; idempotent; context-manager required.
- **Thread identity:** one conversation = one AG-UI `thread_id` = the session id; swarm/graph agents may **not** have session managers (fail-fast).

### 4.5 CLI & release

- **CLI:** `kaboo-workflows check|load CONFIG...` (`--json`, `-q`); `kaboo-serve CONFIG [--host --port --endpoint --ping-path --cors-origin ...]` (`[project.scripts]` in `pyproject.toml`).
- **Build:** hatchling; version via commitizen; publish via **PyPI Trusted Publishing** on a `v[0-9]+.[0-9]+.[0-9]+` tag (`.github/workflows/publish.yml`, environment `release`, documented in `RELEASING.md`).
- **Dev loop (uv required):** `uv run just check` (ruff format + lint, `ty` type check, Bandit) · `uv run just test` (pytest + coverage, **≥70% gate**, incl. contract + e2e) · `uv run just test-docs` (pytest-markdown-docs; ```` ```{.python notest} ```` fences skip network/LLM snippets) · `uv run just docs-build` (`mkdocs build --strict`) · `uv run just docs-check-render` (guards against fence corruption in built HTML) · `uv run just docs-llms` (regenerate `llms.txt` + `llms-full.txt`). Full recipes live in `justfile` + `tasks/*.just`.

---

## 5. @pgege/kaboo-runtime (Node/TS — persistence + orchestration)

**Purpose:** A CopilotKit v2 `AgentRunner` that persists the full AG-UI event log and replays it, plus a pluggable `ThreadStore`. It is *only the runner* — it adds no HTTP layer; the host mounts CopilotKit's handler. `type: module`, ESM+CJS via tsup, `node >= 18`, license MIT (`package.json`).

### 5.1 Three seams

- **`KabooAgentRunner`** (`src/runner.ts`) overrides `run` (hydrate → inject persisted state → stream → `finalizeRunEvents` → persist verbatim, `runner.ts:138`) and `connect` (replay stored log + tee in-flight live subject, `runner.ts:217`), plus `isRunning`/`stop` and local-thread endpoint methods: `hydrate` (`:79`), `listThreads` (`:289`), `getThreadEvents` (`:321`), `getThreadMessages` (`:311`), `getThreadState` (`:331`), `clearThreads` (`:340`).
- **`ThreadStore`** (`src/store.ts`) — a **7-method contract**: `appendEvents`, `readEvents`, `readState`, `saveMessages`, `readMessages`, `listThreads`, `clear`. `StoredThread` = `{ id, agentId, createdAt, updatedAt }`.
- **`deriveState`** (`src/state.ts`) — pure: **last `STATE_SNAPSHOT` wins**; this is how `kaboo_history` is recovered.
- **Stores:** `InMemoryThreadStore()` (dev); `PostgresThreadStore({ dsn | pool })` (prod; auto-creates `kaboo_threads`, `kaboo_thread_events`, `kaboo_thread_messages`; `pg` is an optional peer, dynamically imported).

### 5.2 Wiring

```ts
import { CopilotRuntime } from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { createKabooRunner, PostgresThreadStore } from "@pgege/kaboo-runtime";

const runtime = new CopilotRuntime({
  agents: { research_pipeline: new HttpAgent({ url: process.env.PIPELINE_SERVICE_URL }) },
  runner: createKabooRunner(store, { onStoreError }),
});
// mount createCopilotExpressHandler({ runtime, basePath: "/api/copilotkit" })
```

- The `agents` **key id must match the workflows `entry`**.
- On restart with a durable store, call `await runner.hydrate()` **once** (else sync thread lists come back empty).
- Framework-agnostic — the vendored demo mounts it under NestJS; Express is equally supported.
- `KabooRunnerOptions.onStoreError?: (error, { threadId, op }) => void` (`runner.ts:16`); if unset, errors are `console.error`'d (non-fatal).

### 5.3 Security posture

- SQL is fully parameterized (`$1,$2,…`).
- The DB holds full conversation **PII as JSONB**; **no encryption at rest**; **no thread scoping** (`threadId` is whatever the client provides) — **authZ/tenancy is the host's job**.
- Persistence failures route to `onStoreError` (**non-fatal — wire it**).
- First Postgres use needs `CREATE` privilege (tables are auto-created).

### 5.4 Release

- `type: module`, ESM+CJS via tsup, `node >= 18`.
- **Peers:** `@copilotkit/runtime >= 1.62.0`, `@ag-ui/client >= 0.0.57`, `rxjs >= 7.0.0`, optional `pg >= 8.0.0`.
- **`prepack`** = `build` → `docs:api` (TypeDoc, completeness gate = validation-as-errors, regenerates `docs/api-inventory.md`) → `docs:llms` → `docs:verify` (type-checks every `ts` doc snippet) → `test` (vitest). Publish is manual after review: `yarn npm publish`.

---

## 6. @pgege/kaboo-react (React/TS — UI)

**Purpose:** Render the AG-UI activity stream (agents, tools, delegation trees, HITL) as themeable React components inside a CopilotKit app. License MIT, `type: module`, `node >= 18`.

### 6.1 Two barrels

- **Main** (`@pgege/kaboo-react`, `src/index.ts`): contexts (`KabooProvider`, `KabooActivityProvider`, `DrillProvider`, `InterruptBridgeProvider`), hooks (`useActivity`, `useDrill`, `useInterruptBridge`, `useInterruptFor`), components (`ActivityPanel`, `AgentCard`, `ToolRow`, `MiniTable`, `GlassTabs`, `DrillDetailView`, `MarkdownContent`, `InterruptRenderer`, `Timeline`), formatters (`formatToolInput`, `formatToolResult`, `normalizeResult`), groups utils (`topLevelGroups`, `directChildren`), types.
- **CopilotKit subpath** (`@pgege/kaboo-react/copilotkit`, `src/copilotkit.ts`): `KabooMessageView`, `KabooAssistantMessage`, `KabooInlineCards`, `KabooInterruptHandler`, `KabooAskUser`, `KabooToolRender`.
- **Styles:** `import "@pgege/kaboo-react/styles.css"` is **required** (theming is via CSS variables only; no CSS-in-JS).

### 6.2 Data model

`ActivityState = { groups: Record<string, StreamGroup> }` — a **flat map**; the tree is built via `parentGroup` pointers (not path parsing). `StreamGroup` fields (`src/types.ts:123`):

| Field | Type | Meaning |
|---|---|---|
| `title` | `string` | Card title |
| `agentName` | `string` | Machine name (correlates inline cards) |
| `parentGroup` | `string \| null` | Parent id, `null` = top-level |
| `toolCallId?` | `string \| null` | Delegating tool-call id that spawned the group |
| `runId?` | `string \| null` | AG-UI runId (changes on interrupt/resume) |
| `turnId?` | `string \| null` | Stable logical turn id (prefer over `runId` for turn scoping) |
| `task?` | `string \| null` | The task this agent was handed |
| `isChatReply?` | `boolean` | This agent's text *is* the chat reply |
| `inlineChatOwner?` | `boolean` | Plain-agent entry group; enrich tool rows, never draw a card |
| `status` | `"active" \| "completed" \| "error" \| "interrupted"` | Lifecycle state |
| `tools` | `ToolCall[]` | Tool calls in call order |
| `tokens` | `string` | Accumulated streamed text |
| `timeline` | `TimelineEntry[]` | Interleaved text/tool entries |
| `interrupt?` | `InterruptData` | Open interrupt when paused |
| `structuredOutput?` | `Record<string, unknown>` | Schema-shaped output |
| `outputSchemaName?` | `string` | Schema name → selects a structured renderer |

Each `ACTIVITY_SNAPSHOT` is a **full replacement**; consumers re-render. Roots = `topLevelGroups`; children = `directChildren(parentId)`.

### 6.3 CopilotKit integration & HITL

`KabooProvider` composes `<CopilotKit>` + activity/drill/interrupt providers and auto-mounts `KabooInterruptHandler` + `KabooInlineCards`. Three non-overlapping render paths:

1. **swarm/graph members** via `KabooMessageView`/`KabooAssistantMessage` (turn-bound by `turnId ?? runId`);
2. **delegate sub-agents** via `useRenderTool` in `KabooInlineCards`;
3. **plain tools** via `KabooToolRender`.

Interrupts render inline at the tool position when an anchor exists, else in a chat slot; approval → `{status:"approved"}`, form → `{question: answer}` map; custom renderers via `interruptRenderers`.

### 6.4 Theming & extension

- Reads design-system CSS vars (`--background`, `--foreground`, `--card`, `--muted`, `--border`, …) with fallbacks, plus `--kaboo-*` overrides; dark mode = toggle parent tokens.
- **Structured renderers:** pass `structuredRenderers={{ SchemaName: (data) => JSX }}` — selected when a group has `structuredOutput` **and** `outputSchemaName` (fallback = collapsible JSON), wired via `StructuredRenderersContext` and rendered in `AgentCard` (`src/components/AgentCard.tsx:177`).

### 6.5 Release

- **Peers:** `@copilotkit/react-core >= 1.62.0`, `react >= 18`, `react-dom >= 18`.
- tsup ESM+CJS, two entries + `styles.css`. `prepack` also runs `examples:typecheck`.
- **Not yet published** — publish with `yarn npm publish` (interactive OTP).

---

## 7. End-to-end composition

`kaboo-docs/examples/kaboo-workflows-demo` wires all three (a **NestJS** backend + Vite/React frontend; also mirrored as the standalone `kaboo-workflows-demo` reference). Canonical ports:

| Service | Stack | Port |
|---|---|---|
| Frontend (Vite dev) | React + CopilotKit + kaboo-react | 3000 |
| Backend | NestJS + `@copilotkit/runtime` v2 + kaboo-runtime + Postgres | 4000 |
| Pipeline | Python + kaboo-workflows (`/invocations`, `/ping`, `/manifest`) | 8080 |

The Vite dev server proxies `/api/copilotkit` → `:4000` and `/api/manifest` → `:8080` (stripping the `/api` prefix), so the browser only ever talks to itself.

**Full-stack request:** browser turn → CopilotKit → kaboo-runtime runner (`run`) → `HttpAgent` → kaboo-workflows `/invocations` (SSE) → events stream back, the runner persists on completion, kaboo-react renders live; on **reconnect** → runner `connect` replays the stored log including `ACTIVITY_SNAPSHOT`.

---

## 8. Security posture (consolidated)

| Concern | Behavior | What the host must do |
|---|---|---|
| CORS (workflows) | default `*` + credentials, binds `0.0.0.0` | pass explicit `--cors-origin`; front with TLS/reverse proxy |
| HITL approvals | default-to-cancel if unaddressed | keep the invariant; never auto-approve |
| Malformed history | refuses with `RUN_ERROR code=MALFORMED_HISTORY` | surface it; don't blindly repair |
| DB contents | full PII as JSONB, unencrypted, no tenancy | encrypt + scope `threadId` to the authed user |
| Store failures | routed to `onStoreError`, non-fatal | always wire `onStoreError` |
| Tool loops | `MaxToolCallsGuard(25)` default (`hooks/max_calls_guard.py:40`) | tune per app |
| MCP | lifecycle-managed, pinned | ensure graceful shutdown (context manager) |

---

## 9. Configurability surface

- **workflows:** YAML (agents/models/MCP/orchestration/session/history) + `${VAR}` interpolation + multi-file merge.
- **runtime:** pluggable `ThreadStore` + `onStoreError` + store choice by env.
- **react:** `structuredRenderers` + `interruptRenderers` + CSS-var theming + provider toggles.

---

## 10. Publish status

_Refreshed 2026-08-02:_

- **kaboo-workflows**: PyPI has **0.11.0** (plus 0.9.0/0.10.0). **0.12.0** (MCP call-meta, interrupt TTL/edited approvals, multiagent interrupt isolation) and **0.13.0** (forwarded_props, authorized attachment fetching, per-invocation overrides, openai client timeouts) are committed and tagged locally — pushing `main --tags` fires `publish.yml` (Trusted Publishing).
- **@pgege/kaboo-runtime**: npm has **0.1.1**. **0.2.0** (thread ownership: `owner_id` column, scoped `listThreads`, `accessPolicy` runner options) is committed locally — publish with the `prepack` gate + `yarn npm publish`.
- **@pgege/kaboo-react**: npm has **0.2.0**. **0.4.0** (tool renderer registry; interrupt renderer overrides on every surface; 0.3.0 fixes folded in) is committed locally — publish with `yarn npm publish` (interactive OTP).
- A prior rename introduced URL corruption (`github.io/@pgege/…`) that was fixed in both JS repos — **watch for it recurring if you script scope changes**; the scope belongs only in package specifiers, never URL paths. (Both JS AGENTS.md files carry a guardrail: never point URLs at the old `kaboo/kaboo-workflows` monorepo path — use `gl-pgege/<repo>`.)

---

## 11. Playbook: build a new app on this stack

1. **Model the agents in YAML (kaboo-workflows):** start with one `entry` agent; add orchestrations (`delegate`/`swarm`/`graph`) as complexity grows; secrets in `${ENV}`; add `interrupt:` for any tool needing human approval.
2. **Prove it locally:** `kaboo-workflows check`, then `kaboo-serve config.yaml` (lock CORS for non-local).
3. **Stand up the Node runtime (kaboo-runtime):** `CopilotRuntime({ agents: { <entry>: HttpAgent }, runner: createKabooRunner(store, { onStoreError }) })`; `InMemory` in dev, Postgres in prod; mount CopilotKit's handler; **scope `threadId` to the authed user yourself**.
4. **Build the UI (kaboo-react):** wrap in `KabooProvider`, add `CopilotChat messageView={KabooMessageView}`, import the stylesheet, register `structuredRenderers` for schema-shaped outputs, theme via CSS vars.
5. **Keep layers clean:** UI never talks to Python directly; persistence never leaks into UI; orchestration stays declarative. New behavior goes to the right layer (new tool/agent → YAML; new persistence target → a `ThreadStore`; new visual → a component/structured renderer).

---

## 12. Footguns (categorized)

Every item below was verified against the code. Treat this as the pre-flight checklist.

### 12.1 kaboo-workflows

- **Non-streaming programmatic path loses wiring.** Using kaboo-workflows programmatically (calling the strands agent directly) gives the final answer but forfeits activity snapshots, interrupt bridging, and `kaboo_history` — all of which live in the serving adapter (`adapters/agui.py`, `adapters/_multiagent.py`), not on the plain strands object.
- **Permissive default CORS + `0.0.0.0` bind.** `allow_origins=["*"]` + `allow_credentials=True` (`agui.py:900–901`) and `kaboo-serve` binds `0.0.0.0:8080` (`serve.py:28`). Always pass `--cors-origin` in production.
- **Never auto-approve HITL.** Unaddressed interrupts default to `{"status":"cancelled"}` (default-to-cancel invariant, `agui.py:176/187–188`, `_multiagent.py:291/298–299`). Don't "fix" this to auto-approve.
- **Malformed-history refusal is intentional.** The adapter emits `RUN_ERROR code=MALFORMED_HISTORY` (`agui.py:795`) rather than silently repairing a broken transcript. Surface it; don't paper over it.
- **agents-map id must equal the workflows `entry`.** The CopilotKit `agents` key on the Node side must exactly match the YAML `entry` name, or runs won't route.
- **swarm/graph agents cannot have session managers.** This is fail-fast by design ([§4.4](#44-security--safety)).
- **MCP lifecycle needs graceful shutdown.** Servers must be ready before agents; teardown is clients → servers; a context manager is required. Skipping it leaks pinned clients.

### 12.2 kaboo-runtime

- **Forgetting `runner.hydrate()` after restart** → empty sync thread lists (durable store never loaded into the in-memory cache).
- **Store errors are non-fatal, so `onStoreError` must be wired.** Otherwise silent persistence loss (falls back to `console.error`, `runner.ts:125`).
- **DB holds unencrypted PII with no tenancy.** `threadId` is whatever the client sends; the runtime does not scope or encrypt. The **host must scope `threadId` to the authed user** and encrypt at rest.
- **`ACTIVITY_SNAPSHOT` is a full replacement — don't assume incremental.** State/messages/tree are all *derived* from the verbatim log via `deriveState` (last `STATE_SNAPSHOT` wins); never hand-roll a bespoke scan or compact events in a store.
- **First Postgres use needs `CREATE` privilege** (auto-creates three tables).

### 12.3 kaboo-react

- **Forgetting the stylesheet import** (`import "@pgege/kaboo-react/styles.css"`) → unstyled kaboo components.
- **Structured renderers only fire when both `structuredOutput` and `outputSchemaName` are present** — otherwise you get the collapsible-JSON fallback. If the schema name doesn't match a registered renderer key, it also falls back.
- **Build the tree from `parentGroup`, not id path parsing.** The map is flat; correlation is by pointer.

### 12.4 Cross-cutting

- **Example proxy port mismatch (`:4000`).** The demo frontend proxies `/api/copilotkit` → `:4000` and `/api/manifest` → `:8080`; changing one side without the other breaks the demo.
- **Editing generated artifacts by hand** (`docs/api`, `docs/api-inventory.md`, `llms.txt`, `llms-full.txt`) — **regenerate via the `docs:*` / `docs-llms` scripts**; CI drift-checks them and fails on staleness.
- **Scope-in-URL corruption recurrence risk.** A prior rename produced `github.io/@pgege/…`; the `@pgege` scope belongs only in package specifiers, never URL paths. Re-check after any scripted scope change.

### 12.5 Data-answering specific (see [§15](#15-refactor-track--agents-that-answer-questions-from-data-they-query))

- **Never let the LLM emit raw SQL against a privileged connection.** Prefer parameterized query tools / row-level scoping; validate all queries (echoes the runtime's fully-parameterized posture).
- **Redact/limit rows.** Tool-result text is already truncated by `EventPublisher(max_result_len=600)` (`hooks/event_publisher.py:188`) — verify this bound covers your payloads and add explicit row caps in the query tool.
- **The persisted event log will contain full query results (PII).** The runtime does not encrypt or scope by user — treat the answer stream as sensitive; it replays verbatim on reconnect.
- **HITL any mutating/expensive query.** Gate writes/costly reads behind `interrupt:` so a human approves before execution.

---

## 13. Where to look

- **Docs portal:** `kaboo-docs` (`docs/index.md`, `docs/contributing.md`) and per-repo docs sites (see [Appendix A](#appendix-a-verified-repo-reference-urls-paths-commands)).
- **Per-repo:** `docs/` + `AGENTS.md` + `CONTRIBUTING.md` + `llms.txt`/`llms-full.txt`.
- **Deep code references:** exact `file:line` anchors for every public symbol, config schema, security-critical branch, store schema, and UI render path (the three per-library audits). Key anchors are inlined throughout §4–§6 and §12 above.

---

## 14. Declarative Generative UI

> Source of truth: the CopilotKit **Generative UI Spectrum** — <https://www.copilotkit.ai/generative-ui-spectrum>. kaboo is **Controlled** today; this section explains the band directly to its right so you can reason about where the stack is heading (see [§15](#15-refactor-track--agents-that-answer-questions-from-data-they-query)).

### 14.1 What the Declarative band is

With **Declarative Generative UI**, developers ship a **catalog of composable building-block primitives** — a *vocabulary* the agent composes with — rather than a fixed set of whole components. Each primitive (e.g. `Card`, `PrimaryButton`) has:

- a **typed schema** (its props, declared with `zod`) plus a description the agent reads, and
- a **renderer** — a React component from *your* design system.

At runtime the **agent assembles** those primitives into a UI **tree** for each request. Put differently: **the agent decides the composition; you own the pixels of each primitive.** This contrasts with the Controlled band, where the agent only *picks which whole component* to show and never invents the surface.

### 14.2 API shape (CopilotKit A2UI)

```tsx
export const catalogDefinitions = {
  Card: {
    description: "A titled card container.",
    props: z.object({ title: z.string(), subtitle: z.string().optional() }),
  },
  PrimaryButton: {
    description: "A styled primary button.",
    props: z.object({ label: z.string(), action: z.any().optional() }),
  },
} satisfies CatalogDefinitions;

export const catalogRenderers = {
  Card: MyCard,
  PrimaryButton: MyPrimaryButton,
} satisfies CatalogRenderers<typeof catalogDefinitions>;

const catalog = createCatalog(catalogDefinitions, catalogRenderers);

<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog }}>
  <CopilotChat />
</CopilotKit>;
```

`catalogDefinitions` (typed prop schemas + descriptions) + `catalogRenderers` (one component per primitive) → `createCatalog(catalogDefinitions, catalogRenderers)`; wired via `<CopilotKit runtimeUrl a2ui={{ catalog }}>`.

### 14.3 A2UI vs AG-UI vs MCP-UI

They sit at **different layers and compose, not compete**:

| Layer | What it is |
|---|---|
| **AG-UI** | the agent↔user *event protocol* (how events stream both ways) |
| **A2UI** | the declarative UI *wire format* — a typed catalog of components + instances — that rides **on top of** AG-UI for the Declarative band |
| **MCP-UI** | the UI *delivery channel* for MCP-served surfaces (the MCP Apps point on the spectrum) |

### 14.4 Trade-offs and when to use it

You give up some **pixel-perfection** (every UI is a combination of pre-specified building blocks) and **determinism** (the agent does the assembling) in exchange for far more **breadth**. That trade-off makes it the right tool for the **long tail** — internal enterprise tools, dashboards, reports, and secondary/contextual UIs — where *"having something to show"* beats perfect predictability.

- **Controlled** remains best for the few **high-traffic, brand-critical** surfaces (e.g. flight tickets, booking confirmations) where pixel-perfection and predictability matter most.
- **Fully Open / MCP Apps** are for **3rd-party integrations and one-off** experiences.
- **Mixing bands in one product is expected** — a single chat session can render a Controlled component, a Declarative ad-hoc report, and an Open MCP App in sequence. Picking one band for the whole product is the common architectural mistake.

---

## 15. Refactor track — agents that answer questions from data they query

> **This is priming / greenfield guidance — a direction to design toward, not a claim that a data-presentation catalog already exists in kaboo.** The goal: evolve the stack into an easy-to-use solution where agents **query** data (DBs/APIs/tools), receive results, and **present** answers as rich UI.

### 15.1 Current state — the natural on-ramp

The pieces are already in place, mapped to the real architecture:

- **kaboo-react is a Controlled consumer** of the AG-UI activity stream ([§2](#2-five-mental-models), [§6](#6-pgegekaboo-react-reactts--ui)).
- **kaboo-workflows already supports `output_schema`** — structured (schema-shaped) output per agent (`config/schema.py:217`; resolved in `config/resolvers/agents.py:135`; the schema's class name is emitted as `output_schema_name`, `hooks/event_publisher.py:450`).
- **kaboo-react already supports `structuredRenderers`** — a schema-name → React renderer map with a **JSON fallback** (`AgentCard.tsx:177`, `StructuredRenderersContext`).

That `output_schema` → `outputSchemaName` → `structuredRenderers` path is the on-ramp: an agent can already tag a query result with a schema and have the UI render it with a custom component.

### 15.2 Proposed evolution — a declarative data-answer catalog

Define a small, **typed catalog of data-presentation primitives** as kaboo-react renderers and let the workflows agent assemble them to present query results. A reasonable starter catalog:

| Primitive | Purpose |
|---|---|
| `DataTable` | tabular rows/records |
| `MetricCard` | a single KPI with label/delta |
| `BarChart` / `LineChart` | simple quantitative charts |
| `KeyValueList` | record fields as key/value pairs |
| `Timeline` | ordered events |
| `Callout` | highlighted note/warning |
| `CodeBlock` | raw query / snippet display |

**Two viable integration paths (trade-offs):**

1. **Lean on CopilotKit A2UI** (`a2ui={{ catalog }}`, [§14.2](#142-api-shape-copilotkit-a2ui)) so the *agent assembles* primitives into a tree.
   - *Pro:* maximal breadth; the agent composes freely; standard wire format (rides on AG-UI).
   - *Con:* adopts a new dependency surface and a second rendering path alongside kaboo-react's Controlled model; less deterministic.
2. **Extend kaboo's existing `output_schema` + `structuredRenderers`** into a richer, *composable* catalog **without** adopting full A2UI — e.g. a `catalog` structured-output shape whose renderer walks a list of `{ primitive, props }` instances and dispatches to registered primitive renderers.
   - *Pro:* stays inside the current Controlled architecture and the one-stream/event-log model; minimal new concepts; you keep full control of composition rules.
   - *Con:* you reinvent a slice of A2UI; the agent's freedom is bounded by whatever composition you allow.

**Where each piece lives** (respecting the layer separation):

- **workflows:** a tool that *queries data* (SQL/HTTP/MCP) + an agent whose `output_schema` emits either structured rows (path 2) or a catalog instance tree (path 1).
- **runtime:** persists the emitted output **verbatim** in the event log, so the rendered answer **replays on reconnect** — no special handling needed.
- **react:** renders it via a structured renderer (path 2) or the A2UI catalog (path 1).

### 15.3 Data flow for a data-answering turn

```text
user question
  → workflows agent calls a query tool (SQL / HTTP / MCP)
    → receives rows/records
      → produces structured output (schema-tagged: outputSchemaName / catalog instances)
        → emitted on the AG-UI stream (ACTIVITY_SNAPSHOT / structured output)
          → kaboo-runtime persists it VERBATIM (answer replays on reconnect)
            → kaboo-react renders via structured renderer / catalog
```

This rides the **same one-stream, event-log-is-source-of-truth** model already in place ([§2](#2-five-mental-models)) — nothing about the transport or persistence changes; only the *shape* of the structured output and the renderers grow.

### 15.4 Security / quality notes specific to data-answering

- **Parameterize and validate all queries.** Do **not** let the LLM emit raw SQL against a privileged connection — prefer **parameterized query tools** with **row-level scoping**. (This echoes the runtime's fully-parameterized `$1,$2,…` posture; extend the same discipline to the query tool.)
- **Redact / limit rows.** `EventPublisher(max_result_len=600)` (`hooks/event_publisher.py:188`) truncates tool-result *text* today — verify it covers your payloads, and add explicit **row caps** in the query tool so large result sets don't bloat the log or leak more than intended.
- **The persisted event log will contain full query results (PII).** The runtime **does not encrypt or scope by user** — the host must encrypt at rest and scope `threadId`. Because the answer replays verbatim on reconnect, treat the whole stream as sensitive.
- **HITL any mutating or expensive query.** Put `interrupt:` on write/costly-read tools so a human approves before execution (default-to-cancel invariant, [§4.4](#44-security--safety)).

---

## 16. Contributor guide — "when you find a gap"

For an agent or human who spots a missing feature, a bug, or a doc gap, here's the concrete path from discovery to a merged, *proven* change.

### 16.1 Where each repo lives

See [Appendix A](#appendix-a-verified-repo-reference-urls-paths-commands) for the full table (local paths, verified GitHub clone URLs, docs sites). Browse the code locally under `/Users/pgege/Documents/projects/<repo>` or on GitHub under `github.com/gl-pgege/<repo>`.

### 16.2 Run each repo's checks/tests/build locally

| Repo | Setup | Core checks (verified commands) |
|---|---|---|
| kaboo-workflows | `uv run just install` (deps + git hooks) | `uv run just check` · `uv run just test` · `uv run just test-docs` · `uv run just docs-build` · `uv run just docs-check-render` · `uv run just docs-llms` |
| kaboo-runtime | `corepack enable` → `yarn install --immutable` | `yarn build` · `yarn test` · `yarn typecheck` · `yarn docs:api` · `yarn docs:verify` · `yarn docs:llms` · `yarn examples:typecheck` · `mkdocs build --strict` |
| kaboo-react | `corepack enable` → `yarn install --immutable` | `yarn build` · `yarn test` · `yarn typecheck` · `yarn docs:api` · `yarn docs:verify` · `yarn docs:llms` · `yarn examples:typecheck` · `mkdocs build --strict` |
| kaboo-docs | `pip install mkdocs-material` | `mkdocs serve` · `mkdocs build --strict` |

(Postgres store tests in kaboo-runtime are gated on `DATABASE_URL` and skip when unset.)

### 16.3 The "proven docs / proven examples" philosophy

Nothing documented ships without a passing proof:

- **workflows:** every executable ```` ```python ```` fence in `README.md` + `docs/` is *run* by `uv run just test-docs` (pytest-markdown-docs; network/LLM snippets fenced ```` ```{.python notest} ````). Every `examples/**/config.yaml` is load-validated by `tests/pipeline/test_examples.py`; complex scenarios add a scripted `tests/e2e/configs/*.yaml`. Every public symbol needs a Google-style docstring **and** an autodoc page (`tests/contract/test_public_api.py`). `llms.txt`/`llms-full.txt` must be regenerated when docs change (`tests/contract/test_llms.py`).
- **runtime / react:** every `ts`/`tsx` doc snippet must type-check under `yarn docs:verify` (illustrative fragments tagged ```` ```ts no-verify ````). `yarn docs:api` runs a **TypeDoc completeness gate** (no undocumented public export — every export needs TSDoc + an `@example`) and regenerates `docs/api-inventory.md`. Examples are load/typecheck-tested via `yarn examples:typecheck`. `docs:llms` must produce no drift.

**Any addition must ship with its passing proof** — a doc fence that executes/type-checks, an example that loads, an autodoc page, and regenerated AI artifacts.

### 16.4 How to contribute

1. Work against the latest `main`; create a branch.
2. Make the **smallest reasonable change**; add/adjust tests and a `CHANGELOG.md` entry under `Unreleased`.
3. Commit with **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
4. Run the repo's full check suite (16.2) — it *is* the CI gate.
5. Open a PR with a clear what/why; stay engaged with CI.

**CI gates that must pass:**

- **workflows:** `uv run just check` clean · `uv run just test` green (incl. `tests/contract/*` + `tests/e2e/*`) · `uv run just test-docs` green · `uv run just docs-build` clean · new public symbol has docstring + autodoc page · new example has a load/e2e proof · `llms.*` regenerated. (See its **AGENTS.md "Definition of Done"**.)
- **runtime:** `yarn test` · `yarn docs:api` (completeness gate + no drift) · `yarn docs:verify` · `yarn docs:llms` (no drift) · `yarn examples:typecheck` · `mkdocs build --strict` · `yarn pack --dry-run` clean. (See its **AGENTS.md "Definition of done"**.)
- **react:** same as runtime, with the completeness gate across **both** barrels and `styles.css` resolving in `yarn pack --dry-run`.

**Release / tag flow:**

- **workflows:** commitizen bump → `vX.Y.Z` tag → push triggers `publish.yml` → **PyPI Trusted Publishing** (OIDC, environment `release`; a human approves). Documented in `RELEASING.md`. Prefer `uv run just release-dry` → `uv run just release` → `git push origin main --tags`.
- **runtime / react:** bump `version` + `CHANGELOG.md`, run `prepack` gate, then `yarn npm publish` (manual, after review; react needs interactive OTP).

### 16.5 Which layer does the change belong to?

| The change is… | It belongs in… |
|---|---|
| a new tool or agent, new orchestration, new config knob | **kaboo-workflows** (YAML + resolvers) |
| a new persistence target (Redis, DynamoDB, SQLite, …) | **kaboo-runtime** — implement the 7-method `ThreadStore` |
| a new visual / how an answer looks | **kaboo-react** — a new component, a `structuredRenderer`, or a catalog primitive |

Keep the seams intact: UI never talks to Python directly; persistence never leaks into the UI; orchestration stays declarative.

---

## Appendix A: Verified repo reference (URLs, paths, commands)

`git remote -v` confirmed the owner is **`gl-pgege`** for all four repos (kaboo-workflows also has an `upstream` remote at `strands-compose/sdk-python`).

| Repo | Local path | Clone URL (SSH) | GitHub | Docs site |
|---|---|---|---|---|
| kaboo-workflows | `/Users/pgege/Documents/projects/kaboo-workflows` | `git@github.com:gl-pgege/kaboo-workflows.git` | <https://github.com/gl-pgege/kaboo-workflows> | <https://gl-pgege.github.io/kaboo-workflows/> |
| kaboo-runtime | `/Users/pgege/Documents/projects/kaboo-runtime` | `git@github.com:gl-pgege/kaboo-runtime.git` | <https://github.com/gl-pgege/kaboo-runtime> | <https://gl-pgege.github.io/kaboo-runtime/> |
| kaboo-react | `/Users/pgege/Documents/projects/kaboo-react` | `git@github.com:gl-pgege/kaboo-react.git` | <https://github.com/gl-pgege/kaboo-react> | <https://gl-pgege.github.io/kaboo-react/> |
| kaboo-docs | `/Users/pgege/Documents/projects/kaboo-docs` | `git@github.com:gl-pgege/kaboo-docs.git` | <https://github.com/gl-pgege/kaboo-docs> | <https://gl-pgege.github.io/kaboo-docs/> |

The end-to-end demo is vendored at `kaboo-docs/examples/kaboo-workflows-demo` (referenced as `gl-pgege/kaboo-workflows-demo` from the AGENTS.md files).

## Appendix B: Corrections applied during verification

Facts in the prior handoff were checked against the code; the table records what changed (old → new) and the justifying source. Everything not listed was confirmed accurate and preserved verbatim.

| Old | New | Source |
|---|---|---|
| runtime "0.1.0 live; 0.1.1 ready" (version implicit) | Clarified: **manifest version is now `0.1.1`**; 0.1.0 live on npm, 0.1.1 tagged and ready to republish | `kaboo-runtime/package.json` (`"version": "0.1.1"`) |
| CORS anchor `adapters/agui.py:899` | `adapters/agui.py:900–901` (`CORSMiddleware` / `allow_origins`) | `adapters/agui.py:900–901` |
| HITL default-cancel anchor `agui.py:185` | `agui.py:176,187–188` (and `_multiagent.py:291,298–299`) | verified line numbers |
| StreamGroup field list (14 fields) | Added `isChatReply` and `inlineChatOwner` (16 fields total) | `kaboo-react/src/types.ts:123–181` |
| Demo backend framework unspecified / "Express, NestJS examples" | Demo backend is **NestJS** (ports 3000 frontend / 4000 backend / 8080 pipeline) | `kaboo-docs/examples/kaboo-workflows-demo/README.md` |
| Dev commands `just test` / `just test-docs` / `just docs-check-render` | Prefixed with **`uv run`** (e.g. `uv run just test`); `docs-check-render` confirmed to exist | `AGENTS.md`, `CONTRIBUTING.md`, `justfile`, `tasks/*.just` |

Confirmed-accurate spot-checks (unchanged): `create_agui_app` signature and defaults (`agui.py:816`), the top-level `kaboo_workflows` public API and error hierarchy (`__init__.py`, `exceptions.py`), `ResolvedConfig.mcp_lifecycle` teardown (`config/resolvers/config.py`), the 7-method `ThreadStore` contract and `StoredThread` shape (`store.ts`), all `KabooAgentRunner` method anchors (`runner.ts`), the runtime/react peer-dependency ranges and `prepack` chains (`package.json`), `structuredRenderers` selection (`AgentCard.tsx:177`), `MaxToolCallsGuard(25)` default (`max_calls_guard.py:40`), and `EventPublisher(max_result_len=600)` (`event_publisher.py:188`).
