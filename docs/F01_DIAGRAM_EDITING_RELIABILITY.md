# F-01 diagram editing reliability

## Baseline and scope

F-01 starts at merge `dbbc072`, the browser baseline that merged the explicit D-01 revert. The baseline already contains the P-03 semantic/configuration foundation and P-04 requirement allocation/applicability foundation. No Electron entry point, preload, packaging configuration, or Electron dependency is present.

The architecture assessment found substantial partial interaction work already centralized in `diagram-presentations.js`, `presentation-capabilities.js`, `presentation-compatibility.js`, `connector-engine.js`, `sequence-interactions.js`, `presentation-layout.js`, `notation.js`, and `operations.js`. F-01 preserves those services rather than introducing per-diagram engines.

## Root causes and changes

* Selection calculations were embedded in DOM handlers, making narrow-edge hit testing, overlapping presentation ordering, marquee semantics, and group geometry difficult to verify consistently. `diagram-interactions.js` now supplies notation-neutral hit testing, selection-set updates, marquee selection, and group movement contracts. Invisible frame contexts are excluded from normal hit testing.
* Node multi-selection now delegates to the shared selection-set contract. Marquee selection delegates to the same shared geometry layer; Alt-marquee deliberately selects intersecting presentations while the default requires full containment.
* Deleting a selected relationship presentation previously deleted the semantic relationship and all of its presentations. Edge-presentation removal is now a distinct operation. Semantic relationship deletion remains explicit and confirmed when selection has no presentation context. Multi-selected nodes are removed as presentation records through a replayable batch operation.
* Compartment visibility was stored only on the semantic element. A node presentation now owns visibility overrides under `presentationOptions.compartmentVisibility`; semantic compartments and their rows remain repository data. The operation is serializable, rebase-aware, persistent, undoable through existing snapshots, and independent across multiple presentations.
* Legacy nodes acquire presentation options only when a presentation-specific setting is changed. Existing semantic visibility remains the default, preserving byte-stable legacy diagram records.

Existing shared services continue to provide endpoint validation and direction, obstacle-aware routing, bendpoints, endpoint reconnection, label positioning, sequence-message occurrence editing, Lifeline timeline resizing, diagram-specific palettes/renderers, content-aware minimum sizes, containment placement without semantic duplication, focus-safe blur commits, transactional imports, persistence, collaboration envelopes, and undo/redo.

## Compatibility

The project schema remains backward compatible: presentation options are additive and created lazily when used. No semantic ownership, relationship direction, External ID, qualified name, P-03 configuration data, or P-04 requirement data is derived from diagram geometry. D-01, P-05, automatic updating, test-execution/evidence scope, and proprietary assets are excluded.

## Manual acceptance checklist

The following requires a live browser session and must be recorded as executed or unexecuted, never inferred from unit tests:

- [ ] Create and select every palette-supported node type on each applicable diagram.
- [ ] Select thin, overlapping, self-loop, and multiply-routed relationships along their visible paths.
- [ ] Exercise single, additive, toggle, containment-marquee, and Alt intersecting-marquee selection.
- [ ] Move one presentation and a selected group; confirm relative geometry and attached connectors.
- [ ] Resize applicable nodes from all eight handles; resize a Lifeline timeline.
- [ ] Create, reconnect, reroute, label, and remove a relationship presentation.
- [ ] Explicitly delete a semantic relationship and confirm every presentation is removed.
- [ ] Create, select, move, edit, and reconnect Sequence messages to Lifelines.
- [ ] Add, move, reconnect, and inspect ports and connector ends.
- [ ] Edit names, documentation, requirement text, multiplicities, labels, message text, operation text, and constraints without focus or caret loss.
- [ ] Toggle different compartments on two presentations of one semantic element and verify independent state and semantic rows.
- [ ] Drag an existing semantic element from containment onto two diagrams and verify stable semantic identity, ownership, External ID, and unique presentation IDs.
- [ ] Attempt package, diagram, relationship, duplicate, and incompatible containment drops and verify actionable rejection.
- [ ] Import a representative legacy JSON project and edit its imported presentations.
- [ ] Import and reimport a representative workbook; verify IDs, ownership, relationship direction, requirement text, provenance, geometry, and no duplicates.
- [ ] Save/reload and verify semantic IDs, presentation IDs, geometry, endpoints, bendpoints, labels, Lifeline lengths, and compartment visibility.
- [ ] Undo and redo placement, movement, group movement, resize, reconnection, bendpoint, label, compartment, presentation removal, and semantic deletion operations.
- [ ] Remove one of multiple node and relationship presentations without deleting the semantic object.
- [ ] Start the browser application and smoke-test P-03 type/usage/instance/configuration and P-04 requirement allocation/applicability behavior.

## Known limitations and deferred work

Live pointer and focus behavior still requires the checklist above; deterministic tests do not constitute browser automation. Execution Specification creation remains contextual, and the Sequence limitations documented in `DIAGRAM_INTERACTION_AUDIT.md` remain deliberate. F-01 does not expand formal conformance claims. The next refinement should add maintained browser automation for this checklist before extending notation or verification scope.
