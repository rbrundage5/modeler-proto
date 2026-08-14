# Massive Model Incremental Normalization and Validation

This stage closes the normal interactive edit path over the dirty working set while preserving strict full-model processing at trust boundaries.

## Behavior

- presentation-only and known element/relationship edits are classified for incremental processing
- qualified-name refresh and index-integrity checks operate on dirty dependencies
- dirty validation checks only changed elements, indexed adjacent relationships, and directly affected diagram presentations
- bulk import, replace-project, merge, and unknown operations deliberately fall back to the existing full semantic synchronization path
- no relationship change is allowed to discover affected diagrams by scanning every diagram

## Correctness boundary

Full semantic synchronization remains mandatory where arbitrary repository state can enter or broad semantic coupling is possible. Incremental processing is an optimization only for classified interactive operations; it is not permitted to downgrade validation correctness for imports, migrations, collaboration replacement, or unknown operation types.

## Scale qualification

A one-element validation inside a 1,000,000-element repository must keep its validated working set bounded rather than traversing the complete repository. The final scalability PR will profile this together with import, persistence, rendering, routing, repository navigation, and ordinary edit workflows at 100k, 500k, and 1M scales.
