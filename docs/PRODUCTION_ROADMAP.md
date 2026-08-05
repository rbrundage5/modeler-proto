# Production Roadmap

The included repository is deployable and functional, but an “almost CATIA” production modeler requires continued implementation and formal verification.

1. **Semantic kernel**
   - Full SysML 1.6 metamodel constraints
   - Typed properties and ports with interface compatibility
   - Connector-end property paths
   - Item-flow conveyance validation
   - Activity token semantics
   - State-region and transition semantics
   - Interaction occurrence ordering
   - Constraint expression execution and units

2. **Notation**
   - Formal diagram-specific allowed-element matrices
   - Orthogonal routing and bendpoint editing
   - Labels, roles, multiplicities, association ends, gates, frames, and partitions
   - Precise print/export sizing
   - Diagram interchange support

3. **Repository**
   - Database-backed normalized model store
   - Transactions, immutable revisions, branches, merges, and baselines
   - Access control and project roles
   - Audit journal and restore points

4. **Collaboration**
   - Operation-based CRDT or OT instead of whole-project last-writer-wins
   - Per-element locks where required
   - Presence, selections, comments, review workflow, and conflict resolution
   - Identity provider integration

5. **Import/export**
   - Per-workbook schema profiles
   - Deterministic two-pass owner/reference resolution
   - Dry-run preview and rollback
   - Import provenance, duplicate policies, and migration maps
   - CATIA-specific exchange validation using documentation from the licensed target environment

6. **Quality**
   - Automated semantic conformance suite
   - Browser interaction tests
   - Import regression corpus
   - Security review, rate limiting, backup, recovery, and load testing
