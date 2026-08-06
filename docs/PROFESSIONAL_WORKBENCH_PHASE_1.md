# Professional Modeling Workbench — Phase 1

The workbench is an original desktop-oriented SysML interface. It preserves the existing repository, diagram editor, properties, operations, validation, collaboration, import, and engineering subsystems while adding a local presentation shell around them.

## Layout and workspaces

The shell contains the command header, Model Explorer, central document area, Properties inspector, Validation/Output panel, and status bar. Keyboard-accessible splitters resize the Explorer, Properties, and bottom panel within guarded limits. The **View** menu hides or restores panels without discarding state.

Presets are **Modeling**, **Structure**, **Requirements**, **Behavior**, **Validation**, and **Custom**. Each preset selects panel visibility, dimensions, bottom tab, and preferred toolbar category. Layout changes are stored separately in `systems-modeler.workbench.v1.<project-id>` rather than in semantic elements or collaboration operations.

## Documents and navigation

Opening a diagram adds one stable-ID document tab. Opening it again activates the existing tab. Closing a tab never deletes its diagram; **Reopen** restores recently closed tabs. Ctrl+Tab and Ctrl+Shift+Tab cycle tabs, while Ctrl+W closes the active tab. Back, Forward, recent diagrams, and ID-based breadcrumbs record diagram navigation rather than selection noise.

Phase 1 stores the model for a two-group split (`vertical` or `horizontal`). The Split button enables the second group contract; independent dual canvas rendering remains a known limitation.

## Model Explorer and Properties

Explorer modes include Containment, Diagrams, Types, Requirements, Recent, and Favorites. Search matches names, qualified names, stable/external IDs, requirement IDs, kinds, stereotypes, and documentation without changing semantic data. Favorites are browser-local.

Properties retain every existing field and organize access through General, Documentation, Semantics, Relationships, Presentation, Validation, and History navigation. Multi-selection common-value rules report mixed values rather than silently overwriting incompatible fields. Documentation continues to use the established blur/operation editing flow; existing Markdown text is preserved without requiring a service.

## Validation and commands

The Validation Center supplies severity/rule search, refresh, JSON export, counts, and double-click navigation to a relevant diagram or semantic element. The shared bottom panel also preserves Activity, Import Report, Collaboration, and Diagnostics views.

Commands have stable IDs, labels, category, icon reference, enabled/visible predicates, shortcut, execution function, and undoability metadata. Ctrl+Shift+P opens the searchable command palette. F6 cycles major panels, Alt+Left/Right retains diagram history, and Escape continues to cancel transient editing tools.

## Persistence and migration

Projects without workbench preferences migrate to Modeling with Explorer and Properties visible, Validation available, the active diagram opened as the first tab, and no split. Project switching removes stale tab and favorite IDs. Workbench preferences remain local and never publish semantic collaboration operations.

## Manual acceptance test

1. Drag and keyboard-resize all three splitters; reload and confirm sizes.
2. Hide and restore Explorer, Properties, and Validation from **View**.
3. Switch every workspace preset and confirm the diagram stays open.
4. Open several repository diagrams, close/reopen tabs, and use Back/Forward and breadcrumbs.
5. Filter the Explorer, favorite a result, and switch to Favorites.
6. Run validation, filter issues, and double-click an issue.
7. Press Ctrl+Shift+P and execute Validate Project and Reset Layout.
8. Switch projects and confirm each project restores its own tabs/layout.
9. Confirm BDD/IBD editing, connectors, undo/redo, import, and collaboration still operate.

## Known limitations

- Phase 1 persists a two-group split contract but renders one active editor canvas at a time.
- Markdown documentation is stored and edited safely, but rich Markdown preview is deferred.
- Large trees are incrementally capped to 250 search results; full tree virtualization is deferred.
