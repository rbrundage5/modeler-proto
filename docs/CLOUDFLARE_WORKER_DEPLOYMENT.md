# Cloudflare Worker Deployment

This repository deploys as one Cloudflare Worker containing:

- the browser application from `public/` via Workers Static Assets;
- API and WebSocket routing from `worker/index.js`;
- a SQLite-backed `ProjectRoom` Durable Object for collaborative projects.

## Required files

- `wrangler.jsonc` — production/default Worker configuration
- `wrangler.staging.jsonc` — optional separate staging Worker
- `worker/index.js` — Worker and Durable Object entry point
- `public/` — static application assets

## First deployment

```bash
npm install
npm run check
npm run deploy:dry-run
npx wrangler login
npm run deploy
```

Wrangler provisions the `ProjectRoom` SQLite Durable Object namespace from the declarative `exports` entry.

## Cloudflare dashboard Git integration

Use these settings when importing the GitHub repository as a Worker:

- Root directory: repository root
- Build command: `npm test && npm run check && npm run versions:dry-run`
- Deploy command: `npx wrangler versions upload --config wrangler.jsonc`

The committed `package-lock.json` makes Cloudflare select npm and install the
same dependency graph with `npm ci`. Do not commit a second Bun lockfile; mixed
lockfiles can make the build image select a different package manager.

`npm run check` parses every JavaScript module and rejects unresolved Git merge
markers. This catches duplicated declarations left behind by a bad conflict
resolution before Wrangler bundles the Worker. The version-upload dry run uses
the same Wrangler command family as the dashboard deploy command.

Do not create this as a Pages project. It is a Worker with Static Assets and Durable Objects.

If the dashboard should immediately replace production traffic instead of
creating a version for staged rollout, use `npx wrangler deploy --config
wrangler.jsonc` as the deploy command instead.

## GitHub Actions secrets

Set these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token needs Workers Scripts edit permission and permission to deploy Durable Objects.

## Health checks

After deployment:

- `/` loads the modeler
- `/api/health` returns Worker health JSON
- collaboration connects through `/api/projects/<room-id>/socket`

## Staging

Deploy a separate staging Worker with:

```bash
npx wrangler deploy --config wrangler.staging.jsonc
```

This uses a separate Worker name and separate Durable Object namespace, so test data does not mix with production.

## Existing deployments using legacy migrations

This repository now uses Cloudflare's declarative Durable Object `exports` configuration. Cloudflare supports migrating an existing SQLite Durable Object from the legacy `migrations` array by replacing that array with the matching `exports` declaration. After deploying with `exports`, keep using `exports` for later Durable Object lifecycle changes.
