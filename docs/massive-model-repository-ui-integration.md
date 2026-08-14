# Massive Model Repository UI Integration

This stage connects the repository virtualization engine from PR #149 to the active Systems Modeler workspace.

## Runtime behavior

- The user-facing Model repository is rendered through `RepositoryViewport`.
- The visible DOM is capped at 160 repository rows plus virtual spacers regardless of semantic repository size.
- Deep scrolling seeks through the visible-subtree index instead of materializing the complete containment tree.
- Collapse state remains stored in project UI state and changes the logical visible-row index.
- Model row selection delegates to the existing semantic selection API.
- Double-click navigation continues through the existing child-diagram command.
- Containment drag/drop commits a semantic `move-element` operation with stable IDs.
- Context actions preserve rename, duplicate, copy, paste, child navigation, and deletion workflows.
- Collaboration presence is mirrored onto visible virtual rows.
- Diagram repository rows are separately windowed and do not render every diagram simultaneously.
- References remain available while the legacy containment renderer is kept off the active UI path.

## Legacy renderer containment

The original `app.js` containment renderer remains present for compatibility with existing editor closures, but after startup it is forced to its References mode and its tree host is hidden. This prevents normal semantic edits, imports, collaboration updates, and selection renders from rebuilding the complete containment DOM.

Large projects persisted outside the legacy localStorage working copy are loaded after the application API is ready, so their active repository rendering is handled by the virtualized repository path.

## Qualification

Browser qualification covers a 100,000-element live project and verifies:

- the logical repository contains 100,001 rows including the model root,
- DOM repository rows never exceed the configured cap,
- deep scrolling remains bounded,
- semantic selection still works from virtual rows,
- containment collapse removes descendants from the visible working set,
- diagram-tab navigation remains functional.

The next scalability stage is diagram viewport virtualization and spatially indexed diagram rendering.
