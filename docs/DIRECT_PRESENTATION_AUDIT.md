# Direct graphical presentation audit

The audit enumerates every semantic element against every supported diagram and records `DIRECT`, `CONTEXTUAL`, or `NOT_DIRECT`, its presentation type, renderer key, and `PASS`/`N/A` status.

## Valid-but-invisible combinations found

All failures were confined to the Sequence Diagram's specialized render path. The general canvas path rendered every allowed node, but `renderSequence` filtered the diagram to Lifelines and messages. Consequently these allowed direct tools created semantic elements and node records that were never appended to SVG:

- `CombinedFragment` + Sequence Diagram
- `InteractionUse` + Sequence Diagram
- `Comment` + Sequence Diagram

They now have explicit Sequence renderers. Lifeline rendering remains unchanged.

## Compatibility mistakes corrected

The Sequence palette also exposed semantic or contextual types that are not valid free-standing direct nodes in the current architecture:

- `Actor` must participate through a Lifeline reference; Actor stick-figure notation remains restricted to diagrams such as Use Case Diagram.
- `ExecutionSpecification` requires a Lifeline.
- `InteractionOperand` requires a Combined Fragment.
- `Gate` requires an Interaction/frame context.
- `TimeConstraint` and `DurationConstraint` require a constrained Sequence occurrence.

These were removed only from the direct Sequence palette. No diagram was made more permissive. Existing semantic instances remain loadable; the renderer emits a diagnostic instead of silently dropping an unsupported contextual node.

## Preserved behavior

Actor on Use Case, Lifeline on Sequence, Block on BDD, Requirement on Requirement Diagram, State on State Machine, Action on Activity, and Constraint Property on Parametric remain direct and visible. Relationships remain endpoint-based edge tools rather than floating nodes. IBD ports and owned properties retain contextual placement validation.
