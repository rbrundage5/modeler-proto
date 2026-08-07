# P-03 Semantic Hierarchy and Configuration Foundation

## Implementation assessment

The merged Professional Modeler Baseline at `748ce6d` was inspected before implementation. Existing reusable concepts were sound: repository elements have stable semantic IDs and owners; diagram nodes/edges store presentation IDs and geometry separately; `Block` and other classifiers are reusable types; typed Properties are contextual features; `InstanceSpecification`, `Slot`, `Variant`, and `Configuration` already existed; operations, JSON normalization, import reconciliation, requirements, revisions, and collaboration envelopes were reusable. Baseline identity tests confirmed that placing or deleting a presentation does not create or delete its semantic element.

Missing concepts were explicit semantic roles, Sites, Definition Revisions, controlled Configuration Items, immutable configuration baselines, explainable configuration resolution, and typed requirement applicability. Existing `Configuration` and `InstanceSpecification` records were previously little more than generic elements; a Variant was not connected to exact configuration content. Requirement trace relationships did not mean applicability and remain separate.

The implementation boundary is deliberately narrow: extend the existing `project.elements` repository, normalization, validation, operations, import, and Configurations workbench. It does not create a parallel semantic store, change the diagram engine, calculate verification scope, grant verification credit, execute tests, or store evidence. Migration risk is low-to-medium because schema 3.0 projects receive metadata and explicit inferred roles only where the existing SysML kind is unambiguous. Compatibility risk centers on legacy untyped Properties and Instances, which remain unresolved and are reported rather than fabricated.

## Semantic roles and existing SysML mappings

| Semantic role | Existing representation | Important identity/reference fields |
| --- | --- | --- |
| Definition | Block, InterfaceBlock, ConstraintBlock, AssociationBlock, ValueType, DataType, Enumeration, Signal | `id`, `externalId`, `ownerId`, `revisionIds`, `variantIds`, lifecycle and documentation |
| Usage | PartProperty, ReferenceProperty, ValueProperty, FlowProperty, ConstraintProperty, ProxyPort, FullPort | `definitionId`/`typeRef`, `roleName`, multiplicity, composition, `siteContextId`, overrides, redefinition/subset IDs |
| Instance | InstanceSpecification | `definitionId`, `fulfilledUsageId`, instance/serial/asset identity, Site, installed/lifecycle status, effective dates, slots |
| Site | SiteContext (explicit kind; never inferred from Package) | stable identity, site code, location, owner and lifecycle |
| Variant | existing Variant element | stable variant code and status; distinct from Revision |
| Definition Revision | DefinitionRevision owned by its Definition | `definitionId`, revision label, status and effective dates |
| Configuration | existing Configuration element | purpose/status/Site/parent, controlled embedded items, baseline ID and approval metadata |
| Configuration Item | value record embedded in one Configuration | target type/ID, exact Definition Revision, Variant, Site, values and relationship IDs |
| Configuration Baseline | `project.configurationBaselines` immutable snapshot record | source configuration, version/approval, timestamp, snapshot, deterministic content ID, predecessor |
| Requirement applicability | typed rules on an existing Requirement | target type/ID, include/exclude effect, condition and stable rule ID |
| Diagram presentation | existing diagram node or edge | presentation ID, semantic element/relationship ID and geometry only |

All applicable new and normalized semantic records carry an internal ID, optional external ID, name, owner, kind, schema metadata, creation/modification metadata, and import provenance. Qualified names continue to be derived from semantic ownership by `model.js`; diagram placement never participates in that derivation.

PartProperty means composite Usage; ReferenceProperty means reference Usage. Ports remain contextual interaction-point Usages. InstanceSpecification is a specific Instance only; a Block is never converted to an Instance. SiteContext is explicit and a Package is never guessed to be a Site. A Configuration is controlled mutable content until baseline capture changes it to Released.

## Hierarchy and ownership

Ownership remains flexible rather than hard-coded to Program/Site/System/Subsystem/Assembly/Component/Unit. SiteContext may own contextual Usages, Definitions may be shared across Sites, and Instances point to both their reusable Definition and fulfilled Usage. Composition (`PartProperty`) and reference (`ReferenceProperty`) are explicit and independent of repository ownership, functional/logical relationships, allocations, and diagram presentation.

The canonical multi-site example contains one Tire Block Definition, two `frontLeftTire` PartProperty Usages, two SiteContexts, and two InstanceSpecifications with different serial identities. A change to either Instance's slots or configuration membership does not mutate the other Instance or the shared Definition.

## Configuration resolution

`resolveConfiguration(project, { configurationId, targetId, siteContextId, baselineId })` returns `{ status, resolved, conflicts, unresolved, explanation }`.

1. A supplied baseline fixes the source Configuration and records that decision.
2. Parent Configurations are visited oldest-parent to selected-child. Circular inheritance returns `ambiguous` without resolution.
3. Child items replace or exclude parent items by semantic target ID.
4. Multiple revisions, variants, or different same-level overrides for one target are conflicts; none is selected arbitrarily.
5. Target Definition comes from the Definition itself, Usage type, or Instance type/fulfilled Usage.
6. Site precedence is explicit input, item Site, target Site, then Configuration Site.
7. Effective values use Usage contextual overrides, then Instance slots, then Configuration-item values.
8. Missing targets, Definitions, Revisions, Variants, Sites, and membership are structured unresolved records.

