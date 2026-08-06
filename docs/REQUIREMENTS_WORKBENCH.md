# Requirements Workbench — Phase 1

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

This focused phase does not yet add hierarchy commands, tables, matrices, baselines, suspect-link propagation, verification executions, coverage analysis, impact traversal, or importer mappings. Those capabilities require later phases built on this semantic foundation.
