# F-07 port, connector-end, and structural endpoint closure

## Scope and root causes

F-07 is limited to ProxyPort, FullPort, Connector, connector ends, and ItemFlow integration. The merged implementation already contained boundary placement, endpoint paths, interface-flow comparison, and item-flow semantics, but those contracts were split across model defaults, IBD helpers, and operations. Connector-end IDs were legacy scalar fields rather than normalized first-class records, port creation did not require typing, and blocked inventory states had no dedicated browser evidence.

## Eight controlled steps

1. Recorded the bounded scope, shared root causes, dependencies, criteria, tests, exclusions, and deferred limits.
2. Added stable, owner-validated, typed, directioned, explicitly conjugated ProxyPort and FullPort semantics with stable-ID reimport.
3. Normalized stable connector-end records and transactional reconnection while synchronizing legacy fields.
4. Added authored/read-only property schemas and actionable port, connector-end, and ItemFlow validation.
5. Closed boundary movement, resize synchronization, persistence, and operation-envelope behavior through existing IBD/F-01 services.
6. Unified explainable port/interface/conjugation and ItemFlow compatibility without geometry-derived direction.
7. Added idempotent migration and recoverable diagnostics for legacy ports and connectors.
8. Added inventory audits, deterministic regression coverage, and maintained Chromium workflows.

## Evidence boundary

Automated Chromium evidence covers typed ProxyPort and FullPort creation, explicit conjugation editing, boundary presentation, Connector creation, stable connector-end identities, save/reload, invalid-context palette exclusion, fallback absence, and browser-console monitoring. The reviewed screenshot is generated under ignored test output and is not committed. Broad human execution of all 34 manual items remains open. Node 22 is unavailable; Node 24.15.0 is the executed runtime. The repository has no `npm run build`; `npm run deploy:dry-run` remains its production bundle check. ItemFlow and ConnectorEnd are completed as subordinate contracts, not promoted as independent palette elements. No conformance scope is expanded.
