# P-04 Requirement Architecture, Allocation, and Applicability

## Pre-implementation assessment

P-04 started from P-03 commit `90f2dae` with a clean tree. The Professional Baseline registry/matrix/audits and P-03 semantic, schema, configuration-resolution, import, operation, and test artifacts were inspected. Requirements already existed as repository `Requirement` elements with stable/internal/external/Requirement IDs, text, lifecycle, priority/risk, verification method, hierarchy helpers, tables, matrices, controlled requirement snapshots, imports, validation, suspect links, collaboration operations, and presentation identity tests. Semantic relationships already used stable records with `sourceId`/`targetId`; the central profile had DeriveReqt, Satisfy, Verify, Refine, Trace, Copy, and Allocate.

Missing behavior was a controlled Requirement Revision identity bound to Configuration Baselines; explicit relationship meaning/direction APIs; explainable Requirement allocation; safe structured applicability conditions and precedence; generalization-aware inheritance/compatibility; typed deterministic query APIs; and P-04-specific structured import. Existing UI and reports sometimes labeled the existence of a Verify relationship as “Verified,” conflating verification intent with credit. P-04 changes that label to **Verify intent** and never awards credit.

The implementation boundary reuses `project.elements`, `project.relationships`, diagram presentations, P-03 Configurations/Baselines, `requirements.js`, suspect links, import, validation, operations, collaboration envelopes, and existing workbenches. It does not implement verification scope, test execution, evidence, pass/fail, credit reuse, or a new repository.

## Canonical Requirement identity and fields

A working Requirement remains one semantic repository element. Its internal `id`, import `externalId`, human `requirementId`, derived qualified name, controlled `currentRevisionId`, and any diagram presentation IDs are distinct. Moving or deleting a presentation does not change the Requirement. Editing text updates the working Requirement without changing its identity.

Normalized fields now include complete text, short title, documentation, rationale, source/locator, extensible category, verification method, risk, criticality, priority, status/lifecycle, version/current Revision, Revision IDs, baseline IDs, creation/modification/provenance, applicability rules, impact metadata, and suspect state. Existing field names are retained. Categories include common stakeholder/business/mission/capability/system/interface/functional/performance/physical/environmental/safety/security/reliability/maintainability/regulatory/design/verification/derived terms, while custom strings remain representable and do not drive ownership or direction.

Project schema is 3.2. Migration adds safe defaults and relationship metadata, records missing legacy identity/text as unresolved, and never invents text, applicability, Revisions, endpoints, direction, or Configuration membership.

## Ownership and decomposition

Semantic ownership remains `ownerId`. A Requirement may own child Requirements with deterministic `requirementOrder`. `addRequirementDecomposition` rejects self-parenting and cycles. Hierarchy is never derived from diagram layout. `DeriveReqt` remains a separate semantic relationship and does not change ownership; a derived Requirement can be in any valid namespace.

## Relationship semantics

| Kind | Directed meaning | Valid endpoints | Applicability | Satisfaction | Verification intent | Verification credit |
| --- | --- | --- | --- | --- | --- | --- |
| Containment/decomposition | parent Requirement owns child | Requirement → Requirement ownership | no | no | no | no |
| DeriveReqt | derived Requirement → source Requirement | Requirement → Requirement | no | no | no | no |
| Satisfy | design/model element → Requirement | non-Requirement → Requirement | no | yes, intent | no | no |
| Verify | TestCase/Activity → Requirement | verification behavior → Requirement | no | no | yes | **no** |
| Refine | detail element → Requirement | semantic element → Requirement | no automatic inheritance | no | no | no |
| Trace | general directed trace | any → any | no | no | no | no |
| Copy | copied Requirement → source Requirement | Requirement → Requirement | no | no | no | no |
| Allocate | Requirement → assigned target for `allocationKind=requirement`; other allocation kinds retain their explicit direction | typed semantic endpoints | no automatic effect | no | no | no |

Copy creates independent Requirement identity; the relationship stores `copyStatus` and edits never alias source text. Every new controlled relationship records stable/external ID, kind, directed endpoints, owner, direction, timestamps, provenance, suspect status, and presentation separately. Removing an edge presentation does not delete its semantic relationship.

## Requirement allocation

`resolveAllocations(project, { requirementId, elementId, context })` returns sorted `results`, structured explanations/reason codes, `unresolved`, `conflicts`, and `validationIssues`. Requirement allocation uses a distinct Allocate record with `allocationKind: "requirement"` and Requirement source. Results preserve the allocated target identity and classify it as direct or inherited.

When querying a specialized Definition, Usage, or Instance, allocation may inherit from a compatible general Definition through explicit Generalization relationships. Allocation resolution invokes applicability separately. It never creates Satisfy, Verify, or applicability semantics and never collapses a Definition allocation into an Instance allocation.

## Applicability targets, effects, and conditions

Targets are Definition, DefinitionRevision, Variant, Usage, Instance, Site/SiteContext, Configuration, and ConfigurationBaseline. Effects are `include`, `exclude`, `conditional`, `not-applicable`, and `unresolved`.

