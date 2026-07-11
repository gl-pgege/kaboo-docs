# Contributing to kaboo-docs

This repo is the umbrella landing for the kaboo stack. AI agents should also read
[AGENTS.md](./AGENTS.md). For the stack-wide model, see
[docs/contributing.md](./docs/contributing.md).

## Prerequisites

- Python 3.x with `pip`.

## Install & preview

```bash
pip install mkdocs-material
mkdocs serve            # live preview at http://127.0.0.1:8000
```

## Edit the landing

- **Content** lives in `docs/index.md` (stack intro, diagram, library cards) and
  `docs/contributing.md` (cross-stack guide).
- **Add a library card:** edit the `<div class="grid cards" markdown>` block in
  `docs/index.md`.
- **Add a page:** create `docs/<name>.md` and add it to `nav` in `mkdocs.yml`.
- **Diagrams:** use ```` ```mermaid ```` fenced blocks (Material renders them via
  the configured `superfences` custom fence).

## Definition of done

```bash
mkdocs build --strict
```

must be clean (no warnings, no broken links), and all cross-links to the library
Pages sites and repos resolve.

## Deploy

Pushes to `main` deploy via `.github/workflows/pages.yml`. Enable Pages once under
**Settings → Pages → Source: GitHub Actions**.
