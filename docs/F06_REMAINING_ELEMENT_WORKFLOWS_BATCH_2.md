# F-06 remaining element workflows — batch 2

## Evidence and selection

F-06 retains the F-05 authoritative inventory and selects only `ReferenceProperty`. Its high score follows actual IBD palette exposure, existing import/connector fixtures, semantic-loss risk, and dependency on the completed typed-property architecture. Ports and all unrelated partial or blocked records remain deferred with their original evidence-backed states.

## Eight controlled steps

1. Recorded a machine-readable scored manifest and the complete deferred set.
2. Defined stable, non-composite Usage semantics, explicit structural owners, classifier identity, and stable-ID-first upsert.
3. Added an authored/read-only property schema plus owner, type, multiplicity, and aggregation validation.
4. Added deliberate IBD-only `«reference»` property notation without fallback.
5. Added connector endpoint validation and identity-preserving reconnection while retaining F-01 presentation interactions.
6. Derived complete capability and IBD-only palette exposure from the authoritative inventory.
7. Added idempotent legacy fallback migration preserving semantic identity, presentation identity, and geometry.
8. Added deterministic, audit, and maintained Chromium coverage.

## Qualification boundary

Automated Chromium evidence covers keyboard capability details, creation, invalid-context absence, property editing, movement, undo/redo, save/reload, stable semantic/presentation identity, and absence of diagnostic fallback. The generated screenshot was inspected but is not committed. Broad manual qualification of all 38 acceptance items was not executed. Node 22 remains unavailable; tests use Node 24.15.0. The repository still has no `npm run build`; `npm run deploy:dry-run` is its production bundle check. No test reports, traces, videos, caches, downloads, ZIPs, or temporary screenshots are committed.
