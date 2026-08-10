# F-02 behavior and sequence diagram completion

## Eight controlled steps

1. **Behavior semantics:** behavioral elements and relationships receive stable, typed fields for references, direction, order, containment, triggers, effects, carried types, extension points, and interaction operators. Semantic and presentation IDs remain separate.
2. **Lifelines:** a Lifeline explicitly references a represented Actor, classifier, usage, instance, part, or reference. Dropping a valid participant on a Sequence Diagram creates a Lifeline referencing—not duplicating—the participant. Lifeline movement remains horizontal and timeline resizing remains presentation state.
3. **Messages and executions:** messages retain semantic source/target direction and sequence order; synchronous, asynchronous, reply, create, delete, signal, self, lost, and found geometry are explicit. Execution Specifications are contextual Lifeline children with vertical movement and resizing; they are never auto-created.
4. **Interaction structure:** all twelve exposed operators are persisted and rendered. Interaction Operands are semantic children of Combined Fragments and presentation children of fragment presentations, with guard separators and group movement.
5. **Activities:** ControlFlow and ObjectFlow use distinct endpoint validation. ObjectFlow carried types and Action behavior references are editable. No execution or simulation is introduced.
6. **State/use case:** Transition triggers, guards, effects, and labels persist without direction inference. Include and Extend have explicit stereotypes and source-to-target semantics; Extend may reference a target Use Case extension point.
7. **Access/import:** contextual sequence tools use the shared palette/placement service. Properties remain focused sections with blur commits. Behavior import preserves represented elements, behavior references, order, endpoint presentation IDs, occurrence geometry, labels, triggers, carried types, and extension points; absent geometry uses deterministic layout.
8. **Persistence/regression:** focused deterministic tests cover semantic/presentation identity, Lifelines, all message kinds, reconnection, executions, fragments/operands, activities, transitions, use cases, imports, replay, and F-01 integration. Existing persistence, snapshot undo/redo, and operation publication remain in use.

## Scope safeguards

The browser architecture, semantic repository, diagram engine, F-01 interaction services, importer transaction, and operation protocol are retained. Diagram coordinates never establish semantic identity, ownership, or relationship direction. F-02 adds no Electron work, automatic updates, simulation, activity execution, state execution, P-05 scope calculation, verification credit, collaboration expansion, proprietary assets, or new conformance claims.

## Manual acceptance checklist (unexecuted unless marked)

- [ ] Create Lifelines from the palette and by dropping existing valid participants; inspect the explicit represented-element reference.
- [ ] Select Lifeline headers and dashed timelines; move horizontally and resize vertically.
- [ ] Create, select along the full path, label, vertically move, reconnect, and presentation-delete every supported message kind.
- [ ] Create self, lost, and found messages and verify explicit endpoints/anchors and direction.
- [ ] Create an Execution Specification on a Lifeline; move and resize it without automatic creation from unrelated messages.
- [ ] Create each exposed Combined Fragment operator; add/remove operands, edit guards, move the fragment group, and resize it.
- [ ] Create and connect all supported Activity nodes; verify invalid ControlFlow/ObjectFlow combinations are rejected.
- [ ] Edit Action behavior references and ObjectFlow carried types.
- [ ] Create State transitions and edit triggers, guards, effects, entry, do, and exit behavior; reconnect without reversing direction.
- [ ] Create Include and Extend relationships and verify semantic direction and extension-point selection.
- [ ] Drag existing behavior elements from containment and verify no semantic duplication.
- [ ] Save, close, reopen, and verify semantic IDs, presentation IDs, references, ordering, endpoints, geometry, fragment containment, and labels.
- [ ] Import and reimport representative behavior content; verify stable identities, ownership, provenance, direction, ordering, references, and explicit geometry.
- [ ] Undo and redo every repaired mutation class.
- [ ] Recheck F-01 selection, connection, compartment, resizing, presentation deletion, and focus-safe editing.
- [ ] Recheck representative P-03 configuration and P-04 requirement/allocation/applicability data.

## Known limitations

Live pointer/focus/visual acceptance requires the checklist above. Lost/found messages use explicit presentation anchors and are currently created through imported data or model operations rather than dedicated palette tools. Execution Specifications are manually contextual; calls do not auto-create them. Fragment nesting moves presentation children but does not change unrelated semantic ownership. Behavior execution and simulation remain deliberately unsupported.
