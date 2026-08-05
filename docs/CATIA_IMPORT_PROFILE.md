# CATIA/Cameo Excel Import Profile

The profile is intentionally editable in GitHub at:

`public/src/import/profiles/catia-cameo.js`

The importer uses these stages:

1. Scan up to 40 rows to locate each sheet's real header.
2. Classify the sheet through the CATIA/Cameo profile.
3. Stage elements and create package paths when a workbook provides package names instead of IDs.
4. Resolve owners, types, interfaces, classifiers, requirement parents, and instance references.
5. Import constraint equations.
6. Import diagrams and contexts.
7. Import relationships, connector ends, ports, item flows, allocations, transitions, messages, and bindings.
8. Import diagram shapes, exact coordinates, sizes, z-order, edge routing and bendpoints.
9. Resolve element-to-child-diagram navigation.
10. Validate the staged graph and commit or roll back.

The regression fixture `test/fixtures/catia-workbook-layouts.json` contains sheet and header layouts extracted from the supplied example workbooks. Run:

```bash
npm run import-audit
```

The default import mode is tolerant (`strict=false`) so references to elements expected from an earlier workbook are reported without discarding all valid rows. The UI may enable strict mode for an all-or-nothing controlled baseline import.

## Regression workbook set

The sheet/header regression suite was generated from these supplied workbooks:

- FSBS Top Level 01 Enterprise Requirements
- FSBS Top Level 02 Enterprise Mission, Capabilities, and Use Cases
- FSBS Top Level 03 Enterprise Mission and Capabilities
- FSBS Top Level 04 Enterprise Logical Structure
- Grindavik 1000FT BDD/IBD
- Grindavik 1000FT Behavioral
- Grindavik 1000FT Parametrics, Instances, and Model Completeness
- Grindavik 1000FT Combined Comprehensive and Unit Organized
- Grindavik 1000FT Comprehensive CATIA/Cameo

The fixture stores schemas and header locations, not the proprietary workbook contents.
