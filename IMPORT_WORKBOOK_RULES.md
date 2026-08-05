# Systems Modeler CATIA/Cameo Excel Import Rules

This document defines the workbook rules for creating Excel files that import correctly into the Systems Modeler collaborative SysML environment.

The rules are designed for the current CATIA/Cameo-oriented importer and for safe multi-workbook imports where later workbooks reuse elements created by earlier workbooks.

---

## 1. Core Import Principles

Every imported model object must be identified, owned, typed, and related explicitly.

Use these rules in every workbook:

1. Every semantic element must have a stable `External ID`.
2. Every owned element must reference its owner by `Owner External ID`.
3. Every relationship must reference existing source and target IDs.
4. Every diagram must have an explicit owner and context.
5. Every diagram presentation must reference an existing semantic element or relationship.
6. Names may change; stable IDs must not change.
7. Later workbooks should reuse existing IDs instead of recreating equivalent elements.
8. Do not create blank, unowned, or duplicate packages.
9. Do not create a diagram for every Block. Create child diagrams only when the Block or behavior is actually decomposed.
10. Import parents before children, semantic elements before relationships, and relationships before diagram presentations.

---

## 2. Workbook Formatting Rules

### 2.1 File type

Use:

```text
.xlsx
```

Avoid macros unless the workbook is only being used outside the importer.

### 2.2 Header row

The importer scans the first 40 rows for the actual header row.

The header row should contain recognizable columns such as:

```text
External ID
Name
Owner External ID
Metaclass
Applied Stereotype
```

Guidance rows above the header are allowed, but the actual table must be rectangular and consistent.

### 2.3 One table per sheet

Each import sheet should contain one primary table.

Avoid:

- Multiple unrelated tables on the same sheet
- Merged cells inside the data table
- Hidden header rows
- Duplicate column names
- Formulas that return inconsistent data types
- Blank rows inside the active data range

### 2.4 IDs must be text

Format all ID columns as Text in Excel.

Recommended:

```text
PKG_FSBS_ENTERPRISE
BLK_TRANSMITTER
REQ_FSBS_001
DGM_FSBS_CONTEXT_BDD
REL_REQ_SAT_001
```

Do not rely on Excel-generated numeric IDs.

---

## 3. Recommended Import Order

Use this order when importing one or more workbooks:

```text
1. Packages
2. Libraries, profiles, units, quantity kinds, and value types
3. Requirements
4. Blocks, interface blocks, actors, use cases, activities, state machines, interactions
5. Properties, ports, parameters, states, actions, lifelines, instances
6. Generalizations and semantic relationships
7. Connectors and connector ends
8. Item flows and allocations
9. Diagrams
10. Diagram shapes
11. Diagram edges
12. Parent/child diagram links
13. Verification and traceability records
```

When multiple workbooks are used, import common or enterprise foundations before site-specific workbooks.

---

## 4. Standard Identifier Columns

These columns are used throughout the import format.

| Column | Purpose |
|---|---|
| `External ID` | Stable unique ID for the row's semantic object |
| `Name` | Display name |
| `Owner External ID` | Stable ID of the owning package or element |
| `Qualified Name String` | Full namespace path, when supplied |
| `Owner Qualified Name String` | Full namespace path of the owner |
| `Metaclass` | UML metaclass such as Package, Class, Property, Port |
| `Applied Stereotype` | SysML stereotype such as SysML::Block |
| `Import Action` | Create, Merge, Update, Skip, Delete, or Reference |
| `Documentation` | Element documentation |
| `Lifecycle Status` | Draft, Approved, Retired, etc. |
| `Source File` | Optional source-document name |
| `Source Section` | Optional source-document section |
| `Tags` | Optional serialized custom values |

### 4.1 External ID rules

External IDs must be:

- Unique across the whole project
- Stable across reimports
- Free of leading or trailing spaces
- Free of accidental Excel scientific notation
- Used consistently in relationships and diagrams

Good:

```text
BLK_FSBS_ENTERPRISE_SYSTEM
PORT_TX_RF_OUTPUT
REQ_FSBS_001
```

