# Requirements Workbench

Phase 1 establishes a backward-compatible Requirement semantic record and policy-driven validation. It intentionally does not change diagram, connector, import, collaboration, or repository engines.

## Identity and stereotypes

`id`, `externalId`, and `requirementId` are independent. Specialized requirement types are stored in `requirementType` while the semantic element remains a `Requirement` with the `Class` metaclass and `requirement` stereotype. Supported types are Requirement, Abstract, Functional, Interface, Performance, Physical, Design Constraint, and Business Requirement.

## Lifecycle fields

Requirements store source metadata, rationale, risk, priority, lifecycle status, maturity, verification method and status, responsibility, approval metadata, creation/modification dates, baseline membership, suspect state, tags, and custom stereotype properties. Legacy records receive missing defaults during normalization without changing stable IDs.

## Project policy

Policy is persisted at `project.settings.requirements`. Projects may configure whether ID and text are required, whether Requirement IDs are unique, and the allowed status, priority, and verification-method values. Defaults preserve the prior required-ID and required-text behavior.

## Validation

Phase 1 adds `REQUIREMENT_ID_REQUIRED`, `REQUIREMENT_ID_DUPLICATE`, `REQUIREMENT_TEXT_REQUIRED`, `REQUIREMENT_STATUS_INVALID`, `REQUIREMENT_PRIORITY_INVALID`, and `REQUIREMENT_VERIFICATION_METHOD_INVALID`. Validation reports issues and never mutates the model.

## Manual test

1. Create or open a Requirement Diagram and create a Requirement.
2. Select it and independently edit External ID, Requirement ID, name, and multiline text.
3. Set type, source, lifecycle, verification, and approval fields in Properties.
4. Save and reopen the project; confirm values and stable IDs remain unchanged.
5. Create another Requirement with the same Requirement ID and run Validate; confirm duplicate-ID errors appear.

## Known limitations

Phase 2 adds Requirement-to-Requirement containment, parent selection, child creation and navigation, stable sibling ordering, breadcrumbs, recursive repository expansion/collapse, cycle prevention, and replayable move operations. Containment does not create or imply a Derive Requirement relationship.

To reorganize a hierarchy, drag Requirements in the repository, choose a Parent in Properties, or use the child ordering controls. Moves retain semantic and External IDs. Invalid owners, self-containment, and descendant-to-ancestor cycles are rejected.

## Phase 3 — Tables, matrices, and verification

Saved Requirement Table definitions retain scope, visible/reordered/resized columns, filters, multi-column sorting, and grouping. Table evaluation and CSV/workbook-shaped export use the same definition. Inline and batch edits reject identity, kind, and containment changes and validate the complete edit set before mutation.

The shared relationship-matrix engine provides Satisfy, Verify, Derive Requirement, Refine, Trace, and Allocate presets. It uses a relationship index, validates cell semantics, creates ordinary semantic relationships, requires confirmation before deletion, and returns bounded row and column windows for virtualized rendering.

Reusable Test Cases are semantic elements with procedure, expected result, method, level, owner, status, and evidence. Verification Executions are independent records so a Test Case can be executed repeatedly. Plans report assigned Test Cases, latest execution, verdict, role, configuration, evidence, and unplanned or unverified Requirements. Coverage distinguishes assigned, executed, passed, failed, and not-run Requirements.

All definitions, Test Cases, executions, and relationships are part of project JSON and archive snapshots. Matrix relationship and execution changes use the normal operation forms for undo/redo and collaboration replay without duplicating semantic records.

### Phase 3 manual test

1. Save a Requirement Table with a filter, reorder and resize columns, edit a cell, then export CSV and reopen the project.
2. Open each matrix preset. Create an allowed relationship from an empty cell, select it, then delete it after confirmation; confirm invalid diagonal/type cells stay disabled.
3. Create one Test Case, assign it to a Requirement, and add two executions with different dates and verdicts.
4. Confirm Verification Plan uses the latest execution and that coverage changes from assigned to executed and passed or failed.
5. Undo and redo a matrix edit, replay it through collaboration, export project JSON, and restore the archive.

### Known limitations

XLSX export is exposed as workbook-shaped data and is serialized by the application's existing SheetJS browser integration. Large grids use fixed-size virtual windows; variable-height rows are not supported. Workbook import continues to follow `IMPORT_WORKBOOK_RULES.md` and does not infer Verification Executions from undocumented worksheets.

## Phase 4 — Change control, reconciliation, and reporting

Named baselines capture a selected Requirement scope, stable semantic IDs, configured fields, and configured semantic relationships. Comparisons report added, removed, and changed Requirements, field-level changes, and added or removed relationships against the current model or another baseline.

Changes to Requirement ID, text, source revision, or verification method mark related relationships suspect. Changes to related model elements do the same. Suspect records retain the reason, date, affected relationship, source element, clearance date, reviewer, and disposition; they never delete the semantic relationship.

Read-only impact analysis uses indexed incoming and outgoing adjacency, selectable relationship kinds, direction, depth limits, and cycle detection. Results include paths, impacted elements, diagrams, Test Cases, allocations, and validation issues.

Import reconciliation previews Create, Update, Reuse, Conflict, and Unresolved decisions. Explicit owner chains are mandatory—there is no silent model-root fallback. Application is transactional, deduplicates Requirements and relationships, retains unmentioned relationships and existing presentation geometry, and marks links suspect when imported Requirement content changes.

Engineering reports cover specifications, tables, matrices, verification plans/results, coverage, baseline comparison, suspect links, and impact analysis. They serialize to CSV, workbook-shaped XLSX data, JSON, and self-contained printable HTML. Browser print is the only PDF path; no new PDF runtime is introduced.

### Migration and rollback

Legacy projects normalize missing `suspectLinks` and `savedReports` to empty arrays. Existing `requirementBaselines` remain valid; Phase 4 snapshots add scope and relationship configuration without rewriting older records. To roll back the application, deploy the preceding commit. Project JSON remains readable because new top-level collections are additive. To roll back an import, use Undo immediately after reconciliation or restore the pre-import project archive. Deleting immutable baseline history requires explicit confirmation.

### Phase 4 manual test

1. Open **Engineering Workbench → Change Control & Reports**, create a named baseline, edit Requirement text and compare the current model.
2. Confirm related Satisfy and Verify links appear as suspect, clear one with a reviewer and disposition, and confirm no relationship is deleted.
3. Select a Requirement, run impact analysis, and inspect paths, cycles, diagrams, Test Cases, allocations, and validation issues.
4. Preview a reimport containing create, update, reuse, conflict, and unresolved records; resolve all conflicts, apply it, then confirm geometry and unrelated relationships remain.
5. Generate each report type and export CSV, JSON, XLSX, and printable HTML; save/reopen JSON and replay baseline, suspect, import-decision, and saved-report operations through collaboration.

### Phase 4 known limitations

Baseline snapshots are immutable JSON records rather than a cryptographically signed configuration-management artifact. Reconciliation requires callers to map workbook rows into documented semantic records before preview. Printable HTML relies on the browser print dialog for PDF output. Fixed-depth impact traversal intentionally omits paths beyond the configured maximum.
