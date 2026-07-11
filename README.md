# kaboo-docs

The umbrella landing for the **kaboo stack**, served at
<https://gl-pgege.github.io/kaboo-docs/>. It is a lightweight
[MkDocs Material](https://squidfunk.github.io/mkdocs-material/) hub — a stack
intro, a diagram, library cards, and a cross-stack contributing guide. The full
per-library API docs live on each library's own Pages site.

## The stack

- [kaboo-workflows](https://github.com/gl-pgege/kaboo-workflows) — Python YAML
  multi-agent orchestration → AG-UI SSE.
- [kaboo-runtime](https://github.com/gl-pgege/kaboo-runtime) — CopilotKit runtime
  persistence (AgentRunner + ThreadStore).
- [kaboo-react](https://github.com/gl-pgege/kaboo-react) — React components/hooks
  for agent-activity UI.
- [kaboo-workflows-demo](https://github.com/gl-pgege/kaboo-docs/tree/main/examples/kaboo-workflows-demo) — a
  runnable, end-to-end reference, shipped as an example in this repo under
  [`examples/`](./examples/kaboo-workflows-demo).

## Develop

```bash
pip install mkdocs-material
mkdocs serve            # live preview at http://127.0.0.1:8000
mkdocs build --strict   # must be clean
```

## Deploy

Pushes to `main` build and deploy via `.github/workflows/pages.yml`. Enable it
once under **Settings → Pages → Source: GitHub Actions**.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (humans) and [AGENTS.md](./AGENTS.md)
(AI). The shared, cross-stack model lives at
[docs/contributing.md](./docs/contributing.md).
