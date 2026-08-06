# Internal Block Diagram Engine — Phase 1

The Phase 1 IBD layer extends the existing connector router. It does not replace
routing, bendpoints, labels, reconnect, undo, persistence, or collaboration.

## Context and presentations

Every Internal Block Diagram references a `Block` through `contextId`. Its
context boundary is a diagram presentation only. Owned and inherited
`PartProperty` and `ReferenceProperty` records are placed by reference, so a
diagram never clones their semantic elements. Inherited presentations carry
`inheritedPresentation` and `inheritedFromId` presentation metadata.

Parts render as `name: Type [multiplicity]`. Ports are presentations of semantic
`ProxyPort` or `FullPort` elements owned by the context Block or by a displayed
part's type. Each port presentation stores `boundaryOwnerNodeId`, `portSide`,
`perimeterOffset`, and a complete `endpointPath`. Its absolute coordinates are
derived from that attachment whenever the project is normalized or the owner is
resized.

## Connectors and item flows

Assembly connectors join valid part, reference, and port endpoints. Delegation
connectors join a context port to a port on a displayed part. Connectors persist
complete `sourceEndpointPath` and `targetEndpointPath` arrays as well as the
SysML `sourcePartWithPortPath`, `targetPartWithPortPath`, and port IDs.

An `ItemFlow` references its realizing connector through `connectorId`, one or
more conveyed classifiers through `conveyedIds`, and a controlled direction:
`sourceToTarget`, `targetToSource`, or `bidirectional`.

## Compatibility

All Phase 1 fields are additive. Existing project JSON remains readable.
Normalization derives missing context boundaries, endpoint paths, connector
kinds, and port attachment data where the older presentation data is sufficient.
Workbook import preserves connector ends and recognizes presentation-side,
relative-position, endpoint-path, connector-kind, ItemFlow connector, conveyed
classifier, and direction columns.