Bad:

```text
1
BlockA
A-1 on one sheet and A1 on another
```

---

## 5. Package Import Rules

Use the sheet:

```text
Packages_Import
```

Recommended columns:

```text
Import Order
External ID
Name
Metaclass
Applied Stereotype
Owner External ID
Qualified Name String
Owner Qualified Name String
Documentation
Import Action
```

Rules:

- Top-level package owner is the project model root or blank only when the importer profile explicitly permits it.
- Every child package must identify its parent.
- Package chains must be complete.
- Do not duplicate package IDs in later workbooks.
- Reuse the same package ID when adding new content to an existing package.
- Diagram packages must exist before diagrams are imported.

Example:

| External ID | Name | Metaclass | Owner External ID |
|---|---|---|---|
| `PKG_FSBS` | FSBS | Package | |
| `PKG_FSBS_REQ` | Requirements | Package | `PKG_FSBS` |
| `PKG_FSBS_STRUCT` | Structure | Package | `PKG_FSBS` |
| `PKG_FSBS_BDD` | BDD | Package | `PKG_FSBS_STRUCT` |

---

## 6. Semantic Element Sheets

The importer recognizes these common sheets.

| Sheet | Imported kind |
|---|---|
| `Blocks_Import` | Block |
| `Interface_Blocks_Import` | InterfaceBlock |
| `Constraint_Blocks_Import` | ConstraintBlock |
| `Requirements_Import` | Requirement |
| `Actors_Import` | Actor |
| `Use_Cases_Import` | UseCase |
| `Activities_Import` | Activity |
| `State_Machines_Import` | StateMachine |
| `Interactions_Import` | Interaction |
| `Value_Types_Import` | ValueType |
| `Data_Types_Import` | DataType |
| `Enumerations_Import` | Enumeration |
| `Signals_Import` | Signal |
| `Instances_Import` | InstanceSpecification |

Common required columns:

```text
External ID
Name
Owner External ID
Metaclass
Applied Stereotype
Documentation
Import Action
```

---

## 7. Requirement Import Rules

Use:

```text
Requirements_Import
```

Recommended columns:

```text
Import Order
External ID
Name
Requirement ID
Requirement Text
Owner External ID
Parent Requirement External ID
Applied Stereotype
Status
Priority
Risk
Verification Method
Rationale
Source
Requirement Owner
Documentation
Import Action
```

Required:

- `External ID`
- `Name`
- `Requirement ID`
- `Requirement Text`
- `Owner External ID`

Rules:

- Requirement text must not be blank.
- Requirement IDs must remain stable.
- Parent requirements must exist before child requirements.
- Use explicit relationships for derive, satisfy, verify, refine, trace, and copy.
- Do not use containment as a substitute for semantic requirement relationships.

---

## 8. Properties and Ports

### 8.1 Part properties

Use:

```text
Part_Properties
```

Recommended columns:

```text
External ID
Name
Owner External ID
Type External ID
Multiplicity
Lower
Upper
Aggregation
Is Ordered
Is Unique
Redefined Property External ID
Subsetted Property External ID
Default Value
Documentation
Import Action
```

Rules:

- Owner must be a Block.
- Type should reference a Block or compatible classifier.
- Use `composite` aggregation for true owned parts.
- Use the same stable ID during reimport.

### 8.2 Reference properties

Use:

```text
Reference_Properties
```

Owner must normally be a Block.

### 8.3 Value properties

Use:

```text
Value_Properties
```

Recommended additional columns:

```text
Type External ID
Unit External ID
Quantity Kind External ID
Default Value
Dimension
```

### 8.4 Flow properties

Use:

```text
Flow_Properties_Import
```

Recommended additional columns:

```text
Direction
Type External ID
Multiplicity
```

Direction must be:

```text
in
out
inout
```

### 8.5 Constraint properties

Use:

```text
Constraint_Properties
```

Owner should be a Block or Constraint Block.

### 8.6 Proxy and full ports

Use:

