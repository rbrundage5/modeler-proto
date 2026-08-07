# Diagram interaction audit

The interaction audit distinguishes semantic elements from diagram presentations and records only behavior supported by the current model profile.

| Diagram | Presentation | Render/select | Move/resize | Attach/reconnect | Status |
|---|---|---|---|---|---|
| BDD | blocks, value/constraint types | yes | regular | relationships use edge endpoints | pass |
| IBD | part/reference properties, ports | yes | regular/boundary | connectors retain endpoint paths | pass |
| IBD | explicitly placed Block | yes | regular | manual definition/reference view only; never auto-generated | pass |
| IBD | owning Block as interior node | **not generated** | n/a | nonvisual frame context accepts boundary ports | correct |
| Use Case | actors, use cases | yes | regular | associations use edge endpoints | pass |
| Requirement | requirements | yes | regular | traceability edges use edge endpoints | pass |
| Activity | actions/control/object nodes | yes | notation-specific geometry | flows use edge endpoints | pass |
| Sequence | Lifeline | yes | horizontal; timeline-only resize | message X is derived from Lifeline | pass |
| Sequence | Message | wide hit target | vertical occurrence move | endpoint reconnect to Lifelines | pass |
| Sequence | Execution Specification | yes when attached | vertical/minimum height | Lifeline parent | partial: creation remains contextual |
| Sequence | combined fragment/interaction use | yes | existing node move/resize model | n/a | pass |
| State Machine | states/pseudostates | yes | regular | transitions use edge endpoints | pass |
| Parametric | constraint/value properties | yes | regular | binding connectors use edge endpoints | pass |
| Package | packages | yes | regular | dependencies use edge endpoints | pass |

## IBD migration

Legacy records marked `isContextBoundary` are retained as stable attachment records, migrated to `DiagramFrameContext`, and excluded from the drawable node set. Semantic owners and legitimate internal presentations are not deleted. New IBDs create only this nonvisual frame-context attachment record.

## Sequence interaction model

Message presentation Y is stored as `occurrenceY`; X is always derived from the source and target Lifeline presentations. Lifeline length is stored independently as `timelineEndY`. Self messages use a loop path. Operations for occurrence movement, endpoint reconnection, timeline resize, and execution resize are granular and replayable.

## Known limitations

Execution Specification placement remains contextual and is not exposed as a dead blank-canvas palette tool. Create/delete messages use distinct line/arrow notation, but automatic target-head relocation and destruction-driven timeline truncation are not yet modeled. Interaction operands and state invariants are not exposed because their semantic ownership workflows are not implemented. Combined-fragment operand editing is limited to operator and guard fields. These are deliberately reported rather than represented as generic free-standing nodes.