The explanation is an ordered list of source IDs, precedence steps, inclusions/exclusions, and value reasoning. The service returns identities and effective values, not verification scope or credit.

## Controlled baselines and identity

`captureConfigurationBaseline` captures Configuration/Site identity, included semantic/Usage/Instance IDs, Definition Revision IDs, effective items and values, relevant relationship IDs, model/foundation schema versions, and a timestamp. A canonical key ordering and FNV-1a content marker provide a deterministic change detector; it is not a cryptographic signature.

Capture marks the source Configuration Released. Ordinary property updates, item add/remove, and deletion of referenced semantic content are rejected. A correction requires a successor Configuration/Baseline with `supersedesBaselineId`; the earlier snapshot and content ID remain unchanged. Future evidence should reference the Configuration Baseline ID and content identifier, but evidence storage is outside P-03.

## Requirement applicability

Requirements may explicitly include or exclude a Definition, DefinitionRevision, Variant, Usage, Instance, Site, Configuration, or ConfigurationBaseline. `resolveRequirementApplicability` accepts direct context IDs or a resolved Configuration context and returns `applicable`, `not-applicable`, `ambiguous`, or `unresolved`, matching rules, and explanations. Contradictory include/exclude rules are ambiguous. The result always sets `verificationCredit: false`; Satisfy, Verify, DeriveReqt, Refine, Trace, and Allocate remain unchanged and do not substitute for applicability.

## Persistence and migration

Project schema advances from 3.0 to 3.1. `normalizeSemanticFoundation` is called by normal project normalization and operation replay. It:

- preserves semantic, external, diagram, presentation, relationship, geometry, routing, import, and provenance identities;
- adds explicit roles for unambiguous existing SysML kinds;
- initializes arrays and metadata idempotently;
- does not invent a Site, Instance, Configuration, Variant, Revision, or Baseline;
- records untyped legacy Usages/Instances as `semanticMigration.unresolved`;
- retains JSON round-trip compatibility.

## Validation

P-03 validation reports missing/incompatible Usage and Instance Definition references, incompatible Instance fulfillment, broken Sites/members/revisions/applicability, conflicting revisions/variants/overrides, circular inheritance, changed baseline content, missing baseline content/source, duplicate scoped asset identity, orphan Definition Revisions, released items without exact Revisions, and As-tested configurations without stable Site/configuration identity. Messages use existing error/warning records and name the affected ID plus corrective action.

## Structured import and reimport

`importSemanticFoundationRecords` accepts workbook-shaped records with these `recordType` values: `Definition`, `DefinitionRevision`, `Usage`, `Instance`, `Site`, `Variant`, `Configuration`, `ConfigurationItem`, `ConfigurationBaseline`, and `RequirementApplicability`.

Every record requires `recordType` and stable `externalId`. References use `ownerExternalId`, `definitionExternalId`, `usageExternalId`, `siteExternalId`, `configurationExternalId`, `targetExternalId`, `revisionExternalId`, `variantExternalId`, `parentExternalId`, and `requirementExternalId` as applicable. Name, kind, IDs, documentation, lifecycle, dates, values, and provenance fields are optional by record type.

Processing is dependency ordered and transactional. Existing external IDs update the same mutable semantic object; owner chains and required typed references must resolve; failed imports roll back; dry runs return decisions without mutation. Released baselines reject reimport mutation. Legacy workbook sheets remain optional and existing import behavior is unchanged. The CATIA/Cameo profile recognizes SiteContext and DefinitionRevision aliases, but no vendor-compatibility claim is made.

## Operations, collaboration, and UI

Granular operation envelopes now accept Usage/Instance Definition assignment, Instance-to-Usage assignment, Configuration item add/remove, baseline capture, and Requirement applicability assignment. Stable item/rule IDs make replay idempotent for additive records; existing project/branch/revision/offline/conflict transport is reused. Presence remains ephemeral and cannot call these semantic operations.

The existing **Configurations** workbench now separates semantic role and SysML kind, Definition, Usage role/fulfilled Usage, Site, Configuration membership, and Baseline. It provides focused controls to create these concepts, add items, inspect structured resolution, and capture a baseline. It intentionally does not place configuration semantics in diagram geometry or expand the general property panel.

## Known limits and follow-up

- Generalization-aware compatible fulfillment is not yet resolved; P-03 requires exact Definition identity.
- Applicability conditions are stored but only explicit typed target/effect resolution is evaluated.
- Baseline integrity is deterministic change detection, not signing or enterprise approval.
- Structured records are tested; dedicated physical XLS/XLSX sheet templates are not supplied.
- Local collaboration envelopes/replay are tested, not a live two-client Durable Object session.
- The full unit verification-scope engine, Test Case selection, execution, evidence, and credit are deliberately out of scope.

Recommended next work is **P-04 Requirement Allocation and Verification-Scope Resolution**, using baseline IDs as the evidence-ready boundary and adding hierarchy/interface dependency traversal without granting test credit automatically.
