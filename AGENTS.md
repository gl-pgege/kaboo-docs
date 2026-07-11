# AGENTS.md

Guidance for AI agents working in **kaboo-docs**, the umbrella landing for the
kaboo stack. Humans: see [CONTRIBUTING.md](./CONTRIBUTING.md). Stack-wide model:
[docs/contributing.md](./docs/contributing.md).

## What this is

A lightweight MkDocs Material site (a hub, not full docs). Two pages:
`docs/index.md` (stack intro + mermaid diagram + library grid cards + demo
pointer) and `docs/contributing.md` (cross-stack contributing guide). Per-library
API docs live on each library's own Pages site — link to them, don't duplicate.

## Commands

```bash
pip install mkdocs-material
mkdocs serve            # preview
mkdocs build --strict   # must be clean (no warnings / broken links)
```

## Conventions

- Keep the landing minimal: intro, diagram, library cards, demo pointer,
  contributing link. Deep content belongs in the individual library repos.
- Library cards use Material grid cards (`<div class="grid cards" markdown>`);
  diagrams use ```` ```mermaid ```` fences.
- All external links point at `gl-pgege/*` repos and `gl-pgege.github.io/*` Pages
  sites.

## Definition of done

- `mkdocs build --strict` clean.
- Every library / demo / repo cross-link resolves, including the cross-stack
  contributing page.

## Related

- [kaboo-workflows](https://github.com/gl-pgege/kaboo-workflows)
- [kaboo-runtime](https://github.com/gl-pgege/kaboo-runtime)
- [kaboo-react](https://github.com/gl-pgege/kaboo-react)
- [kaboo-workflows-demo](https://github.com/gl-pgege/kaboo-workflows-demo)
