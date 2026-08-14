# Massive Model Streaming Workbook Import

Workbook decoding now runs outside the browser UI thread. The workbook `ArrayBuffer` is transferred to a dedicated worker, SheetJS decodes sheets there, and sheet matrices are returned with progress events. The existing CATIA/Cameo semantic importer then consumes those worker-parsed matrices through the same profile matching, stable-ID merge, relationship, diagram, presentation, and strict validation rules.

The live import handler no longer serializes the complete project before import. `importWorkbook()` already stages against an isolated project copy and only replaces the live project after validation, so the previous `JSON.stringify(project)` backup was redundant and scaled with total repository size. The handler also no longer publishes a complete `structuredClone(project)` as the import collaboration operation.

## Scale contract

- workbook binary decode and SheetJS sheet extraction execute in a worker
- workbook buffers are transferred rather than copied into the worker
- progress is reported sheet-by-sheet during decode and by semantic import phase afterward
- semantic import remains transactional and strict
- a failed import leaves the pre-import live project unchanged
- normal import setup does not create an additional complete JSON snapshot
- 100,000-row classification is included in qualification

## Remaining closure

The semantic importer still contains synchronous per-row semantic transformation phases. The final incremental-normalization stage should continue reducing repository-wide work inside those phases. Final end-to-end profiling will determine whether additional semantic worker partitioning is required for million-row workbooks.
