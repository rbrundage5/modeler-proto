# SysML v1 notation guide

## Baseline and scope

The editor targets OMG SysML 1.7 graphical notation and UML 2.5.1 for inherited notation. Existing projects declaring SysML 1.6 remain loadable and retain semantic IDs, external IDs, ownership, qualified names, and geometry. Repository-tree icons are original tool UI; they are not diagram notation.

## Architecture

`public/src/notation/registry.js` is the single lookup for enabled element and relationship presentations. Family modules define classifiers, properties and ports, requirements, activities, states, interactions, relationships, markers, labels, geometry, and frames. The canvas, palette previews, gallery, validation, and exported canvas SVG consume these definitions.

Every diagram has a persisted rectangular frame and heading tab. The heading uses `bdd`, `ibd`, `req`, `uc`, `act`, `stm`, `sd`, `par`, `pkg`, or `instance`, followed by its name and explicit context. Hiding a frame is presentation data and never changes semantic context.

## Symbols and labels

Classifier stereotypes use Unicode guillemets. Feature labels are generated from semantic name, type, multiplicity, default, derivation, and applicable modifiers. IBD parts/references are typed-property presentations, not duplicated Blocks. Proxy Ports use an unfilled square; Full Ports use a filled square. Activity initial/final/flow-final nodes, decisions, fork/join bars, state pseudostates, actors, and use cases use specialized geometry.

Relationship definitions specify line style and markers independently. Aggregation markers follow the semantic association end. Binding Connectors are undirected. Requirement dependency stereotypes are generated exactly as `«satisfy»`, `«verify»`, `«refine»`, `«deriveReqt»`, `«trace»`, and `«copy»`.

## Gallery and acceptance

Choose **Help → Open SysML Notation Gallery** for the deterministic review project. Review every diagram at 100% zoom, grayscale print preview, and exported SVG. The template is never inserted into a blank project.