```text
Proxy_Ports_Import
Full_Ports_Import
```

Recommended columns:

```text
External ID
Name
Owner External ID
Type External ID
Multiplicity
Is Conjugated
Provided Interface IDs
Required Interface IDs
Nested Port Owner External ID
Documentation
Import Action
```

For multiple IDs, separate values with semicolons:

```text
IFACE_POWER;IFACE_CONTROL
```

---

## 9. Generalizations and Associations

### 9.1 Generalizations

Use:

```text
Generalizations_Import
```

Columns:

```text
External ID
Specific External ID
General External ID
Name
Owner External ID
Documentation
Import Action
```

### 9.2 Associations

Use:

```text
Relationships_Import
```

or a dedicated association sheet.

Recommended columns:

```text
External ID
Relationship Type
Source External ID
Target External ID
Source Role
Target Role
Source Multiplicity
Target Multiplicity
Source Navigable
Target Navigable
Aggregation
Association Block External ID
Owner External ID
Documentation
Import Action
```

Relationship types may include:

```text
Association
AssociationBlock
Generalization
Dependency
Realization
Composition
Aggregation
```

---

## 10. Requirement and Traceability Relationships

Use:

```text
Relationships_Import
Requirement_Satisfaction
Capability_Allocations
```

Recommended relationship columns:

```text
External ID
Relationship Type
Source External ID
Target External ID
Owner External ID
Name
Applied Stereotype
Documentation
Import Action
```

Supported common relationship types:

```text
Satisfy
Verify
Refine
DeriveReqt
Trace
Copy
Allocate
Dependency
Abstraction
Realization
Include
Extend
```

Direction matters.

Examples:

```text
Block -> Requirement        Satisfy
TestCase -> Requirement     Verify
Requirement -> Requirement DeriveReqt
UseCase -> Requirement      Refine
```

---

## 11. Connectors and Connector Ends

### 11.1 Connectors

Use:

```text
Connectors_Import
```

Recommended columns:

```text
External ID
Name
Owner External ID
Connector Kind
Type External ID
Source External ID
Target External ID
Source Part With Port Path
Target Part With Port Path
Source Port External ID
Target Port External ID
Documentation
Import Action
```

Connector Kind:

```text
assembly
delegation
binding
```

Rules:

- Owner must be the IBD context Block.
- Source and target must resolve to valid parts, properties, or ports.
- Nested connector paths must be explicit.
- Connector type should reference an Association or Association Block when applicable.

### 11.2 Connector ends

Use:

```text
Connector_Ends
```

Recommended columns:

```text
External ID
Connector External ID
End Number
Role External ID
Part With Port External ID
Nested Property Path
Port External ID
Multiplicity
```

Use one row per connector end.

---

## 12. Item Flows

Use:

```text
Item_Flows_Import
```

Recommended columns:

```text
External ID
Name
Owner External ID
Realizing Connector External ID
Source External ID
Target External ID
Conveyed Classifier IDs
Item Property External ID
Direction
Documentation
Import Action
```

Rules:

- A conveyed classifier is required.
- Multiple conveyed classifiers use semicolons.
- The source and target must agree with the connector direction.
- The conveyed type must be compatible with connected interfaces or flow properties.

---

## 13. Behavior Import Rules

### 13.1 Activities and actions

Use:

```text
Activities_Import
Actions_Import
Activity_Parameters
Pins_Import
Activity_Partitions
```

Action kinds may include:

```text
Action
CallBehaviorAction
CallOperationAction
SendSignalAction
AcceptEventAction
StructuredActivityNode
ExpansionRegion
InterruptibleActivityRegion
```

Flow sheets:

```text
Control_Flows_Import
Object_Flows_Import
```

Recommended flow columns:

```text
External ID
Source External ID
Target External ID
Guard
Weight
Object Type External ID
Interrupting
Owner External ID
```

### 13.2 State machines

Use:

```text
State_Machines_Import
Regions_Import
States_Import
Transitions_Import
Events_Import
```

Transition columns:

```text
External ID
Source External ID
Target External ID
Trigger External ID
Guard
Effect
Transition Kind
Owner External ID
```

Transition Kind:

```text
external
internal
local
completion
```

### 13.3 Sequence diagrams

Use:

```text
Interactions_Import
Lifelines_Import
Messages_Import
Execution_Specifications
Combined_Fragments
Interaction_Operands
Gates_Import
Interaction_Uses
Time_Constraints
Duration_Constraints
```

Message Sort values:

```text
synchronous
asynchronous
reply
create
delete
```

Combined fragment operators:

```text
alt
opt
loop
par
break
critical
```

---

## 14. Parametric Import Rules

Use:

```text
Constraint_Blocks_Import
Constraint_Parameters
Constraint_Properties
Binding_Connectors
Value_Properties
```

Constraint Block columns should include:

```text
External ID
Name
Owner External ID
Constraint Expression
Documentation
```

Constraint parameter columns:

```text
External ID
Name
Owner External ID
Type External ID
Unit External ID
Quantity Kind External ID
Direction
```

Binding connectors must reference valid value or constraint properties.

---

## 15. Instances and Configurations

Use:

```text
Instances_Import
Slots_Import
Instance_Connectors
Configurations_Import
Configuration_Memberships
Variants_Import
Variation_Points_Import
```

Instance columns:

```text
External ID
Name
Owner External ID
Classifier External ID
Documentation
```

Slot columns:

```text
External ID
Instance External ID
Defining Feature External ID
Value
Value Instance External ID
```

---

## 16. Diagram Import Rules

### 16.1 Diagram definitions

Use:

```text
Diagrams_Import
```

Required columns:

```text
Diagram External ID
Name
Diagram Type
Owner External ID
Context External ID
```

Recommended columns:

```text
Canvas Width
Canvas Height
Displayed Element IDs
Relationship IDs
Auto Layout
Documentation
Import Action
```

Allowed diagram types:

```text
Block Definition Diagram
Internal Block Diagram
Requirement Diagram
Use Case Diagram
Activity Diagram
State Machine Diagram
Sequence Diagram
Parametric Diagram
Package Diagram
Instance Diagram
```

Rules:

- Every diagram must have an explicit owner package.
- The owner package must already exist.
- Every diagram must have a valid semantic context.
- BDD context is normally a package or Block.
- IBD context must be a Block.
- Activity Diagram context should be an Activity.
- State Machine Diagram context should be a State Machine or Block.
- Sequence Diagram context should be an Interaction, Use Case, or Block.
- Parametric Diagram context should be a Block or Constraint Block.

### 16.2 Diagram shapes

Use:

```text
Diagram_Shapes
```

Columns:

```text
Presentation ID
Diagram External ID
Element External ID
X
Y
Width
Height
Z Order
Parent Presentation ID
Show Stereotype
Show Compartments
Compartment Names
Style Name
```

Rules:

- `Element External ID` must reference an existing semantic element.
- Do not duplicate the semantic element just to place it on another diagram.
- Multiple shapes may reference the same semantic element.

### 16.3 Diagram edges

Use:

```text
Diagram_Edges
```

Columns:

```text
Presentation ID
Diagram External ID
Relationship External ID
Source Presentation ID
Target Presentation ID
Routing Style
Bendpoints
Label X
Label Y
Z Order
Style Name
```

Bendpoints may be encoded as:

```text
100,200;250,200;250,350
```

### 16.4 Displayed element lists

When using list columns in `Diagrams_Import`, separate IDs with semicolons:

```text
BLK_A;BLK_B;BLK_C
```

Explicit `Diagram_Shapes` rows are preferred when precise layout is required.

---

## 17. Parent and Child Diagram Navigation

Use:

```text
Element_Diagram_Links
```

Recommended columns:

```text
External ID
Source Element External ID
Target Diagram External ID
Source Diagram External ID
Link Type
Is Primary
Navigation Label
Import Action
```

Rules:

