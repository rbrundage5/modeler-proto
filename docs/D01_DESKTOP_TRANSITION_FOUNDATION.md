# D-01 Desktop Application Transition Foundation

## Inspection and readiness assessment

D-01 was inspected from clean commit `7dadddb`. The checkout has no configured Git remote or local `main` ref, so GitHub could not be fetched and `7dadddb` is the latest merged commit available in the supplied repository. The inspected artifacts are Professional Modeler Baseline 1.0 (`cee6d02`, PR #42), P-03 (`876cf33`, PR #43), and P-04 (`7dadddb`, PR #44), together with their dedicated documents, architecture, import rules, collaboration documents, deployment configuration, tests, and audit scripts.

The application is browser-native HTML, CSS, and ECMAScript modules—not React and not Vite. `public/index.html` imports `public/src/app.js`; the SVG diagram surface, semantic repository, importer, operations, validation, collaboration client, and workbenches are shared modules under `public/src`. Wrangler serves `public` as SPA assets and runs `worker/index.js` first for `/api/*`. Browser production output is the Wrangler asset/Worker bundle. There is no client-side router: state stays on one document and collaboration settings use URL query parameters/History API.

Persistence is canonical project JSON in `localStorage`, browser project registries/checkpoints, JSON upload/download, and Cloudflare Durable Object snapshots/operations. Import uses the shared importer/reconciliation modules and accepts JSON/project archives plus CSV/XLS/XLSX workbook inputs. D-01 now bundles a focused OOXML reader for offline `.xlsx`/`.xlsm` cell import; the existing SheetJS CDN is retained only for online legacy binary `.xls` compatibility. Export uses Blob/object URLs. Browser-only surfaces include DOM, SVG, File, Blob URLs, clipboard, dialogs, drag/drop, History, `localStorage`, WebSocket, and the CDN. No IndexedDB, Service Worker, Web Worker, dynamic import, automatic update system, or direct filesystem assumption was found.

Collaboration uses the existing same-origin `/api/rooms/...` WebSocket route, converted to `ws:`/`wss:` by the client. Cloudflare Worker/Durable Object storage and Cloudflare Access/header identity are hosted-service dependencies. Ordinary tests use mocks and do not start Electron or connect to production. Renderer configuration remains non-secret; `.dev.vars.example` documents server-side local identity, and no credentials are bridged into the renderer.

Security before D-01 consisted of Worker validation/size controls, Cloudflare configuration, browser origin isolation, typed operation validation, and local/remote development separation. Tests use Node's built-in runner plus repository, UI, environment, Wrangler, interaction, visual, import, conformance, and benchmark scripts.

### Dependency classification

| Classification | Components |
| --- | --- |
| Shared application core | semantic/model modules, SVG presentation/notation/layout, importer/reconciliation, requirements/configuration, validation, operations/journal, collaboration client, UI/workbenches |
| Browser adapter | `localStorage`, hidden file inputs, Blob download, browser clipboard/dialog/history |
| Desktop adapter | platform service, renderer integration, preload, native dialogs, atomic writer, menus/window lifecycle |
| Hosted service | Cloudflare Worker, Durable Object, Access identity, collaboration API; SheetJS CDN only for legacy binary `.xls` compatibility |
| Development-only | Wrangler local server, Electron, orchestration/security audits, electron-builder dry packaging |
| Unresolved | production authentication UX, offline legacy binary `.xls`, signing/update infrastructure |

The entire application core is reused without a fork. Only file selection/storage/export, environment identification, metadata, menu dispatch, external links, and dirty state cross a platform boundary. Risks are browser regression, malformed IPC input, unusual-filesystem rename behavior, identity loss through normalization, hosted authentication cookies, and legacy `.xls` CDN availability. Runtime feature detection, canonical JSON, `normalizeProject`, the same importer, channel/argument allow lists, atomic same-directory writes, and tests mitigate them. Semantic IDs, presentation IDs/geometry, qualified names, Requirement data, configurations, and baselines remain in the unchanged canonical document.

Electron is suitable: the renderer is standards-based browser code with no incompatible engine dependency. The integration boundary is Electron main (window/native I/O), sandboxed preload (narrow facade), and unchanged renderer plus one platform integration module.

## Architecture and security model

`desktop/main.mjs` owns the window, application protocol, menus, dialogs, lifecycle, external links, and IPC. Development loads the real Wrangler URL after readiness polling. Production-like execution uses `modeler://app/` to serve the same `public` tree. `desktop/preload.mjs` exposes only project open/save/save-as/import/export, non-secret metadata, dirty state, and menu notifications. It exposes neither Electron, Node, unrestricted filesystem, `process`, nor `require`.

The BrowserWindow enables context isolation and sandboxing and disables Node integration. Navigation is limited to the chosen development origin or `modeler://app/`; new windows are rejected and HTTPS links open in the system browser. Web security and certificate verification remain enabled. Production developer tools are omitted. IPC validates shapes, strings, suggested names, and a 50 MB limit. Saves create an exclusive same-directory temporary file, write/sync/close it, and rename it to the selected destination; failures clean up and report an actionable error.

### IPC API

| Channel | Direction | Payload/result |
| --- | --- | --- |
| `project:open` | invoke | native selection; `{name,path,content}` or null |
| `project:save` | invoke | `{content,suggestedName}`; current path or selection |
| `project:save-as` | invoke | validated content and new destination |
| `project:import` | invoke | bounded supported-file bytes and display name |
| `project:export` | invoke | bounded text, safe name, MIME hint |
| `app:set-dirty` | send | strict Boolean dirty state |
| `app:metadata` | invoke | non-secret name/version/packaged flag |
| `menu:command` | main → renderer | allow-listed existing command |

## Startup, build, and environment

- `npm run dev`: existing browser/Worker development.
- `npm run build`: browser production dry build to `dist/browser`.
- `npm run desktop:dev`: starts Wrangler, polls `MODELER_DESKTOP_DEV_URL` (default `http://127.0.0.1:8787`), starts Electron, and terminates children on failure/signal/exit.
- `npm run desktop:build`: verifies and stages the shared renderer.
- `npm run desktop:check`: platform, IPC, persistence, architecture, and security checks.
- `npm run desktop:package`: unsigned Windows x64 ZIP test-build packaging; not a signed installer or public distribution.

`MODELER_DESKTOP_DEV_URL` is a non-secret development override. `NODE_ENV=development` is supplied by the launcher. Browser/desktop production use same-origin service URLs; tests do not start collaboration. `.dev.vars` values remain server-side. No production credential is compiled into Electron.

## Project files, import, and collaboration

Browser mode retains local storage, upload, and download. Desktop Open reads canonical JSON and normalizes through the existing model layer. Save reuses the user-selected path; Save As selects another; Export always selects. New uses the existing command. Dirty comparison covers the full document, and destructive native Open/window exit prompt before discard.

Desktop JSON import uses normalization. Workbook bytes become a browser `File` and pass to existing `importWorkbook`; External-ID matching, owner resolution, Requirement direction/text, diagram ownership, reimport identity, and rollback remain shared. The bundled OOXML reader supports offline `.xlsx`/`.xlsm` cell imports without a network global; legacy binary `.xls` retains the prior optional online SheetJS compatibility path. Collaboration and operation serialization are unchanged. Desktop development uses the same Wrangler origin and supports secure WebSockets under HTTPS; Cloudflare browser-cookie authentication is not qualified in packaged mode.

## Troubleshooting, limitations, and roadmap

- On readiness failure, verify port 8787 or set `MODELER_DESKTOP_DEV_URL` to a trusted local renderer URL.
- A missing renderer reports an actionable message; run `npm run desktop:build` and confirm `public/index.html`.
- Headless Linux can build/check but cannot qualify Windows GUI/dialogs, Windows rename semantics, packaging/signing, authentication, or live collaboration.
- Offline `.xlsx`/`.xlsm` and CSV import are bundled. Legacy binary `.xls` still requires the optional online compatibility parser; users can save those workbooks as `.xlsx` for offline import. Window-size persistence is deferred; safe initial/minimum sizes are implemented.
- Automatic updates, publishing, installers, signing/certificates, branding, Store/enterprise distribution, and macOS/Linux packages follow Windows acceptance, security review, offline dependency strategy, authentication qualification, and signed CI artifacts.

## Retained backlog

P-05 verification-scope traversal; interface/dependency/regression/higher-level scope; Test Plans/Procedures; execution, evidence, measurements/results, pass/fail, credit, waivers/approvals; high-volume applicability optimization; specialized Site/Revision/Configuration/Baseline notation; unrelated diagram repairs/entities; Python/backend or native rewrite; broad UI redesign; final packaging/distribution/update/signing all remain deferred.

## Verification responsibility boundary

Codex can qualify source-level security controls, the shared renderer build, importer equivalence/rollback/identity tests, deterministic Windows packaging configuration, and all Node-based repository gates. A Windows operator must qualify the produced ZIP on Windows: launch, native menus/dialogs, save replacement and unsaved-change behavior, semantic/presentation identity after reopen, representative XLSX import/reimport, clipboard/undo, authorized non-production collaboration, and process cleanup.

The current execution environment contains Node v22.22.2, but its outbound proxy returns HTTP 403 for npm and GitHub. Therefore Electron dependency resolution, lockfile completion, ZIP production, push, and draft-PR creation cannot be truthfully reported from this environment until outbound access to `registry.npmjs.org` and authenticated access to `github.com/rbrundage5/modeler-proto` are enabled. No Windows download should be requested before `npm ci` and `npm run desktop:package` produce and checksum the configured ZIP.
