# SysML v1 notation limitations

The conformance matrix is deliberately conservative. A registered renderer is not automatically called conformant.

- Custom profile stereotype icons, image stereotypes, and proprietary CATIA/Cameo/Dassault artwork are not supported.
- Primitive Type, Value Pin, Accept Time Event Action, terminate pseudostate, subject boundary, expansion-node, exception-handler, destruction occurrence, lost/found message, continuation, and several advanced interaction notations are not enabled by the current semantic profile.
- Association-end role and multiplicity data is modeled, but independent automatic collision avoidance for every end label remains limited.
- Sequence layout supports lifelines and messages but does not yet implement every UML combined-fragment and occurrence constraint.
- The generic UML classifier fallback is used only for known semantic repository kinds; unknown kinds are reported by validation and are never rendered as question marks.
- PNG/PDF use the browser’s SVG/canvas and print pipeline. Dedicated font embedding and pixel-diff baselines require browser CI.
- Ambiguous missing diagram contexts are reported rather than guessed. Relationship semantic direction is never silently reversed.
