# SysML notation audit

The automated notation audit enumerates every element and relationship exposed by each diagram palette and fails when a semantic profile entry or reusable SVG palette icon is missing. The current registry covers 75 element kinds and 30 relationship kinds across BDD, IBD, requirement, use-case, activity, state-machine, sequence, parametric, package, and instance diagrams.

The canvas now provides a standard diagram frame/title tab, vector-effect-safe strokes, notation-specific package and comment outlines, actor/use-case/port symbols, activity initial/final/flow-final/control nodes, state initial/final/choice/junction/history nodes, and relationship endpoint markers. Classifier compartments continue to derive from semantic ownership and remain collapsible, visible, and resize-aware.

## Verification boundary

The implementation uses OMG SysML/UML notation conventions and original SVG artwork. It does not copy proprietary CATIA Magic/Cameo artwork. Pixel-for-pixel conformance to a copyrighted book illustration or a particular vendor theme cannot be asserted without an authorized visual reference corpus and approved golden images. The audit checks coverage and renderer wiring; human notation review and screenshot regression baselines remain required for release certification.
