# Massive Model Worker Semantic Import

This stage closes the remaining million-row import responsiveness gap.

## Pipeline

1. Workbook bytes are transferred to the XLSX parser worker.
2. Parsed sheet matrices are sent to a module semantic-import worker.
3. The existing CATIA/Cameo importer executes inside that worker against a staged project copy.
4. Strict import graph validation and full post-import model validation execute in the worker.
5. On any error, the worker returns an error and the live project is untouched.
6. Only after successful worker validation is the staged project committed to the live application.
7. The live commit is marked `validatedOffThread` so it does not repeat full semantic synchronization on the UI thread.

## Invariants

- Stable-ID merge semantics are unchanged.
- Diagram ownership/presentation import behavior is unchanged.
- Strict import rollback remains transactional.
- The main thread does not execute the workbook semantic row loop.
- The main thread does not execute full post-import validation.
- The main thread does not repeat full semantic synchronization after the worker-validated project is committed.

## Scale target

This completes the major architecture sequence targeting 100k, 500k, and 1M semantic-record repositories. Total repository size should no longer force ordinary editing, repository rendering, diagram rendering, routing, persistence, validation, or workbook semantic transformation onto whole-model UI-thread paths.
