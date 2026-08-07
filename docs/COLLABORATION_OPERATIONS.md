# Collaboration Operations

Schema version 1 records identity, project/branch/revision, actor and client, timestamp, operation type, semantic and presentation targets, property, before/after/expected values, parent revision, causal dependencies, undo metadata, source, and lifecycle status. Legacy envelopes migrate through `migrateCollaborationOperation`; unsupported types fail validation.

Granular types cover elements, relationships/endpoints, diagrams, presentations, nodes, connector labels/bendpoints, ports, Item Flows, Requirements, verification, reversible baseline/report actions, and atomic batches. `replace-project` and `bulk-import` are recovery/import mechanisms, not the preferred ordinary edit path. Duplicate operation IDs return their original acknowledgement without reapplication.
