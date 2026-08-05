# Production-oriented architecture (v3)

## Collaboration

- Server-authoritative operations; clients no longer send a full model for ordinary edits.
- SQLite-backed Durable Object tables for branches, operations, commits, members, and locks.
- Per-branch ordered revision numbers and immutable operation journal.
- Field-aware optimistic rebasing: stale independent edits can be accepted; same-field edits become explicit conflicts.
- Presence over hibernating WebSockets.
- Soft resource locks for imports, package moves, deletion, and other high-impact work.
- Cloudflare Access identity header support, with owner/editor/viewer repository roles.
- Branch creation/switching and branch-specific snapshots and commit history.
- Atomic whole-project replacement is reserved for imports, project opening, and undo/redo.

## SysML repository

- Semantic elements, semantic relationships, diagrams, and presentations are separate records.
- Diagram-specific palettes and validation rules.
- Owner-kind rules for properties, ports, activity nodes, states, and lifelines.
- Relationship endpoint rules for connectors, binding connectors, requirement relations, behavior flows, transitions, and messages.
- Requirement ID/text and typed-feature validation.
- Diagram owner and context validation.

## Still required before claiming commercial-product parity

- Full field-level CRDT text editing for simultaneous documentation editing.
- Authentication UI and administrator member-management UI.
- Three-way branch merge and visual conflict-resolution UI.
- Specialized sequence/activity/state/parametric editors and layout engines.
- Complete connector-end nested property paths and port-interface compatibility solver.
- XMI/ReqIF interchange and licensed CATIA import-profile testing.
- Full automated browser, load, security, and semantic conformance tests.
