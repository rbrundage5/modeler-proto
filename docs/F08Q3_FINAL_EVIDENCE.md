# F-08Q3 final evidence

## Status

Technical status: **PARTIAL**. Publication status: **BLOCKED**. No support state changed: Connector retains its F-07 structural scope; DelegationConnector and other relationship families remain partial.

## Browser lifecycle

The instability had two concrete causes: Playwright's delegated webServer was orphaned when an externally imposed timeout killed the parent before Wrangler/workerd, leaving port 8787 occupied; repeated Chromium extraction also delayed runner initialization. `scripts/run-browser-tests.mjs` now owns Wrangler, polls the real application for readiness, runs Playwright against that explicit server, and terminates the process group in `finally`. The configuration reuses the verified Chromium extraction. A clean Node 22 focused run completed two production scenarios and left no Wrangler, workerd, or Playwright process. Two consecutive *full* suites were not executed, so that gate remains open.

## Product work

The production relationship panel now provides keyboard/pointer commands for semantic label editing through the existing Name field, label reset, stable waypoint add/move/delete, routing reset, containment presentation, and semantic deletion. The semantic-deletion modal names the action and impact, lists presentations, ConnectorEnds, ItemFlows, and preserved endpoint elements, supports Escape/cancel, moves focus inside, restores focus, and commits only after confirmation. Existing presentation deletion remains diagram-only and granular.

## Manual checklist

Items 1–51: **not executed**. Exact action: none. Expected: the corresponding F-08Q manual workflow succeeds. Observed: no manual operator session was completed. Evidence: none. Defect/environment reference: available turn duration did not permit a distinct 51-item manual session. Automated Playwright coverage was not substituted. This alone keeps technical status PARTIAL.

## Remaining technical gates

Two consecutive complete Node 22 browser suites; full browser coverage for every new panel command, semantic and presentation deletion, containment ambiguity/context rejection, import/reimport/fatal rollback through file inputs; reviewed visual baselines; and all 51 manual checks.
