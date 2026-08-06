# Development environment

The local environment runs the application through Cloudflare Wrangler, using
the static files in `public/`, the Worker in `worker/`, and a locally emulated
Durable Object for collaborative project rooms.

## Prerequisites

- Node.js 22 (the version declared in `.nvmrc`)
- npm, included with Node.js

Cloudflare credentials are not required for local development.

## Create the environment

From the repository root:

```bash
nvm use
npm install
cp .dev.vars.example .dev.vars
npm test
npm run check
npm run dev
```

Open the local URL printed by Wrangler. Local Worker state is stored under
`.wrangler/`; both that directory and `.dev.vars` are intentionally ignored by
Git.

The sample variables file is empty by design because the default application
has no required secrets. If a secret binding is added later, document its name
in `.dev.vars.example` and place only its local value in `.dev.vars`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Worker and asset server. |
| `npm test` | Run the Node.js test suite. |
| `npm run check` | Run source, UI, environment, Wrangler, and interaction audits. |
| `npm run deploy:dry-run` | Validate the production Worker bundle without deploying it. |
| `npm run dev:remote` | Run against Cloudflare's remote development environment; authentication is required. |

## Reset local state

Stop Wrangler and remove `.wrangler/` to reset emulated Durable Object data:

```bash
rm -rf .wrangler
```

Browser projects and checkpoints use browser storage, so clear the site's
storage separately when a completely clean client state is needed.

