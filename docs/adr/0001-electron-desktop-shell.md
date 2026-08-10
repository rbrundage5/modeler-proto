# ADR 0001: Isolate native desktop access behind Electron preload

**Status:** Accepted for D-01

Electron is selected because the application is already browser-native and Chromium can execute the real renderer without rewriting its semantic repository, SVG engine, importer, UI, or collaboration protocol. Tauri, .NET, Python, Java, or Qt would introduce a second core and identity/interchange risk. Python remains deferred.

The browser remains operational. Platform-neutral project JSON contains semantic and presentation identity, so the platform never translates or regenerates IDs. Native access is isolated in main and reduced to an allow-listed preload facade; the sandboxed renderer has no Node or unrestricted filesystem access.

Before external distribution: Windows GUI acceptance, authentication/live collaboration qualification, legacy `.xls` policy, Windows atomic-save testing, threat review, reproducible packaging, signing, installer/update policy, and artifact publishing are required. D-01 provides only a development shell and unsigned Windows ZIP test-build dry run.
