# Collaboration Architecture

The browser emits versioned operation records; a project-room Durable Object validates, orders, applies, journals, snapshots, and broadcasts them. Semantic operations and presentation operations share an envelope but remain distinct targets. Browser workspace state is not journaled. SQLite tables hold branch heads, accepted operations, formal operation records, immutable revisions, periodic snapshots, commits, locks, members, and audit events.

This PR is internal milestone 1 of the enterprise program: operations, journals, revisions, authoritative storage, and reconstruction primitives. Reviews, comments, full governance UI, visual diff, whiteboards, notifications, and AI suggestions remain dependent milestones rather than simulated features.

Baseline was commit `40acfce`; `npm ci`, all 70 baseline tests, repository checks, and the Cloudflare versions dry-run passed before implementation. No `main` ref or Git remote exists in the supplied checkout, so a network rebase could not be performed; the feature branch was created from that clean integrated baseline.

## Recovery and rollback

Snapshots are written at revision zero and every 50 accepted operations. Time travel reconstructs from the nearest snapshot plus ordered operations. Roll back the deployment to the preceding Worker version; additive SQLite tables may remain. Export the current project before any manual storage intervention.
