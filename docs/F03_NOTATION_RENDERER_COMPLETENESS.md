# F-03 notation, renderer, and palette completeness

## Scope and inventory

The repository declares SysML 1.6 and a conservative application profile, while P-03 retains explicit Definition/Usage/Instance roles without relabeling their serialized metaclasses. `supported-type-inventory.js` is the machine-readable vertical-workflow inventory. It records canonical type, metaclass/stereotype, diagrams, creation context, presentation/renderer, palette, properties, compartments, relationship roles, import, persistence, undo/redo, tests, and `complete`, `partial`, or `import-only` status. Existing conformance fixtures—not visual similarity—control `complete` classification. Partial tools remain visible only with an explicit “limited” label and inventory status.

## Eight controlled steps

1. Added the inventory, deterministic renderer descriptors, unsupported diagnostic contract, and completeness audit.
2. Added classifier keywords/abstract display, semantic property notation, association-end labels, and explicit association/generalization/dependency/realization/aggregation/composition contracts.
3. Removed BindingConnector from IBD palettes, retained it for Parametric Diagrams, improved port labels and connector endpoint inspection, and preserved existing IBD attachment/path services.
4. Centralized Requirement display and traceability direction labels without changing P-04 semantics or granting verification/satisfaction credit.
5. Added ConstraintProperty type and BindingConnector endpoint validation, plus constraint expression and ValueType quantity/unit display; no solving or execution was added.
6. Added normal Sequence palette workflows for Lost and Found Messages, explicit open semantic ends, movable open anchors, Lifeline reconnection, persistence, and granular operations without placeholder participants.
7. Added inventory status to palette tools, one-shot tool cancellation, and recoverable diagnostic rendering for unknown/imported types instead of misleading standard shapes.
8. Added deterministic inventory, renderer, notation, palette, open-message, persistence, regression tests and a repository audit.

## Manual acceptance checklist — unexecuted

- [ ] Create/edit every `complete` palette element and relationship listed by the inventory.
- [ ] Confirm complete types never show a question mark, blank shape, or unintended diagnostic/generic fallback.
- [ ] Inspect BDD classifier keywords, stereotypes, abstract names, semantic compartments, property modifiers, roles, multiplicities, navigability, diamonds, triangles, and dashed dependencies/realizations.
- [ ] Inspect IBD parts/references, port types/multiplicities/conjugation/direction, connector ends, nested paths, reconnection, and multiple ItemFlows.
- [ ] Inspect Requirement ID/text wrapping and Satisfy/Verify/Refine/DeriveReqt/Copy/Trace/Allocate labels and stored direction.
- [ ] Inspect ConstraintProperties, parameters, expressions, values, units, ValueTypes, and undirected BindingConnectors; verify invalid endpoints are rejected.
- [ ] Recheck Activity, State, Use Case, and Sequence notation from F-02.
- [ ] Create Lost and Found Messages from the Sequence palette, place open ends, reconnect Lifelines, edit labels, move paths/anchors, delete, undo, and redo.
- [ ] Toggle compartments and resize supported presentations independently.
- [ ] Drag existing semantic elements onto compatible diagrams and confirm unique presentations without semantic duplication.
- [ ] Confirm invalid tools are absent or explicitly limited and rejected placement is actionable.
- [ ] Import/reimport representative BDD, IBD, Requirement, Parametric, Activity, State, Use Case, and Sequence content, including an unknown type.
- [ ] Confirm manual/imported renderer parity and that unknown types remain inspectable diagnostic presentations.
- [ ] Save/close/reopen and verify semantic/presentation IDs, endpoints, labels, compartments, open anchors, and geometry.
- [ ] Undo/redo each repaired category and replay operations idempotently.
- [ ] Recheck F-01 selection/connection/resizing/property behavior and F-02 behavior workflows.
- [ ] Recheck representative P-03 type/usage/instance/configuration and P-04 requirement/allocation/applicability data.
- [ ] Confirm browser startup and ordinary project workflows.

## Boundaries and limitations

No formal conformance status was expanded. Inventory entries lacking dedicated end-to-end fixtures remain `partial`, even when a renderer exists. Live browser pointer/focus/visual acceptance and screenshots remain required. The diagnostic renderer preserves unknown records but does not claim their semantics. No Electron, desktop packaging, P-05, simulation, solving, execution, evidence management, proprietary assets, or collaboration expansion is included.
