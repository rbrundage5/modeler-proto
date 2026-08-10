# P-05 verification planning, applicability, and coverage

## Evidence boundary and profile

The repository remains a conservative SysML 1.6 application profile with P-03 type/usage/instance and P-04 requirement applicability semantics. F-04 was merged with limitations, not fully qualified: its matrix retained three blocked and three automated-unverified workflows, Node 22 was unavailable, and broad manual visual/interaction review was not executed. Those limitations remain unchanged. D-01 Electron work remains absent.

P-05 adds static planning only. A Verify link, acceptance criterion, Satisfy link, or planned case grants no execution, evidence, pass, compliance, or verification credit. Existing historical execution records remain readable for backward compatibility but are excluded from the P-05 coverage numerator, denominator, matrix status, and state contract.

## Eight controlled steps

1. Added an inventory for 19 verification-domain concepts and an explicit planning/execution/evidence state boundary.
2. Completed stable TestCase planning properties, controlled methods and levels, normalization, and validation.
3. Enforced the repository convention `TestCase → Requirement` for Verify, with duplicate, endpoint, owner, cross-project, orphan, and missing-plan diagnostics.
4. Added deterministic, side-effect-free configuration applicability with applicable, not-applicable, conditionally-applicable, conflicting, unresolved, and not-specified results plus explanations.
5. Added planning coverage and drill-down. Formula: applicable Requirements with a compatible applicable plan divided by resolved applicable Requirements. Non-applicable, conflicting, unresolved, and not-specified Requirements are excluded and listed. Zero denominators yield 0, never NaN.
6. Replaced the execution-oriented workbench summary with a planning matrix, authored/calculated labeling, filters, stable rows, navigation, safe CSV export, and focused TestCase properties.
7. Added transactional verification planning import/reimport with stable-ID upsert, fatal rollback, exact record/field diagnostics, unknown method preservation, and rejection of execution claims as planning credit.
8. Added deterministic, audit, and maintained browser regression evidence.

## Manual acceptance checklist

All 28 required manual items are **not executed** in this environment. Automated browser coverage exercises creation, Verify linking, configuration selection, coverage inspection, uncovered filtering, row navigation, save, and reopen. Deterministic tests cover properties, direction, reconnection, duplicates, gaps/orphans, applicability conflicts/unresolved states, coverage/zero denominator/drill-down, filtering, import/reimport, rollback, normalization, and planning-credit boundaries. Manual focus, visual arrowhead, full reconnection, broad import UI, and F-01–F-04 acceptance remain open.

## Known limitations and deferred scope

Node 22 qualification remains open. No test runner, procedure engine, simulation, result ingestion, evidence management, pass/fail calculation, compliance decision, certification, or collaboration expansion was added. The pre-existing `verificationExecutions` compatibility model is not expanded. Unknown imported methods remain diagnostic. Package filtering applies to direct semantic owners. P-05 is not declared release-complete until Node 22 and the manual gates are completed.
