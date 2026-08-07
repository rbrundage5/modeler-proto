# Professional Modeler Baseline 1.0

## 1. Repository version and inspection point

The package reports **10.0.0** and SysML profile **1.6**. Inspection began at commit `d78ec80` on the local `work` branch on 2026-08-07. No Git remote was configured in the provided checkout, so the agent could not fetch or independently prove alignment with GitHub `main`; the dedicated branch was created from that clean inspection point. The README's v7 heading is historical/inconsistent with package metadata and is tracked as PMB-P3-001; this baseline does not change the application version.

## 2. Test environment and initial results

Environment: Linux 6.18.35 x64, Node v24.15.0, npm 11.4.2. The declared runtime is Node `>=22 <23`, so Node 24 produces an engine warning and is a qualification limitation.

| Initial command | Exact result | Existing failure? | Blocks baseline work? |
| --- | --- | --- | --- |
| `npm install` | exit 0; dependencies already current; engine and proxy warnings | environment mismatch | No, but Node 22 rerun required |
| `npm test` | exit 0; 128 passed, 0 failed | No | No |
| `npm run check` | exit 0; structure, UI (47 buttons), environment, Wrangler, interaction, visual audits passed | No | No |
| `npm run import-audit` | exit 0; 4 passed, 0 failed | No | No |
| `npm run versions:dry-run` | exit 0; 95.43 KiB / 20.26 KiB gzip; Durable Object and assets bindings recognized; proxy warning | No | No |

These results confirm the commands on this machine, not browser-wide or production readiness.

## 3. Current architecture and authoritative modules

The application remains browser-native HTML/CSS/JavaScript with an SVG canvas and Cloudflare Worker/Durable Object backend. `model.js`, `semantic-core.js`, and `sysml-profile.js` own semantic records, normalization, and central metamodel rules. `diagram-presentations.js`, `presentation-layout.js`, and `ibd-engine.js` own presentation placement/geometry and IBD specialization. `notation.js`, `sysml-icons.js`, and the SVG rendering paths in `app.js` own notation. The new `sysml/conformance-registry.js` is the authoritative professional capability assessment; `presentation-compatibility.js` consumes it for supported direct placement.

Selection and property UI remain in `app.js` with semantic property policy in `semantic-editor.js`. `importer.js`, `import-reconciliation.js`, and `import/` own import/reimport. Project JSON/browser persistence is orchestrated by `app-base.js`, `projects.js`, and model normalization. `validator.js` owns validation. `operations.js`, `collaboration.js`, `collaboration-operation.js`, the revision journal, and `worker/index.js` own undoable operations and collaboration. `requirements.js`, requirements table/matrix/report modules, and `verification-model.js` own requirements and verification workbenches.

Semantic elements remain authoritative and diagram nodes/edges remain presentations. Existing identity tests confirm multiple presentations do not duplicate semantics and presentation deletion preserves the semantic element. IBD context normalization uses a nonvisual frame context rather than a mandatory duplicate owner Block.

## 4–6. Supported diagrams, semantic elements, and relationships

The nine currently claimed diagram types are BDD, IBD, Requirement, Use Case, Activity, State Machine, Sequence, Parametric, and Package. All are registry-covered and currently **partial** at whole-diagram maturity because no single fixture qualifies every required interaction. `Instance Diagram` exists in the older profile but is outside this claimed baseline pending PMB-P2-006.

The profile defines classifier/package types; Block features and ports; Requirements and Test Cases; use-case, activity, state-machine, sequence, instance/configuration, and comment types. The exact valid direct presentation subset is enumerated per diagram in the generated conformance matrix. Sequence deliberately accepts Actor participation only through a Lifeline rather than direct Actor notation.

Registered relationships include structural Association variants, Generalization, dependencies/realizations, Composition/Aggregation, IBD Connector/Delegation/ItemFlow, BindingConnector, interface contracts, requirement relationships, Allocate, Use Case Include/Extend, activity flows, Transition, Message, and VariantBinding. Endpoint rules are machine-audited; complete relationship-specific workflow evidence remains partial.

## 7. Capability matrix summary

The registry contains **86 valid diagram-element combinations**: **9 working**, **77 partial**, **0 broken**, **0 missing**, **0 not-applicable**, and **0 not-tested** at the combination's overall maturity field. Individual operation cells in the human matrix use `not-applicable` for non-palette/contextual or fixed-size behavior and `not-tested` where a complete fixture is absent. A working combination must name an existing fixture; the audit enforces this rather than allowing implementation-only promotion.

## 8. Diagram maturity matrix

