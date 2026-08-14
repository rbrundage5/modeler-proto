# Massive Model Diagram Draw Loop

This stage moves diagram virtualization ahead of SVG creation. The application bootstrap rewrites only the module-private `renderCanvas()` implementation before `app.js` executes, preserving the canonical editor module while making its live draw loop consume `diagramRenderSet()` directly.

## Guarantees

- Off-screen node and edge presentations are not created by the normal live draw loop.
- Spatial viewport queries determine the node/edge working set before SVG presentation creation.
- Selected presentations are retained even near/outside the viewport.
- Relationship endpoint presentations required for visible edge geometry remain available.
- Sequence diagrams receive a shallow render-only diagram containing the current spatial working set; semantic node/edge records remain the original objects.
- The full semantic diagram remains unchanged in the project model.

## Bootstrap boundary

`app.js` still remains the canonical editor source. `app-bootstrap.js` fetches it, applies a narrowly validated source transform around `renderCanvas()`, converts relative module imports to absolute `/src/` imports for Blob-module execution, and then imports the transformed module. The transform fails closed if the expected renderer boundary is no longer present, preventing a silent regression to the full draw loop.

## Remaining diagram-scale work

Marquee/multi-selection and several editor commands still contain full diagram scans. Those should be migrated to the same spatial index in a subsequent stage. Routing/layout also remains a separate worker-backed scalability stage.
