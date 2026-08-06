# Semantic modeling core

The semantic core treats diagram symbols as presentations of repository data,
not as independent drawing objects.

## Typed features

Part and reference properties, value and flow properties, constraint
properties, ports, and parameters store a classifier ID in `typeRef`. The
property editor offers compatible classifiers from the repository; unresolved,
missing, and incompatible classifiers are validation errors. Display names are
resolved from the classifier on every render, so classifier renames appear
immediately without rewriting dependent features.

## Inheritance

A `Generalization` points from the specialized classifier to its parent.
Classifier compartments combine owned features with recursively inherited
properties, ports, operations, and receptions. Inherited rows use a `^` prefix.
An owned feature overrides an inherited feature by matching its kind and name or
by listing the inherited feature ID in `redefinedPropertyIds`.

## Composition and aggregation

A composition from a whole to a part classifier owns a synchronized
`PartProperty`. An aggregation similarly owns a synchronized
`ReferenceProperty`. The generated property retains a deterministic link to the
relationship through `compositionRelationshipId` and synchronizes its owner,
classifier, role name, and multiplicity. Removing the relationship removes its
generated property.

## Association ends

Associations persist two end IDs together with role name, multiplicity,
aggregation (`none`, `shared`, or `composite`), navigability, and end ownership.
These values are editable in the relationship inspector and validated as part
of the semantic model.

