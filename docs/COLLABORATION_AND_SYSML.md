# Collaboration and SysML Correctness

## Collaboration model

The application uses one Cloudflare Durable Object per project room. Each room has:

- Strongly consistent project state
- A server revision number
- Hibernating WebSocket connections
- Presence tracking
- Element-operation metadata
- Optimistic concurrency using `baseRevision`
- Conflict rejection instead of silent last-writer overwrite
- Commit records
- Durable operation journal entries

A client edit is accepted only when its base revision matches the server revision. A stale client receives the current project and must reapply its change. This avoids silently destroying another user's newer edit.

The next enterprise step is true field-level CRDT/OT merging, identity-provider authentication, role-based permissions, branch merge UI, comments, reviews, and administrative backups.

## SysML correctness model

The repository now defines a SysML 1.6-oriented application profile:

- Metaclass/stereotype mappings
- Valid owners for ports, properties, actions, states, and lifelines
- Required requirement ID and text
- Typed-feature validation
- Flow-property direction validation
- Relationship endpoint validation
- Item-flow conveyed-classifier validation
- Diagram-specific element palettes
- Diagram-specific relationship palettes
- Diagram context validation
- Diagram presentation validation
- Separate semantic relationships from their diagram presentations

The model repository is the source of truth. Diagrams present model elements; they do not create disconnected drawing-only copies.
