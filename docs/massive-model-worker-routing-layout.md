# Massive Model Worker Routing and Layout

This stage moves expensive diagram pathfinding and deterministic clean-layout calculations off the browser UI thread.

## Routing contract

- Route computation executes in a module Web Worker.
- Node obstacles are spatially bucketed rather than scanned for every segment.
- Candidate orthogonal routes are checked against element bounds with padding.
- A relationship is never assigned a fallback path that crosses another diagram element. If no safe route is found, the worker returns `no-safe-route` and preserves the prior route.
- Results are committed to the live diagram once after worker completion.

## Layout contract

- Deterministic non-overlapping grid layout is worker-safe and independent of DOM state.
- Layout output contains presentation coordinates only; semantic ownership and relationships are unchanged.
- Routing and layout share one asynchronous worker client and support cancellation.

## Qualification

- blocker-avoidance correctness coverage
- 20,000 nodes / 40,000 relationships routing workload
- 100,000-node clean-layout workload
- source-transform guard proving the live Route command uses the worker path

The next scalability stage is chunked/lazy IndexedDB persistence so project storage and loading no longer depend on monolithic project blobs.
