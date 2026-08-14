# Massive-model chunked persistence

This stage removes monolithic project blobs from normal browser persistence.

## Storage model

Each project save creates a generation manifest plus bounded records for semantic elements, relationships, diagrams, and other project arrays. The project core contains only scalar/root metadata and references to section page counts.

Recovery history stores prior generation identifiers rather than cloned project snapshots. Old generations outside the configured recovery window are pruned.

## Runtime behavior

- manual save and autosave use chunked IndexedDB
- project open reconstructs sections from bounded records
- project archive changes manifest metadata only
- recovery restores a prior generation
- project deletion removes its manifest and chunk records
- localStorage remains limited to small active-project and project-list metadata

The store exposes section-selective loading so later lazy semantic/diagram loading can fetch only required sections without changing the persistence format again.

## Qualification

- planning coverage for 1,000,000 semantic records
- browser save/reload coverage for 100,000 semantic records
- generation recovery assertions verify history entries do not contain project snapshots
- transform guards verify the Projects subsystem no longer opens or writes its legacy monolithic IndexedDB project store
