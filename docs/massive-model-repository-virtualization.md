# Massive Model Repository Virtualization

This stage introduces the repository-side virtualization engine required for repositories with hundreds of thousands to millions of semantic records.

The containment repository is treated as a working-set view over indexed semantic data rather than a DOM representation of the complete model. The viewport engine maintains visible-subtree counts, seeks directly to the requested scroll window, and caps rendered rows independently of total repository size.

## Invariants

- Semantic repository size does not determine DOM row count.
- A one-million-element repository may expose one million logical rows while rendering at most the configured viewport cap.
- Collapsed subtrees do not produce descendant rows.
- Viewport seeking uses visible-subtree sizes instead of constructing the complete flattened tree on every scroll.
- Selection reveal computes the required scroll position without rendering preceding rows.
- Row rendering remains presentation-only; canonical semantic ownership remains in the indexed model.
- No model elements are removed, truncated, or hidden semantically to satisfy performance constraints.

## Components

- `RepositoryVisibleIndex`: cached visible-subtree sizing and direct window seeking.
- `RepositoryViewport`: scroll/viewport calculations with overscan and hard DOM-row bounds.
- `VirtualRepositoryDom`: top spacer, bounded row window, and bottom spacer rendering.
- `RepositoryTreeRenderer`: browser adapter joining semantic viewport calculations to DOM rendering.

## Qualification

Node qualification includes a one-million-element shallow repository and verifies that viewport output remains bounded. Browser qualification creates 100,000 semantic elements and verifies that the rendered DOM remains at or below the configured row cap while scrolling deep into the repository.

## Integration boundary

The engine is intentionally isolated from semantic correctness and persistence. The remaining integration task is replacing the legacy `renderTree()` implementation in `app.js` with `RepositoryTreeRenderer` while retaining existing row actions, drag/drop, context menus, collaboration presence, inline rename, and diagram navigation. That wiring must not reintroduce full-model scans or full-tree DOM construction.
