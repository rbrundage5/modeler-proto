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
