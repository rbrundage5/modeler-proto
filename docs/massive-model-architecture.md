# Massive Model Architecture Contract

The modeler is expected to support repositories containing hundreds of thousands through millions of semantic records. Total repository size must not make ordinary working-set operations unusable.

## Qualification targets

These are performance qualification datasets, not product limits:

- 100,000 semantic elements
- 500,000 semantic elements
- 1,000,000 semantic elements
- substantial relationship counts at each tier
- thousands of diagrams
- pathological high-connectivity diagrams and structures

## Architectural invariants

1. Stable-ID element, relationship, and diagram lookup must be indexed rather than whole-array scanned.
2. Owner/child, relationship-endpoint, and presentation adjacency must be indexed.
3. Ordinary edits must eventually operate on dirty dependency sets rather than normalizing the entire repository.
4. Undo/redo must migrate from complete-project JSON snapshots to semantic operations/inverses.
5. Persistence must migrate from monolithic project blobs to chunked/indexed records suitable for IndexedDB.
6. Large imports must be staged, chunked, validated incrementally, and committed transactionally without multiple complete project clones.
7. Repository and diagram rendering must be virtualized so DOM/SVG size follows the visible working set, not repository size.
8. Routing, layout, validation, and other expensive graph work must be worker-capable and must not monopolize the UI thread.
9. Collaboration must exchange semantic operations/deltas rather than complete project state.
10. No correctness behavior may be disabled merely because a model is large.

## Delivery sequence

Each stage is delivered as a separate PR from the latest merged `main`:

1. Runtime semantic indexes and indexed hot-path lookup.
2. Incremental mutation/index maintenance and dirty dependency tracking.
3. Operation-based undo/redo.
4. Repository virtualization.
5. Diagram viewport/spatial virtualization.
6. Chunked persistence and lazy loading.
7. Worker-backed streaming import and validation.
8. Worker-backed routing/layout and incremental validation.
9. Massive-model collaboration delta qualification.
10. End-to-end 100k/500k/1M scale qualification and profiling closure.

This contract intentionally avoids declaring an arbitrary maximum repository size. Performance should primarily depend on the active working set.
