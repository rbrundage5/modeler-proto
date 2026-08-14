# Massive Diagram Viewport Contract

Very large diagrams must scale with the visible viewport rather than total presentation count.

## Requirements

- Nodes and relationship presentations are spatially indexed.
- Viewport queries include an overscan margin to avoid pop-in during scroll/pan.
- Visible relationships retain semantic/presentation endpoints even when an endpoint is outside the viewport so routing geometry remains valid.
- Selected presentations are retained even when slightly outside the current viewport.
- Node movement and edge rerouting update the spatial index incrementally rather than rebuilding the complete diagram index.
- Semantic diagram contents remain complete; virtualization affects rendering only.
- No correctness feature is disabled merely because the diagram is large.

## Qualification

This stage qualifies a 100,000-node / 200,000-edge diagram and verifies that a normal viewport returns a bounded working set rather than every presentation.

The next integration stage should make `renderCanvas()` consume `diagramRenderSet()` directly, then move hit testing, marquee selection, routing collision checks, and presence rendering onto the same spatial index. The legacy complete-diagram SVG loop must not execute before the virtualized render.
