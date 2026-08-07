# Professional Stabilization Backlog

Priority definitions: **P0** data loss, corruption, security failure, or startup failure; **P1** broken core modeling or invalid/invisible output; **P2** important incomplete/inconsistent workflow; **P3** lower-impact visual, usability, or documentation issue. Baseline totals: **P0 0, P1 0, P2 6, P3 2**. Absence of a known P0/P1 is not proof that none exist.

## PMB-P2-001 — Complete combination workflow qualification

- **Subsystem:** all nine diagrams; **Priority / scope:** P2 / large.
- **Current / expected:** 77 of 86 valid diagram-element combinations lack a dedicated complete workflow fixture; each claimed working combination should qualify create/place/render/edit/connect/delete/undo/save behavior as applicable.
- **Reproduction:** inspect `docs/SYSML_CONFORMANCE_MATRIX.md` rows carrying this ID and run `npm test`.
- **Likely owner / impact:** presentation controllers, notation renderer, operations; users cannot distinguish implementation presence from a proven workflow.
- **Acceptance criteria / regression:** add parameterized browser-capable workflow fixtures, then promote only passing registry rows; the conformance audit must reject fixture-free `working` claims.
- **Dependencies:** stable DOM harness and fixture project factory.

## PMB-P2-002 — Qualify complete Sequence editing

- **Subsystem:** Sequence Diagram; **Priority / scope:** P2 / medium.
- **Current / expected:** lifeline/message geometry, reconnect, ordering, undo, and persistence have focused unit evidence, but actor-classification creation and the complete label/property UI workflow are not end-to-end qualified; all supported sequence workflows need one integrated fixture without claiming unsupported fragments.
- **Reproduction:** run `node --test test/sequence-interactions.test.mjs` and compare its coverage to the matrix.
- **Likely owner / impact:** `sequence-interactions.js`, `app.js`; users face unmeasured gaps across otherwise implemented operations.
- **Acceptance criteria / regression:** integrated Actor-classified Lifeline, message label, timeline resize, order, undo/redo, and reload test; unsupported kinds remain rejected with a reason.
- **Dependencies:** PMB-P2-001 test harness.

## PMB-P2-003 — Import owner/context qualification with real workbooks

- **Subsystem:** import/reimport; **Priority / scope:** P2 / large.
- **Current / expected:** reconciliation unit tests cover ownership, identity, rollback, and no root fallback, but the full matrix of real vendor-shaped BDD/IBD diagrams, navigation, ports, connectors, and ItemFlows is incomplete; supported profiles need anonymized golden workbooks and exact dry-run assertions.
- **Reproduction:** run `npm run import-audit`; observe that it audits profile parsing only.
- **Likely owner / impact:** `importer.js`, `import-reconciliation.js`, import profiles; uncommon workbook layouts may remain unresolved.
- **Acceptance criteria / regression:** golden end-to-end imports preserve IDs, complete owner chains, context, geometry, provenance, and reimport identity, with transactional failure fixtures.
- **Dependencies:** redistributable anonymized workbook fixtures.

## PMB-P2-004 — Multi-client collaboration qualification

- **Subsystem:** collaboration; **Priority / scope:** P2 / large.
- **Current / expected:** operation and client unit tests cover replay, conflict, offline queues, presence, and branch settings, but no local two-client Durable Object integration gate qualifies all modeling operations; deterministic two-client convergence is expected without production credentials.
- **Reproduction:** run collaboration tests and note they use client/operation fixtures rather than a live local worker pair.
- **Likely owner / impact:** `collaboration.js`, `operations.js`, `worker/index.js`; concurrency behavior is not fully evidenced.
- **Acceptance criteria / regression:** local worker integration proves semantic/presentation creation, geometry, properties, relationships, idempotency, conflicts, offline replay, presence isolation, and branch isolation.
- **Dependencies:** deterministic local WebSocket harness.

## PMB-P2-005 — Normalize and validate 10k models efficiently

- **Subsystem:** semantic normalization and validation; **Priority / scope:** P2 / medium.
- **Current / expected:** the final synthetic 10k model required 6,142.30 ms normalization and 2,906.92 ms validation on the measured host; establish profiled budgets and remove avoidable repeated scans without semantic changes.
- **Reproduction:** run `npm run benchmark` on the documented environment.
- **Likely owner / impact:** `model.js`, `semantic-core.js`, `validator.js`; large-project load/validation may feel slow.
- **Acceptance criteria / regression:** profile hotspots, agree supported-runtime budgets, add a non-flaky performance gate, and demonstrate equivalent normalized/validation output.
- **Dependencies:** Node 22 controlled runner and accepted budgets.

## PMB-P2-006 — Resolve Instance Diagram claim boundary

- **Subsystem:** diagram catalog; **Priority / scope:** P2 / small.
- **Current / expected:** `sysml-profile.js` contains an Instance Diagram while product documentation and the professional baseline claim nine diagram types; decide whether it is experimental/hidden or qualify it and add it to the registry.
- **Reproduction:** compare `DIAGRAMS` in the profile with `CLAIMED_DIAGRAM_TYPES`.
- **Likely owner / impact:** profile, palette, docs; developers may mistake profile presence for supported status.
- **Acceptance criteria / regression:** explicitly label the type experimental or add complete registry/matrix/audit coverage; catalog test enforces the decision.
- **Dependencies:** product scope decision.

## PMB-P3-001 — Align historical README version headings

- **Subsystem:** documentation; **Priority / scope:** P3 / small.
- **Current / expected:** at inspection the first README heading said v7 while package metadata reported 10.0.0; this baseline now identifies 10.0.0 as authoritative and labels the overview historical without changing the package version. **Status: resolved in baseline.**
- **Reproduction:** compare `README.md` heading with `package.json`.
- **Likely owner / impact:** README; readers may infer the wrong current release.
- **Acceptance criteria / regression:** current-version scope statement plus explicit historical headings; documentation audit checks package-version mention.
- **Dependencies:** release naming decision.

## PMB-P3-002 — Capture browser rendering performance evidence

- **Subsystem:** SVG UI; **Priority / scope:** P3 / medium.
- **Current / expected:** Node timings exist, but no controlled frame-rate, interaction-latency, or SVG stress evidence exists; define reproducible browser measurements before setting targets.
- **Reproduction:** review `docs/PERFORMANCE_BASELINE.md`.
- **Likely owner / impact:** SVG renderer and interaction controllers; visual performance claims cannot be evaluated.
- **Acceptance criteria / regression:** scripted browser scenarios, trace artifacts, machine metadata, and agreed non-flaky targets.
- **Dependencies:** browser automation environment and PMB-P2-005 profiling.
