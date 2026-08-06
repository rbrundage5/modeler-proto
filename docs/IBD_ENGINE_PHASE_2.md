# Internal Block Diagram Engine — Phase 2

Phase 2 extends the existing semantic, presentation, operation, import, and connector layers. It does not replace routing or persistence contracts.

## Nested structure and stable paths

Nested part presentations reference the original `PartProperty` or `ReferenceProperty`, a parent presentation, relative geometry, and collapse state. No semantic element is cloned. Connector ends use stable structured paths such as:

```json
[{ "propertyId": "receiverPartId", "typeId": "receiverBlockId" }]
```

`sourcePropertyPath` and `targetPropertyPath` are independent; port IDs remain in `sourcePortId` and `targetPortId`. Normalization migrates resolvable legacy ID/name paths. Names are rebuilt from live semantic elements, so renames do not break references.

## Ports, interfaces, connectors, and flows

Port presentations persist their owning presentation, perimeter side, and normalized offset. ProxyPorts require InterfaceBlock types. Compatibility includes inherited FlowProperties, conveyed types, direction, and conjugation. FullPorts use classifier compatibility.

Assembly connectors join internal roles or compatible ports. Delegation connectors join an outer boundary to internal structure. Connector kind is controlled as `assembly` or `delegation`.

ItemFlows persist stable IDs, direction, `conveyedClassifierIds`, optional item property, name, and documentation. `conveyedIds` remains mirrored for backward compatibility.

## Import and migration

Presentation rows accept `Parent Presentation ID`, `Property Path IDs`, `Port Side`, `Perimeter Offset`, `Relative X`, `Relative Y`, and `Collapsed`. ItemFlow rows accept `Conveyed Classifier IDs`, `Item Property ID`, `Direction`, and `Documentation`. Reimport retains existing geometry when geometry is absent. Unresolved paths remain visible to validation and are never silently re-owned at model root.

## Navigation and known limitations

Child IBDs resolve from the displayed property's classifier. Creation stays explicit; an IBD is never generated automatically for every Block. The obstacle router is a lightweight rectangular orthogonal router, not a general graph-layout solver.

## Manual verification

1. Create a Block, a typed PartProperty, and a nested typed PartProperty.
2. Create an IBD with the outer Block as context and place both existing parts.
3. Add compatible, oppositely directed ProxyPorts and move them around sides.
4. Create assembly and delegation connectors and add conveyed classifiers.
5. Rename types and properties and confirm labels update without broken paths.
6. Save, export/import JSON, reload, and verify nesting, paths, offsets, and ItemFlows.
7. Run `npm test`, `npm run check`, and `npm run versions:dry-run`.
