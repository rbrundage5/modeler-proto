# Massive Model Diagram Live Integration

This stage activates the diagram spatial working-set infrastructure in the running browser workspace.

## Implemented

- live viewport calculation from canvas scroll and zoom
- spatial render-set calculation with overscan
- bounded retained SVG presentation count
- selected presentation retention
- indexed node hit testing
- live diagnostics exposed on the SVG dataset and `window.SystemsModelerDiagramViewport`
- viewport refresh on scroll, zoom-related wheel activity, resize, revision changes, and SVG redraws

## Scale contract

The semantic diagram remains complete. Culling affects only retained/rendered SVG presentation content. A 100,000-node diagram must support viewport and hit-test queries without whole-diagram hit-testing scans.

## Remaining integration

The legacy module-private `renderCanvas()` currently performs its complete presentation iteration before the live viewport layer culls retained SVG content. The next focused PR should move the draw loop itself behind `diagramRenderSet()` so both CPU work and SVG memory are bounded before DOM creation. This is intentionally called out rather than hidden as complete.
