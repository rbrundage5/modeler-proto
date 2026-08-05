# Interface and Feature Integrity

The v5 interface preserves all v4 modeling and collaboration features while removing deceptive controls. Application menus invoke the same tested command handlers as the toolbar. Context-sensitive commands are disabled until they can succeed.

## Context rules

- Undo and redo reflect actual local history.
- Delete requires a selected element, relationship, or presentation.
- Child Diagram requires a Block, Activity, StateMachine, or Interaction.
- Commit, branch, merge, lock, and unlock require an active collaboration connection.
- Lock and unlock also require a selected semantic element.
- Route requires at least one relationship presentation on the active diagram.

## Automated audit

`scripts/ui-audit.mjs` checks that every visible command button has a corresponding action binding and that button IDs are unique.