Conditions are data, not code. Supported composition is `{ all: [...] }`, `{ any: [...] }`, and `{ not: ... }`. Leaves use `{ operand, operator, value }`. Supported operators are `equals`, `not-equals`, `in`, `present`, `absent`, `contains`, numeric `lt/lte/gt/gte`, and date `before/after`. Operands use explicit context identities/status/dates, `value.<name>` contextual values, or `configurationItem` presence. Numeric comparisons require numbers; date comparisons require valid dates. Missing context and unsupported operands/operators are unresolved. No `eval`, Function constructor, or arbitrary script is used.

## Deterministic precedence and result

Specificity, not creation time, defines precedence:

1. Configuration Baseline
2. Configuration
3. Site/SiteContext
4. Instance
5. Usage
6. Variant
7. Definition Revision
8. Definition

Only matched conditions participate. Lower-specificity matches are retained in the precedence explanation but do not override a higher-specificity decision. Equally specific conflicting effects return `ambiguous`; none is silently selected. Explicit exclusion returns `excluded`, no matching rule returns `not-applicable`, missing/unsupported information returns `unresolved`, and a matched structured condition returns `conditional-applicable`. Definition rules inherited down Generalization return `classification: inherited`.

`resolveApplicability` returns Requirement ID, status/applicable flag, direct/inherited/conditional classification, matched and rejected rules, precedence decisions, condition results, exact context, missing context, conflicts, unresolved references, machine reason codes, explanations, and `verificationCredit: false`.

## Generalization

Generalization direction is specialized Definition → general Definition. A specialized Instance can fulfill a Usage typed by a general Definition only when an explicit unique path exists. General Definition applicability and allocation inherit downward; specialized-only rules do not apply upward. Circular paths and multiple paths are reported as cycle/ambiguity conflicts. Names, stereotypes, qualified-name similarity, diagrams, and proximity never establish compatibility.

## Requirement Revisions and Configuration Baselines

`RequirementRevision` is an immutable repository element owned by its working Requirement. It has its own stable/external ID, revision label/status/effective dates, predecessor/successor, change type, timestamps/provenance, a recursively frozen Requirement snapshot, and a deterministic content marker. Creating a successor does not mutate the predecessor snapshot. The marker detects changes but is not a cryptographic signature.

A P-03 Configuration may contain an exact RequirementRevision Configuration Item. Baseline capture records `requirementRevisionIds`. `requirementRevisionForBaseline` returns the historical Revision for a Requirement and Baseline. Editing the working Requirement cannot rewrite that snapshot; ordinary editing of an immutable Revision is rejected. Future evidence must reference both the Requirement Revision ID and Configuration Baseline ID/content marker, but evidence storage remains out of scope.

## Suspect links and direct impact

Changes to text, Requirement/Revision identity, verification method, ownership/decomposition, category, or applicability can mark only directly related relationships suspect using the existing suspect-link store. Records preserve relationship identity, source element, reason, date, review/clearance, and disposition. Unrelated Requirements are not invalidated. Applicability is recomputed from current semantic data rather than cached as credit.

## Import and migration

`importRequirementRecords` supports Requirement, RequirementRevision, RequirementDecomposition, RequirementRelationship, and RequirementApplicability workbook-shaped records. Every record requires `recordType` and `externalId`; Requirements additionally require Requirement ID and complete text. References use stable external IDs and must resolve with complete owner chains and typed direction. Dry run is non-mutating, processing is transactional, failure rolls back, provenance is stored, and reimport updates the same mutable identity. Released Requirement Revisions reject mutation. Existing legacy workbook sheets remain optional and supported.

## Operations, collaboration, and UI

Operations cover Requirement and Revision creation, decomposition add/remove, typed relationship creation, applicability upsert/delete, ownership movement, suspect marking/clearing, and existing semantic deletion. Stable record IDs make create/upsert replay idempotent. Collaboration envelopes retain project, branch, revision, actor, client, causal, offline, and conflict metadata; presence cannot mutate semantics.

The existing Requirements workbench now exposes stable/internal/external/Requirement IDs, complete text, qualified name, Revision, Satisfy intent, Verify intent, and applicability count. Focused controls create Requirements, decomposition, typed relationships, allocations, structured conditions, and inspect full applicability explanations. Tables/matrices remain repository projections, not new stores.

## Query API

P-04 exports stable deterministic queries for Requirement by ID, Revision by Baseline, children/ancestors, derived Requirements, allocations in both directions, satisfying/refining/verifying elements, general traces, applicability, suspect links, unresolved relationships, direct change impact, and Generalization-inherited Requirements. Typed results remain separate and include machine reason codes; multiple diagram presentations cannot duplicate semantic query results.

## Validation and limitations

Validation covers required identity/text, scoped Requirement ID and External ID duplicates, ownership/qualified names, decomposition cycles, typed relationship endpoints/direction, duplicate relationships, orphan relationship presentations, applicability targets/conditions/conflicts, Generalization cycles, Revision chains/immutability, Baseline Revision identity, suspect cause, and false Verified claims without passing execution evidence.

Out of scope remains complete unit verification-scope traversal, interface/dependency/regression categorization, plans/procedures/execution, measurements/results/evidence, pass/fail and credit, waivers, approvals, complete regression selection, production deployment, new notation, and enterprise configuration management. Physical XLSX sheets and live two-client convergence are not added. The next stage should consume these typed queries to implement explainable unit verification-scope calculation without awarding credit.