- Only create child links where semantic decomposition exists.
- Do not give every Block an IBD.
- A Block should link to an IBD only if parts, ports, connectors, flows, or internal values are modeled.
- An Activity should link to its Activity Diagram.
- A State Machine should link to its State Machine Diagram.
- An Interaction should link to its Sequence Diagram.
- Mark only one primary child diagram per element and diagram type unless intentionally modeled otherwise.

---

## 18. Import Action Rules

Supported actions:

| Action | Behavior |
|---|---|
| `Create` | Create the element; report a conflict if the ID exists |
| `Merge` | Create if missing, otherwise update supplied fields |
| `Update` | Update an existing element; report if missing |
| `Reference` | Resolve and reuse an existing element without recreating it |
| `Skip` | Ignore the row |
| `Delete` | Delete the identified element or relationship |

Recommended default:

```text
Merge
```

Use `Reference` for common-library elements already imported by another workbook.

---

## 19. Reimport Rules

For safe reimport:

1. Never change an existing External ID.
2. Use `Merge` or `Update`.
3. Do not recreate existing packages under new IDs.
4. Do not recreate the same relationship with a different ID.
5. Keep diagram IDs stable.
6. Keep presentation IDs stable when preserving layout.
7. Keep parent/child diagram-link IDs stable.
8. Use `Delete` only for deliberate removals.
9. Review the import report before committing major changes.
10. Export a project archive before large reimports.

---

## 20. Workbook Validation Checklist

Before import, verify:

### Packages

- [ ] Every child package has an owner
- [ ] Owner chain is complete
- [ ] No duplicate package IDs
- [ ] Diagram packages exist

### Elements

- [ ] Every element has an External ID
- [ ] Every owned element has an owner
- [ ] Every typed property or port has a valid type
- [ ] Requirements have ID and text
- [ ] Stable IDs are reused across workbooks

### Relationships

- [ ] Source ID exists
- [ ] Target ID exists
- [ ] Relationship direction is correct
- [ ] Relationship type is supported
- [ ] Connector ends resolve
- [ ] Item flows have conveyed classifiers

### Diagrams

- [ ] Diagram owner exists
- [ ] Diagram context exists
- [ ] Diagram type matches the context
- [ ] Shape elements exist
- [ ] Edge relationships exist
- [ ] Parent/child links reference valid diagrams

### Reimport

- [ ] Import Action is intentional
- [ ] Existing IDs are not changed
- [ ] No accidental duplicate packages
- [ ] No accidental duplicate diagrams
- [ ] Project backup exists

---

## 21. Minimal Valid Workbook Example

A minimal BDD workbook may contain:

```text
Packages_Import
Blocks_Import
Relationships_Import
Diagrams_Import
Diagram_Shapes
Diagram_Edges
```

A minimal IBD workbook may contain:

```text
Packages_Import
Blocks_Import
Part_Properties
Proxy_Ports_Import
Connectors_Import
Connector_Ends
Item_Flows_Import
Diagrams_Import
Diagram_Shapes
Diagram_Edges
Element_Diagram_Links
```

A minimal requirements workbook may contain:

```text
Packages_Import
Requirements_Import
Relationships_Import
Diagrams_Import
Diagram_Shapes
Diagram_Edges
```

---

## 22. Recommended Naming Style

Use consistent lower camel case for ordinary element names where appropriate:

```text
enterpriseSystem
primaryTransmitter
antennaSubsystem
rfOutputPort
```

Use readable names for requirements and diagrams:

```text
Transmit Mission Message
Enterprise Context BDD
Primary Transmitter IBD
```

Use uppercase stable-ID prefixes:

```text
PKG_
BLK_
REQ_
PORT_
PROP_
REL_
DGM_
PRS_
ACT_
STM_
SEQ_
CON_
FLOW_
INST_
CFG_
```

---

## 23. Important Final Rule

The workbook must describe a semantic model, not only a drawing.

Correct order:

```text
Create semantic elements
Create semantic relationships
Create diagrams
Present existing semantic elements and relationships on diagrams
Link valid parent and child diagrams
```

Do not create disconnected diagram-only objects.