| Diagram | Context | Overall maturity | Evidence / principal limitation |
| --- | --- | --- | --- |
| Block Definition | model/package | partial | Block identity workflow is working; complete palette and relationship sweep absent |
| Internal Block | Block | partial | extensive IBD engine tests; complete inherited/nested UI workflow not unified |
| Requirement | model/package | partial | requirement persistence/workbench tests; complete diagram interaction sweep absent |
| Use Case | model/package | partial | Actor/UseCase placement verified; remaining relationships partial |
| Activity | Activity | partial | renderer/compatibility tests exist; complete behavior workflow unqualified |
| State Machine | StateMachine or Block | partial | notation and basic interactions exist; complete workflow unqualified |
| Sequence | Interaction, Block, or UseCase | partial | specialized interaction tests; actor-classified integrated UI flow incomplete |
| Parametric | Block or ConstraintBlock | partial | binding rules exist; full workflow unqualified |
| Package | model/package | partial | basic presentation exists; full workflow unqualified |

## 9. Interaction maturity

Selection, movement, eight-direction resize, boundary movement, label movement, connector routing, reconnect, property operations, presentation deletion, and operation replay are confirmed in focused unit tests for applicable subsets. Undo/redo and JSON reload have identity and specialized tests. They are **partial globally** because no DOM/browser fixture exercises every presentation and safe field-commit timing (focus retention, documentation, external ID, multiplicity, requirement text, compartment toggles) as one workflow. Invalid direct placement is rejected before node creation with a compatible-target explanation.

## 10. Import/export maturity

Profile parsing, header recognition, aliases, row provenance, reconciliation identity, owner chains, relationship resolution, geometry preservation, dry-run decisions, rollback, and no-root-fallback behavior have focused tests. Import is **partial**, because real anonymized workbook fixtures do not cover every diagram/element combination and the benchmark does not time XLS/XLSX parsing. CSV/XLSX/JSON/printable reports and existing model export paths are implemented but are not interoperability certification.

## 11. Collaboration maturity

Client identity, queue persistence, acknowledgement, conflict decisions, retries, branches, presence throttling, operation metadata, deterministic replay, fine-grained rebase, and several semantic operations have unit evidence. Collaboration is **partial** until a local two-client Durable Object integration gate demonstrates convergence for the complete operation set. No production credentials are required by ordinary tests.

## 12. Requirements and verification maturity

Requirement policies, hierarchy and moves, tables, matrices, Test Cases, executions, coverage, baselines, suspect links, impact analysis, reports, import reconciliation, batch operations, and collaboration replay have substantial automated evidence. The workbench is **partial** as a complete user-visible browser workflow and external tool interoperability remain unqualified.

## 13–14. Performance evidence and gaps

Measured Node results are in `docs/PERFORMANCE_BASELINE.md`: 1k/10k semantic projects, 100/1k presentations, 1k/5k relationships, workbook-like rows, 10k journal operations, and 5k queued operations. The final 10k run measured 6,142.30 ms normalization and 2,906.92 ms validation with zero validation issues. No targets exist, and no browser FPS, interaction latency, real workbook throughput, network latency, simultaneous users, or production percentiles were measured.

## 15–16. Known limitations and prioritized backlog

Key limitations are incomplete per-combination workflow evidence, partial sequence UI qualification, incomplete real-workbook import coverage, absence of two-client local integration, large-model normalization/validation cost, and ambiguity around experimental Instance Diagram support. The controlled backlog is `docs/PROFESSIONAL_STABILIZATION_BACKLOG.md`: **P0 0, P1 0, P2 6, P3 2**. The baseline does not infer that undiscovered high-priority defects are absent.

Confirmed behavior is marked `working` only with a fixture. Implemented but incompletely qualified behavior is `partial`. No currently reproduced workflow is classified `broken` in this baseline. Planned qualification is backlog-linked. Unsupported direct combinations are explicitly rejected and absent from the valid matrix.

## 17. Release gates

Baseline qualification requires application startup; supported Node 22; `npm test`, `npm run check`, `npm run import-audit`, `npm run conformance-audit`, and supported-environment `npm run versions:dry-run`; no syntax failures; visible renderers/icons for every valid palette/drop; actionable invalid-placement rejection; identity and save/reload/reimport tests; matching generated docs; measured rather than estimated performance; and recorded defects. Passing these gates means only that this baseline is internally consistent—it is not professional-readiness, certification, or vendor compatibility.

At inspection the legacy gates passed on unsupported Node 24. Final results must be recorded in the pull request. Manual browser workflow verification and Node 22 execution remain required before release qualification.

## 18. Recommended milestones

1. **Next focused PR:** PMB-P2-001, beginning with a parameterized DOM workflow harness for BDD and Requirement properties, focus-safe commits, presentation deletion, undo/redo, and reload.
2. Add real anonymized import golden fixtures (PMB-P2-003).
3. Add a local two-client Durable Object convergence suite (PMB-P2-004).
4. Profile and index normalization/validation under Node 22 before setting performance budgets (PMB-P2-005).
5. Make an explicit product decision for Instance Diagram and align historical README labels.
