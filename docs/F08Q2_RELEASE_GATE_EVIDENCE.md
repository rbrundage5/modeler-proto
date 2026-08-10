# F-08Q2 release-gate evidence

## Scope and support state

This closure does not promote any relationship record. `Connector` retains its F-07 structural scope. `DelegationConnector` and every other relationship family remain partial. Sequence messages remain under F-02.

## Implemented closure

Keyboard endpoint editing now discovers compatible targets from stable semantic/presentation records, announces the current target, traverses deterministically by stable presentation ID, cancels with Escape without mutation, and confirms with Enter or Space. Pointer reconnection no longer creates history before validation and publishes a granular `reconnect-connector` operation rather than `replace-project`. Direction is retained by updating the explicitly selected source or target side.

Deterministic evidence covers presentation-only deletion restoration, semantic deletion restoration and endpoint-element preservation, containment presentation duplicate/ambiguity handling, nested-path persistence, stable connector-end IDs, and unresolved legacy recovery. Production browser evidence covers accessible handles, keyboard traversal/confirmation, semantic repository inspection, direction and identity preservation, undo/redo, invalid pointer rollback, stable waypoint identity, save/reload, and diagnostic-free rendering.

## Production qualification

The repository has no `build` script because the deployable artifact is a Wrangler Worker plus static assets. The repository-defined production validation is `npm run deploy:dry-run`; `npm run versions:dry-run` additionally validates the Workers Versions upload artifact. No deployment was performed.

## Manual acceptance (distinct from automation)

All 51 F-08Q manual checklist items are **not executed**. Automated evidence is not substituted for manual evidence. Broad manual acceptance therefore remains an open release gate.

## Remaining open gates

F-08Q remains **partial**. Production UI qualification is still open for keyboard invalid-target selection beyond the no-compatible-target message; label movement/reset; waypoint pointer movement/deletion; routing reset; accessible semantic-deletion impact summary and transactional failure; relationship containment drag-and-drop from the tree; browser import/reimport identity inspection for the full relationship schema; dedicated reviewed visual baselines; and all 51 manual checks. Publication also remains dependent on a configured remote, authenticated GitHub CLI, and PR capability.

There were no skipped or quarantined automated tests introduced by F-08Q2.

## Recorded runtime and final outcomes

Node 22 qualification used Node v22.23.2 with npm 10.9.8: the seven F-08Q/F-08Q2 deterministic tests and `npm run deploy:dry-run` passed. The default shell remains Node v24.15.0. Chromium is 141.0.7390.0 and Playwright is 1.62.1 on Linux 6.18.35.

The post-change deterministic suite passed 240/240, `npm run check`, import audit, conformance audit, Wrangler deployment dry run, and Workers Versions dry run passed. The first full-browser attempt did not pass: the new keyboard scenario timed out because an SVG hit path could not be actionably clicked; the test was corrected to dispatch through the production path. Subsequent local Worker browser runs were blocked by transient Wrangler startup/navigation aborts and runner shutdown hangs, so full maintained browser regression remains unqualified rather than being reported as passing.
