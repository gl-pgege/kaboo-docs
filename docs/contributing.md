# Contributing to the kaboo stack

The kaboo stack is five repositories that share one contribution model. Each repo
has a `CONTRIBUTING.md` (for humans) and an `AGENTS.md` (for AI contributors);
this page is the shared entry point that links them all.

## The repositories

| Repo | Role | Contributing | AI guide |
|---|---|---|---|
| [kaboo-workflows](https://github.com/gl-pgege/kaboo-workflows) | Python YAML multi-agent orchestration → AG-UI SSE | [CONTRIBUTING](https://github.com/gl-pgege/kaboo-workflows/blob/main/CONTRIBUTING.md) | [AGENTS](https://github.com/gl-pgege/kaboo-workflows/blob/main/AGENTS.md) |
| [kaboo-runtime](https://github.com/gl-pgege/kaboo-runtime) | CopilotKit runtime persistence (AgentRunner + ThreadStore) | [CONTRIBUTING](https://github.com/gl-pgege/kaboo-runtime/blob/main/CONTRIBUTING.md) | [AGENTS](https://github.com/gl-pgege/kaboo-runtime/blob/main/AGENTS.md) |
| [kaboo-react](https://github.com/gl-pgege/kaboo-react) | React agent-activity UI | [CONTRIBUTING](https://github.com/gl-pgege/kaboo-react/blob/main/CONTRIBUTING.md) | [AGENTS](https://github.com/gl-pgege/kaboo-react/blob/main/AGENTS.md) |
| [kaboo-workflows-demo](https://github.com/gl-pgege/kaboo-docs/tree/main/examples/kaboo-workflows-demo) | Runnable end-to-end demo | [CONTRIBUTING](https://github.com/gl-pgege/kaboo-docs/blob/main/examples/kaboo-workflows-demo/CONTRIBUTING.md) | [AGENTS](https://github.com/gl-pgege/kaboo-docs/blob/main/examples/kaboo-workflows-demo/AGENTS.md) |
| [kaboo-docs](https://github.com/gl-pgege/kaboo-docs) | This umbrella landing | [CONTRIBUTING](https://github.com/gl-pgege/kaboo-docs/blob/main/CONTRIBUTING.md) | [AGENTS](https://github.com/gl-pgege/kaboo-docs/blob/main/AGENTS.md) |

## Shared principles

- **Docs are proven.** Library code snippets are type-checked/executed in CI; keep
  examples runnable and in sync with the source.
- **Everything is documented.** No undocumented public exports; the API-reference
  completeness gates fail otherwise.
- **AI-native.** Each library ships `AGENTS.md` plus `llms.txt` / `llms-full.txt`
  so agents can learn the APIs directly.
- **Conventional Commits** and green CI (build, tests, docs gates, package/dry-run
  checks) on every PR.
- **No secrets in git.** The demo's `.env` holds a live key and is gitignored;
  always redact keys in docs.

## Where changes go

- A library's behavior, API, or its own docs → that library's repo.
- How the pieces run together, ports, env, startup → the
  [demo](https://github.com/gl-pgege/kaboo-docs/tree/main/examples/kaboo-workflows-demo).
- This landing (stack intro, library cards, this page) → `kaboo-docs`.

## Editing this site

```bash
pip install mkdocs-material
mkdocs serve            # live preview at http://127.0.0.1:8000
mkdocs build --strict   # must be clean (no warnings / broken links)
```
