# Systems Modeler Collaborative v7

Deployable Cloudflare Worker collaborative SysML project environment. New repositories are blank by default.

# Systems Modeler Collaborative

A deployable browser-based SysML 1.x modeling application with a CATIA/Cameo-inspired workspace, structured model repository, editable diagrams, Excel import, validation, local persistence, and shared project rooms through Cloudflare Durable Objects.

## Important scope statement

This is an independent systems-modeling application. It is not Dassault Systèmes CATIA, does not contain CATIA source code, and should not use CATIA trademarks or proprietary artwork as its product identity. The goal is workflow and modeling-feature similarity using independently implemented code.

## Included

- Containment browser and package ownership
- BDD, IBD, requirements, use case, activity, state, sequence, parametric, and package diagram records
- SysML-oriented element palette and relationship palette
- Blocks, interface blocks, ports, properties, requirements, actors, use cases, behavior nodes, constraint blocks, and common UML/SysML relationships
- Stable/external IDs, qualified names, ownership, documentation, requirement text, multiplicity, direction, and compartments
- Drag placement and movement on an SVG canvas
- Block compartments that display actual entered properties
- JSON project import/export and browser persistence
- Excel workbook import with flexible header matching
- Model validation for IDs, owners, requirements, diagrams, and relationship endpoints
- Real-time room synchronization using WebSockets and one Durable Object per room
- Undo/redo history
- GitHub Actions deployment example
- Cloudflare Worker entry point and assets binding, preventing the “missing entry-point” deployment error

## Deploy from GitHub to Cloudflare

1. Create a GitHub repository.
2. Upload every file and folder from this repository root.
3. In Cloudflare, create a Workers & Pages application connected to the GitHub repository.
4. Use:
   - Build command: `npm install`
   - Deploy command: `npx wrangler deploy`
5. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repository secrets when using the included GitHub Actions workflow.
6. Deploy.

Local development:

```bash
nvm use
npm install
cp .dev.vars.example .dev.vars
npm test
npm run check
npm run dev
```

Node.js 22 is the supported local runtime. Cloudflare credentials are not
needed for local mode. See [`docs/DEVELOPMENT_ENVIRONMENT.md`](docs/DEVELOPMENT_ENVIRONMENT.md)
for environment setup, command reference, secrets handling, and reset steps.

## Collaboration behavior

Users who open the same deployed URL and connect to the same room name share one project snapshot. Changes are broadcast to other users. This first repository-level implementation uses revision-checked collaborative operations with conflict rejection, presence, commits, and a durable operation journal; production engineering should add authentication, permissions, operation-based conflict resolution, version branches, audit retention, and backups.

## Workbook import

The importer accepts `.xlsx`, `.xls`, and `.csv` files and recognizes common CATIA/Cameo-style sheets and headers including:

- Packages / Elements / Blocks / Requirements
- Relationships
- Diagrams
- External ID / ID
- Owner ID / Owner Ref
- Source ID / Target ID
- Requirement ID / Requirement Text
- Metaclass / SysML Kind / Stereotype
- Diagram Type / Context ID

Unresolved owners are moved to the model root and reported in the log rather than silently creating unowned objects.

## Recommended production hardening

See `docs/PRODUCTION_ROADMAP.md`.


## Version 2 additions

See `docs/COLLABORATION_AND_SYSML.md` for the collaboration protocol and SysML correctness rules.


## Professional interface and feature-integrity audit

Version 6 retains the complete v4 model, diagram, import, validation, branch, lock, commit, merge, search, reuse, navigation, and collaboration capabilities. The interface was reorganized into a professional application header, command groups, repository browser, diagram workspace, property inspector, and problems/activity panel.

Every visible command is now handled in one of three ways:

- It performs a real application action.
- It is disabled when its required context is unavailable, with a reason in its tooltip.
- It is omitted from the interface.

Run `npm run ui-audit` to verify that visible command buttons are wired. `npm run check` includes this audit automatically.


## Integrated project environment

Version 6 adds model tables, requirement coverage, traceability matrices, validation navigation, HTML/SVG/CSV exports, governance settings, project archives, and named recovery checkpoints. See `docs/PROJECT_ENVIRONMENT.md`.


## Cloudflare Worker-ready configuration (v6.1)

The repository now uses the current Cloudflare Worker configuration model:

- Workers Static Assets for `public/`
- selective Worker-first routing for `/api/*`
- a SQLite-backed Durable Object declared through `exports`
- source-map upload and Workers observability
- separate optional staging configuration

See `docs/CLOUDFLARE_WORKER_DEPLOYMENT.md`.

## IMPORTANT: GitHub repository root

The following items must appear directly at the top level of the GitHub repository:

```text
package.json
wrangler.jsonc
public/
worker/
scripts/
```

Do not upload a parent folder that contains these files one level lower. In Cloudflare Workers Builds, set **Root directory** to `/` (repository root) and use:

```text
Build command: npm install && npm test && npm run check
Deploy command: npx wrangler deploy --config wrangler.jsonc
```

If Cloudflare says “No dependencies detected” or cannot find static files, the configured root directory is wrong.


## Blank-project behavior (v6.2)

New projects contain only the model root. No site, enterprise, common-library, governance, analysis, or reference packages are inserted automatically. Packages and diagrams appear only when explicitly created, imported, or later selected from a project template. This build also uses a new browser storage key so older seeded local data is not silently restored on first launch.


See `docs/V7_FEATURES.md`.


## Version 8 engineering workbench

See `docs/V8_ENGINEERING_WORKBENCH.md`.

## Version 10 verified CATIA/Cameo importer

The importer profile in `public/src/import/profiles/catia-cameo.js` was expanded and regression-tested against the sheet layouts of nine supplied FSBS and Grindavik workbooks. It supports title/guidance rows above headers, CATIA stable IDs and qualified names, package paths, BDD/IBD structure, requirements, verification cases, behavior, parametrics, instances/configurations, diagram shapes/edges, connector ends, navigation links, reimport/merge, provenance, dry-run reporting, and transactional rollback.

Run `npm run import-audit` after changing workbook mappings in GitHub.

## Semantic modeling core

Typed classifiers, live type-name resolution, inherited and overridden
features, composition-backed properties, and complete association ends are
documented in [`docs/SEMANTIC_MODELING_CORE.md`](docs/SEMANTIC_MODELING_CORE.md).
