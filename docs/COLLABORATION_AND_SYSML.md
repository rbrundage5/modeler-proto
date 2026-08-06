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

# Real-time collaboration reliability

Two modelers can open the same room link on separate devices and work on the same branch. The Durable Object remains authoritative: it serializes accepted semantic operations, assigns monotonically increasing revisions, persists branch snapshots, and broadcasts operations to every device on that branch.

The browser now keeps a stable guest session identity across reconnects and persists unacknowledged operations per room and branch. Offline edits are resent after the authoritative snapshot arrives and are removed only after server acknowledgement. Duplicate operation IDs are acknowledged idempotently, so a lost acknowledgement cannot create duplicate elements or relationships. After replaying an offline operation, the client requests a canonical snapshot to guarantee that its UI matches the room.

Concurrent edits to independent fields continue to rebase automatically. A same-value conflict pauses that operation instead of retrying forever. The modeler explicitly chooses either the latest room value or reapplying the local value. Permission, validation, and lock failures remove the rejected operation from the retry queue and remain visible in the activity log.

Presence reports name, role, device metadata, last activity, active diagram, and selected element. The header shows both connected users and operations waiting to synchronize. Locks are isolated by branch, expire automatically, and survive reconnects because guest identity is stable. Undo and redo publish their resulting project state so other devices do not silently diverge.

## Two-device manual test

1. Open the same copied room URL in two separate browser profiles or devices and use different display names.
2. Confirm both names appear in the presence tooltip. Select an element on device A and confirm device B reports what A is editing.
3. Rename different elements simultaneously and confirm both changes appear on both devices with increasing, matching revisions.
4. Edit the same property on both devices, choose each conflict resolution option in turn, and confirm both devices converge on the selected value.
5. Disconnect device B, create elements and relationships, reconnect, and confirm the queued count returns to zero without duplicates.
6. Lock an element on device A, confirm device B cannot edit it, unlock it, and confirm editing resumes. Switch branches and confirm locks do not leak between branches.
7. Undo and redo on one device and confirm the other device receives the result. Refresh both devices and confirm the complete SysML model and diagrams reload identically.

## Deployment note

Production rooms should use Cloudflare Access or the `X-Modeler-User` identity header. Stable browser session IDs are intended for unauthenticated guest collaboration and are not a substitute for authenticated authorization.
