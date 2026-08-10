# F-04 browser qualification and workflow closure

## Scope and evidence

F-04 qualifies the merged browser application without adding semantic types or desktop work. The F-03 inventory contains 120 records: 6 `complete`, 93 `partial`, and 21 `import-only`. The qualification matrix contains one row for each complete type/diagram workflow. Maintained Playwright tests launch the real Wrangler application with npm-packaged Chromium, capture traces/screenshots and console errors, isolate browser contexts, and assert repository state as well as rendered output.

The qualification evidence covers real startup; palette creation with distinct semantic/presentation IDs; undo/redo; local save/reload; Requirement rendering and stored relationship direction; the nonvisual IBD context contract; Lost/Found Message creation without placeholder participants; stable project reimport; malformed-project rollback; diagnostic recovery for unknown types; important accessible names; focus; and reviewed representative Requirement/diagnostic rendering. It does not qualify every F-03 complete workflow end to end: the matrix deliberately leaves ProxyPort, FullPort, and Actor blocked and labels ReferenceProperty, Requirement, and Lifeline `automated-unverified` pending the remaining human and workflow checks.

## Root causes repaired

- Palette and SVG presentations lacked stable semantic selectors; tools, nodes, relationships, messages, and sequence presentations now expose stable data attributes.
- Browser startup depended on a remote XLSX CDN; the pinned XLSX browser build is now served locally.
- Project JSON opening did not roll back malformed input; it now preserves the active project and reports an actionable error.
- The available serverless Chromium flags used single-process mode, which was unstable between isolated Playwright contexts; the maintained launcher removes that flag.

## Commands

- `npm run test:browser` runs headless qualification.
- `npm run test:browser:headed` runs the same suite headed when a display is available.
- `npm run browser:version` reports the exact browser binary and version.

Failures retain Playwright traces, screenshots, console attachments, and an HTML report under ignored artifact directories. Tests use readiness events/polling and no arbitrary sleeps or retries.

## Manual acceptance review

| # | Review item | Status | Evidence or limitation |
|---|---|---|---|
| 1 | Application startup and project opening | pass | Real Chromium startup and representative JSON opening observed. |
| 2 | Diagram switching | not executed | Automated state coverage only. |
| 3 | Representative palette creation | not executed | Automated Block creation only. |
| 4 | Containment drag-and-drop | not executed | Deterministic F-01 tests only. |
| 5 | Node and edge selection | not executed | Automated node/message selection only. |
| 6 | Movement and resizing | not executed | Not visually reviewed. |
| 7 | Port attachment | not executed | Not visually reviewed. |
| 8 | Relationship creation/reconnection | not executed | Lost/Found creation automated; reconnection not visually reviewed. |
| 9 | Compartments | not executed | Not visually reviewed. |
| 10 | Focus-stable property editing | not executed | Important-control focus only. |
| 11 | BDD notation | not executed | Not visually reviewed. |
| 12 | IBD notation | not executed | Nonvisual context contract automated only. |
| 13 | Requirement notation | pass | Reviewed transient browser artifact shows stereotype, name, ID, and wrapped text; binary output is intentionally ignored. |
| 14 | Parametric notation | not executed | Not visually reviewed. |
| 15 | Activity notation | not executed | Not visually reviewed. |
| 16 | State-machine notation | not executed | Not visually reviewed. |
| 17 | Use-case notation | not executed | Not visually reviewed. |
| 18 | Sequence notation | not executed | Lost/Found semantics automated only. |
| 19 | Lost/Found workflows | not executed | Real UI creation automated; no human visual review. |
| 20 | Save/reopen persistence | not executed | Automated only. |
| 21 | Import/reimport | not executed | Automated representative JSON only. |
| 22 | Undo/redo | not executed | Automated palette mutation only. |
| 23 | Zoom and viewport behavior | not executed | One 1440×1000 viewport reviewed. |
| 24 | No unintended fallback | pass | Complete Requirement renders normally; unknown type is deliberately diagnostic. |
| 25 | No blocking console errors | pass | Browser fixture fails every test on console/page errors; observed suite was clean. |

## Limitations and next stage

Node 22 qualification remains blocked because the environment provides Node 24.15.0 and npm 11.4.2. Direct Playwright browser downloads were rejected by the network, so the maintained suite uses the installed `@sparticuz/chromium` package (Chromium 141.0.7390.0). Visual evidence is generated under ignored `test-results/` rather than committed as a binary; the review is representative, not a broad approved baseline. No test is quarantined and retries are disabled.

The next focused stage should close the matrix’s blocked ProxyPort, FullPort, and Actor workflows, followed by full ReferenceProperty connector/property editing and Lifeline visual/resize/reconnection review. It must remain qualification-driven rather than add new notation scope.
