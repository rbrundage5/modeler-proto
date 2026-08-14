# Massive Model Operation History

Undo/redo for massive repositories must be proportional to the edit impact, not the total project size.

## Contract

- Do not store complete project JSON or structured-clone snapshots for routine undo checkpoints.
- Store the forward semantic/presentation operation plus its inverse.
- Structural deletes snapshot only the deleted subtree, affected relationships, and affected presentations.
- Grouped UI commands are one history transaction and undo in reverse operation order.
- History is bounded by both entry count and byte budget.
- Recording an edit uses indexed stable-ID lookup and indexed adjacency rather than repository scans.
- Undo/redo applies through the incremental mutation/index layer and dirty-set normalization.
- Import, external load, migration, and recovery remain full-project transactional boundaries and are not modeled as thousands of ordinary UI undo entries.

## Current compact operation families

The history layer supports property edits, element moves, node movement/resizing, sequence occurrence/anchor edits, edge geometry, relationship endpoint changes, element/relationship/diagram creation and deletion, presentation creation/removal, grouped operations, and subtree-scoped restoration.

Operations not explicitly supported by the compact history layer must not silently fall back to storing an entire project snapshot. They remain non-recorded until a bounded inverse is defined.

## Scale qualification

The qualification suite includes a one-million-element repository where an isolated property edit records a history entry whose footprint remains in the KB range, plus bounded-memory repeated-edit tests, structural delete/restore tests, and grouped transaction tests.
